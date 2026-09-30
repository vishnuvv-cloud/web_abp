from __future__ import annotations

import json
from contextlib import contextmanager
from typing import Any, Iterator

import pymysql
from pymysql.cursors import DictCursor

from settings import settings


class MySQLClient:
    """RDS MySQL client utilizing settings configuration."""

    def __init__(self) -> None:
        self._config = {
            "host": settings.db_host,
            "port": settings.db_port,
            "user": settings.db_user,
            "password": settings.db_password,
            "database": settings.db_name,
            "cursorclass": DictCursor,
            "charset": "utf8mb4",
            "autocommit": False,
            "connect_timeout": 10,
            "read_timeout": 30,
            "write_timeout": 30,
        }

    @contextmanager
    def transaction(self) -> Iterator[Any]:
        connection = pymysql.connect(**self._config)
        try:
            yield connection
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def fetch_all(self, sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        with self.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return list(cur.fetchall())

    def execute(self, sql: str, params: tuple[Any, ...] = ()) -> int:
        with self.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return int(cur.lastrowid or cur.rowcount)

    @staticmethod
    def json_value(value: Any) -> str:
        return json.dumps(value, ensure_ascii=False, default=str)


class ABPRepository:
    """Explicit RDS Repository for Agent Operations."""

    def __init__(self, client: MySQLClient | None = None) -> None:
        self.client = client or MySQLClient()
        self.operation_count = 0

    def register_case(self, payload: dict[str, Any], decision: dict[str, Any], status: str, case_number: str) -> int:
        self.operation_count += 1
        with self.client.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO case_master (case_number, patient_token, prescriber_token, payer_id, payer_name, plan_type, current_state, owner_role, owner_id, created_at, updated_at) "
                    "VALUES (%s,%s,%s,%s,%s,%s,'UNKNOWN','UNKNOWN','UNKNOWN',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
                    (
                        case_number,
                        payload.get("patient_token"),
                        payload.get("prescriber_token"),
                        payload.get("payer_id"),
                        payload.get("payer_name"),
                        payload.get("plan_type"),
                    ),
                )
                case_id = int(cur.lastrowid)

                for index, rx in enumerate(payload.get("prescriptions", []), start=1):
                    cur.execute(
                        "INSERT INTO prescriptions (prescription_id, case_id, drug_id, drug_name, diagnosis_code, diagnosis_name, quantity, days_supply, created_at) "
                        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,CURRENT_TIMESTAMP)",
                        (
                            str(rx.get("prescription_id") or f"{case_number}-{index}"),
                            case_id,
                            rx.get("drug_id"),
                            rx.get("drug_name"),
                            rx.get("diagnosis_code"),
                            rx.get("diagnosis_name"),
                            rx.get("quantity"),
                            rx.get("days_supply"),
                        ),
                    )

                cur.execute("UPDATE case_master SET current_state=%s, updated_at=CURRENT_TIMESTAMP WHERE case_id=%s", (status, case_id))

                cur.execute(
                    "INSERT INTO case_state_history (case_id, previous_state, new_state, changed_by, changed_at, comments) "
                    "VALUES (%s,'UNKNOWN',%s,%s,CURRENT_TIMESTAMP,%s)",
                    (case_id, status, "abp-intake-agent", str(decision.get("validation_reason", ""))[:500]),
                )

                if status == "INVALID":
                    cur.execute(
                        "INSERT INTO quarantine_cases (source_event_id, validation_error, payload, created_at, case_id) "
                        "VALUES (%s,%s,%s,CURRENT_TIMESTAMP,%s)",
                        (
                            str(payload.get("source_event_id", case_number)),
                            str(decision.get("validation_reason", "Invalid input"))[:500],
                            self.client.json_value(payload),
                            case_id,
                        ),
                    )
        return case_id

    def load_assessment_context(self, case_id: int) -> dict[str, Any]:
        self.operation_count += 1
        case = self.client.fetch_all("SELECT * FROM case_master WHERE case_id=%s", (case_id,))[0]
        prescriptions = self.client.fetch_all("SELECT * FROM prescriptions WHERE case_id=%s", (case_id,))
        knowledge = {
            "payer_rule_pack": self.client.fetch_all("SELECT * FROM payer_rule_pack WHERE payer_id=%s AND status='ACTIVE'", (case["payer_id"],)),
            "drug_access_rules": self.client.fetch_all("SELECT dar.* FROM drug_access_rules dar JOIN payer_rule_pack prp ON prp.rule_pack_id=dar.rule_pack_id WHERE prp.payer_id=%s", (case["payer_id"],)),
            "barrier_taxonomy": self.client.fetch_all("SELECT * FROM barrier_taxonomy"),
        }
        return {"case": case, "prescriptions": prescriptions, "knowledge": knowledge}

    def save_assessment(self, case_id: int, output: dict[str, Any]) -> int:
        self.operation_count += 1
        with self.client.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO case_assessment (case_id, model_version, feature_set_version, risk_score, risk_band, confidence, bscore, predicted_barriers, reason_codes, rule_pack_id, decision_timestamp, created_at, assignment_created, assessment_status, is_current) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,0,'COMPLETED',1)",
                    (
                        case_id,
                        output.get("model_version", "bedrock"),
                        output.get("feature_set_version", "v1"),
                        output["risk_score"],
                        output["risk_band"],
                        output.get("confidence", 0.5),
                        output["bscore"],
                        self.client.json_value(output.get("predicted_barriers", [])),
                        self.client.json_value(output.get("reason_codes", [])),
                        output.get("rule_pack_id"),
                    ),
                )
                assessment_id = int(cur.lastrowid)
                cur.execute("UPDATE case_master SET current_state='ASSESSED', updated_at=CURRENT_TIMESTAMP WHERE case_id=%s", (case_id,))
                cur.execute(
                    "INSERT INTO case_state_history (case_id, previous_state, new_state, changed_by, changed_at, comments) "
                    "VALUES (%s,'VALID','ASSESSED',%s,CURRENT_TIMESTAMP,%s)",
                    (case_id, "abp-assessment-agent", "LLM assessment completed"),
                )
        return assessment_id

    def load_routing_context(self, case_id: int, assessment_id: int) -> dict[str, Any]:
        self.operation_count += 1
        return {
            "case": self.client.fetch_all("SELECT * FROM case_master WHERE case_id=%s", (case_id,))[0],
            "assessment": self.client.fetch_all("SELECT * FROM case_assessment WHERE assessment_id=%s", (assessment_id,))[0],
            "routing_rules": self.client.fetch_all("SELECT * FROM routing_rules WHERE active_flag=1"),
            "users": self.client.fetch_all("SELECT * FROM users WHERE active_flag=1"),
        }

    def save_assignment(self, case_id: int, output: dict[str, Any]) -> int:
        self.operation_count += 1
        with self.client.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO case_assignments (case_id, role_type, user_id, assignment_reason, assignment_status, assigned_at) "
                    "VALUES (%s,%s,%s,%s,'ASSIGNED',CURRENT_TIMESTAMP)",
                    (case_id, output["owner_role"], output.get("owner_id"), str(output.get("assignment_reason", ""))[:255]),
                )
                assignment_id = int(cur.lastrowid)
                cur.execute(
                    "UPDATE case_master SET owner_role=%s, owner_id=%s, current_state='ASSIGNED', updated_at=CURRENT_TIMESTAMP WHERE case_id=%s",
                    (output["owner_role"], str(output.get("owner_id", "UNKNOWN")), case_id),
                )
                cur.execute(
                    "INSERT INTO case_state_history (case_id, previous_state, new_state, changed_by, changed_at, comments) "
                    "VALUES (%s,'ASSESSED','ASSIGNED',%s,CURRENT_TIMESTAMP,%s)",
                    (case_id, "abp-routing-agent", "LLM routing decision"),
                )
        return assignment_id

    def load_explanation_context(self, case_id: int) -> dict[str, Any]:
        self.operation_count += 1
        return {
            "case": self.client.fetch_all("SELECT * FROM case_master WHERE case_id=%s", (case_id,))[0],
            "assessment": self.client.fetch_all(
                "SELECT * FROM case_assessment WHERE case_id=%s AND is_current=1 ORDER BY assessment_id DESC LIMIT 1", (case_id,)
            )[0],
            "assignment": self.client.fetch_all("SELECT * FROM case_assignments WHERE case_id=%s ORDER BY assignment_id DESC LIMIT 1", (case_id,))[
                0
            ],
        }

    def save_insight(self, case_id: int, output: dict[str, Any]) -> None:
        self.operation_count += 1
        with self.client.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO case_insights (case_id, executive_summary, key_findings, recommendations, generated_by, created_at) "
                    "VALUES (%s,%s,%s,%s,%s,CURRENT_TIMESTAMP)",
                    (
                        case_id,
                        output["summary"],
                        self.client.json_value(output.get("findings", [])),
                        self.client.json_value(output.get("recommendations", [])),
                        "abp-explainer-agent",
                    ),
                )
                cur.execute("UPDATE case_master SET current_state='EXPLAINED', updated_at=CURRENT_TIMESTAMP WHERE case_id=%s", (case_id,))
                cur.execute(
                    "INSERT INTO case_state_history (case_id, previous_state, new_state, changed_by, changed_at, comments) "
                    "VALUES (%s,'ASSIGNED','EXPLAINED',%s,CURRENT_TIMESTAMP,%s)",
                    (case_id, "abp-explainer-agent", "LLM explanation completed"),
                )