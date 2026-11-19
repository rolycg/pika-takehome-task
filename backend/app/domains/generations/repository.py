"""All SQL for generations. Status changes are compare-and-set so a stale writer can never win."""

from __future__ import annotations

import sqlite3
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.domains.generations.models import (
    ALLOWED_TRANSITIONS,
    LOCAL_OWNER_ID,
    AspectRatio,
    Generation,
    Status,
    Style,
)
from app.platform.db import Database

SCHEMA_SQL = (Path(__file__).parent / "schema.sql").read_text()


class ActiveGenerationExists(Exception):
    def __init__(self, active: Generation) -> None:
        super().__init__(f"generation {active.id} is still {active.status}")
        self.active = active


class IdempotencyKeyReused(Exception):
    """The same Idempotency-Key was sent with different inputs."""


class IllegalTransition(Exception):
    pass


def utc_now() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class GenerationRepository:
    def __init__(self, db: Database) -> None:
        self._db = db

    def init_schema(self) -> None:
        self._db.apply_schema(SCHEMA_SQL)

    # --- creation -------------------------------------------------------------------------

    def create(
        self,
        *,
        prompt: str,
        aspect_ratio: AspectRatio,
        style: Style,
        provider: str,
        idempotency_key: str | None,
        owner_id: str = LOCAL_OWNER_ID,
    ) -> tuple[Generation, bool]:
        """Insert a queued generation. Returns (generation, created).

        Replaying an idempotency key returns the original record with created=False.
        Raises ActiveGenerationExists if the owner already has a queued/processing generation.
        """
        now = utc_now()
        with self._db.transaction() as conn:
            if idempotency_key is not None:
                existing = self._get_by_key(conn, idempotency_key)
                if existing is not None:
                    same_inputs = (existing.prompt, existing.aspect_ratio, existing.style) == (
                        prompt, aspect_ratio, style)
                    if not same_inputs:
                        raise IdempotencyKeyReused(idempotency_key)
                    return existing, False
            active = self._get_active(conn, owner_id)
            if active is not None:
                raise ActiveGenerationExists(active)
            generation_id = str(uuid.uuid4())
            try:
                conn.execute(
                    """
                    INSERT INTO generations (id, owner_id, prompt, aspect_ratio, style, provider, status,
                                             idempotency_key, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?)
                    """,
                    (generation_id, owner_id, prompt, aspect_ratio.value, style.value, provider,
                     idempotency_key, now, now),
                )
            except sqlite3.IntegrityError:
                # BEGIN IMMEDIATE serializes writers, so this is a belt-and-braces guard for the
                # unique index / idempotency key rather than an expected path.
                active = self._get_active(conn, owner_id)
                if active is not None:
                    raise ActiveGenerationExists(active) from None
                raise
            row = conn.execute("SELECT * FROM generations WHERE id = ?", (generation_id,)).fetchone()
            return Generation.from_row(row), True

    # --- reads ----------------------------------------------------------------------------

    def get(self, generation_id: str) -> Generation | None:
        conn = self._db.connect()
        try:
            row = conn.execute("SELECT * FROM generations WHERE id = ?", (generation_id,)).fetchone()
            return Generation.from_row(row) if row else None
        finally:
            conn.close()

    def list_for_owner(self, owner_id: str = LOCAL_OWNER_ID) -> list[Generation]:
        conn = self._db.connect()
        try:
            rows = conn.execute(
                "SELECT * FROM generations WHERE owner_id = ? ORDER BY created_at DESC, rowid DESC",
                (owner_id,),
            ).fetchall()
            return [Generation.from_row(r) for r in rows]
        finally:
            conn.close()

    def next_queued(self) -> Generation | None:
        conn = self._db.connect()
        try:
            row = conn.execute(
                "SELECT * FROM generations WHERE status = 'queued' ORDER BY created_at, rowid LIMIT 1"
            ).fetchone()
            return Generation.from_row(row) if row else None
        finally:
            conn.close()

    def list_by_status(self, status: Status) -> list[Generation]:
        conn = self._db.connect()
        try:
            rows = conn.execute(
                "SELECT * FROM generations WHERE status = ? ORDER BY created_at, rowid", (status.value,)
            ).fetchall()
            return [Generation.from_row(r) for r in rows]
        finally:
            conn.close()

    # --- transitions ----------------------------------------------------------------------

    def transition(
        self,
        generation_id: str,
        *,
        expected: Status,
        to: Status,
        increment_attempts: bool = False,
        **fields: Any,
    ) -> Generation | None:
        """Compare-and-set status change. Returns the updated row, or None if the row was not in
        `expected` (someone else already moved it — the caller's view is stale)."""
        if to not in ALLOWED_TRANSITIONS[expected]:
            raise IllegalTransition(f"{expected} -> {to}")
        allowed_fields = {"asset_key", "error", "started_at", "completed_at"}
        unknown = set(fields) - allowed_fields
        if unknown:
            raise ValueError(f"unknown fields: {unknown}")

        now = utc_now()
        assignments = ["status = ?", "version = version + 1", "updated_at = ?"]
        params: list[Any] = [to.value, now]
        if increment_attempts:
            assignments.append("attempts = attempts + 1")
        for name, value in fields.items():
            assignments.append(f"{name} = ?")
            params.append(value)
        params += [generation_id, expected.value]

        with self._db.transaction() as conn:
            cursor = conn.execute(
                f"UPDATE generations SET {', '.join(assignments)} WHERE id = ? AND status = ?", params
            )
            if cursor.rowcount == 0:
                return None
            row = conn.execute("SELECT * FROM generations WHERE id = ?", (generation_id,)).fetchone()
            return Generation.from_row(row)

    # --- helpers --------------------------------------------------------------------------

    @staticmethod
    def _get_by_key(conn: sqlite3.Connection, key: str) -> Generation | None:
        row = conn.execute("SELECT * FROM generations WHERE idempotency_key = ?", (key,)).fetchone()
        return Generation.from_row(row) if row else None

    @staticmethod
    def _get_active(conn: sqlite3.Connection, owner_id: str) -> Generation | None:
        row = conn.execute(
            "SELECT * FROM generations WHERE owner_id = ? AND status IN ('queued', 'processing') LIMIT 1",
            (owner_id,),
        ).fetchone()
        return Generation.from_row(row) if row else None
