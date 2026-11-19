# backend/app/platform — shared infrastructure

**Purpose:** cross-cutting plumbing with **no business rules**. Domains depend on platform; platform never imports a domain.

| File | What it owns |
|---|---|
| `config.py` | `Settings.from_env()` — `DATA_DIR`, `MOCK_QUEUED_DELAY_S`, `MOCK_PROCESSING_DELAY_S`, `PROVIDER_TIMEOUT_S`, `MAX_ATTEMPTS` |
| `db.py` | `Database`: SQLite (WAL) connections, `transaction()` (BEGIN IMMEDIATE), `apply_schema()`; domains bring their own SQL |
| `events.py` | `EventBus`: in-process fan-out, one bounded queue per subscriber; a full queue drops the subscriber and sends a close sentinel |
| `sse.py` | `GET /api/events`: sends `ready`, then every bus event; 15 s ping |

## Invariants
- `publish()` is called **after** the DB change commits, never inside a transaction ([ADR-0007](../../../docs/decisions/0007-sse-live-updates.md)).
- The bus is lossy by design; clients recover by refetching a snapshot when the stream reconnects. Never rely on it for durability; the database is the source of truth.
- Everything runs on one asyncio event loop. Routes are `async def` with short synchronous SQLite calls; don't publish from threads.

## Tests
`uv run pytest app/platform`
