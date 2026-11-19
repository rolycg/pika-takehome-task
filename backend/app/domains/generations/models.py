"""Generation entity, its allowed inputs, and its lifecycle rules."""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from enum import StrEnum


class Status(StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class AspectRatio(StrEnum):
    SQUARE = "1:1"
    LANDSCAPE = "16:9"
    PORTRAIT = "9:16"


class Style(StrEnum):
    PHOTOREALISTIC = "Photorealistic"
    ILLUSTRATION = "Illustration"
    CINEMATIC = "Cinematic"


ACTIVE_STATUSES = frozenset({Status.QUEUED, Status.PROCESSING})
TERMINAL_STATUSES = frozenset({Status.SUCCEEDED, Status.FAILED})

# Every legal status change. Anything else is a bug and is rejected by the repository.
ALLOWED_TRANSITIONS: dict[Status, frozenset[Status]] = {
    Status.QUEUED: frozenset({Status.PROCESSING, Status.FAILED}),
    # processing -> queued only happens in startup recovery (resume after restart).
    Status.PROCESSING: frozenset({Status.SUCCEEDED, Status.FAILED, Status.QUEUED}),
    Status.SUCCEEDED: frozenset(),
    Status.FAILED: frozenset(),
}

LOCAL_OWNER_ID = "local-user"


@dataclass(frozen=True)
class Generation:
    id: str
    owner_id: str
    prompt: str
    aspect_ratio: AspectRatio
    style: Style
    provider: str
    status: Status
    version: int
    attempts: int
    idempotency_key: str | None
    asset_key: str | None
    error: str | None
    created_at: str
    updated_at: str
    started_at: str | None
    completed_at: str | None

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_STATUSES

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "Generation":
        return cls(
            id=row["id"],
            owner_id=row["owner_id"],
            prompt=row["prompt"],
            aspect_ratio=AspectRatio(row["aspect_ratio"]),
            style=Style(row["style"]),
            provider=row["provider"],
            status=Status(row["status"]),
            version=row["version"],
            attempts=row["attempts"],
            idempotency_key=row["idempotency_key"],
            asset_key=row["asset_key"],
            error=row["error"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            started_at=row["started_at"],
            completed_at=row["completed_at"],
        )
