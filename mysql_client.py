from __future__ import annotations

import json
from contextlib import contextmanager
from typing import Any, Iterator

import pymysql
from pymysql.cursors import DictCursor

from settings import settings


class MySQLClient:
    """RDS MySQL client integrated directly with settings module."""

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