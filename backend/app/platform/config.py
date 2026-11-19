"""Runtime settings, read from environment variables once at startup."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


@dataclass(frozen=True)
class Settings:
    data_dir: Path
    queued_delay_s: float
    processing_delay_s: float
    provider_timeout_s: float
    max_attempts: int

    @property
    def db_path(self) -> Path:
        return self.data_dir / "app.db"

    @property
    def assets_dir(self) -> Path:
        return self.data_dir / "assets"

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            data_dir=Path(os.environ.get("DATA_DIR", REPO_ROOT / "data")).resolve(),
            queued_delay_s=float(os.environ.get("MOCK_QUEUED_DELAY_S", "1.5")),
            processing_delay_s=float(os.environ.get("MOCK_PROCESSING_DELAY_S", "3.0")),
            provider_timeout_s=float(os.environ.get("PROVIDER_TIMEOUT_S", "30")),
            max_attempts=int(os.environ.get("MAX_ATTEMPTS", "3")),
        )
