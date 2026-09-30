from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # --- AWS Configuration ---
    aws_region: str = "us-east-1"
    bedrock_model_id: str = "amazon.nova-pro-v1:0"

    # --- Database Credentials (Direct) ---
    db_host: str = "abp-engine-db.cs9y4c2089e1.us-east-1.rds.amazonaws.com"  # Replace with your DB host
    db_port: int = 3306
    db_name: str = "abp_engine"  # Replace with your DB name
    db_user: str = "admin"  # Replace with your DB username
    db_password: str = "Vishnu2oo4"  # Replace with your DB password

    # --- AWS Resource Names ---
    dynamodb_table: str = "agent_memory"
    kinesis_stream_name: str = "abp-case-stream"

    # --- Execution Settings ---
    max_stage_concurrency: int = 4
    max_stage_attempts: int = 3
    poll_interval_seconds: float = 1.0

    def validate_runtime(self) -> None:
        """Validates that required settings are not empty."""
        missing = []
        if not self.db_host:
            missing.append("db_host")
        if not self.db_name:
            missing.append("db_name")
        if not self.db_user:
            missing.append("db_user")

        if missing:
            raise RuntimeError(f"Missing required settings: {', '.join(missing)}")


# Single global settings instance
settings = Settings()