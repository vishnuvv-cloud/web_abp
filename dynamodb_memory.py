from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import boto3
from boto3.dynamodb.conditions import Key

from settings import settings


def _ddb_value(value: Any) -> Any:
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {str(k): _ddb_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_ddb_value(v) for v in value]
    return value


class DynamoDBMemory:
    """DynamoDB is the durable source of workflow state and stage outputs."""

    def __init__(self, table_name: str | None = None, region: str | None = None) -> None:
        resource = boto3.resource("dynamodb", region_name=region or settings.aws_region)
        self.table = resource.Table(table_name or settings.dynamodb_table)

    def put_stage(self, case_key: str, stage: str, payload: dict[str, Any], *, status: str,
                  attempts: int = 0, current_stage: str | None = None) -> None:
        item = {
            "case_id": str(case_key), "workflow_stage": stage,
            "payload": _ddb_value(payload), "workflow_status": status,
            "attempts": attempts, "current_stage": current_stage or stage,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.table.put_item(Item=item)

    def get_stage(self, case_key: str, stage: str) -> dict[str, Any] | None:
        response = self.table.get_item(Key={"case_id": str(case_key), "workflow_stage": stage}, ConsistentRead=True)
        return response.get("Item")

    def get_workflow(self, case_key: str) -> list[dict[str, Any]]:
        response = self.table.query(KeyConditionExpression=Key("case_id").eq(str(case_key)), ConsistentRead=True)
        return response.get("Items", [])

    def get_incomplete_workflows(self) -> list[dict[str, Any]]:
        """Startup recovery for the local single-manager deployment; production should use a status GSI."""
        response = self.table.scan(FilterExpression="#s = :in_progress AND workflow_stage = :workflow",
                                   ExpressionAttributeNames={"#s": "workflow_status"},
                                   ExpressionAttributeValues={":in_progress": "IN_PROGRESS", ":workflow": "WORKFLOW"})
        items = response.get("Items", [])
        while response.get("LastEvaluatedKey"):
            response = self.table.scan(FilterExpression="#s = :in_progress AND workflow_stage = :workflow",
                                       ExpressionAttributeNames={"#s": "workflow_status"},
                                       ExpressionAttributeValues={":in_progress": "IN_PROGRESS", ":workflow": "WORKFLOW"},
                                       ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))
        return items

    def record_progress(self, case_key: str, stage: str, output: dict[str, Any], status: str) -> None:
        self.put_stage(case_key, stage, output, status=status, current_stage=stage)