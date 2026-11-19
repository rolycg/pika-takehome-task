# 0003 — SQLite for local persistence

**Status:** accepted

## Context
Completed work must survive restarts. The app is local, single-user and not deployed.

## Decision
- One SQLite file at `data/app.db` (WAL mode), plus media files in `data/assets/`. `DATA_DIR` overrides the location.
- Each domain owns its schema (`generations/schema.sql`), applied idempotently at startup.
- Correctness rules live **in the database**: CHECK constraints on enums, `UNIQUE(idempotency_key)`, and a partial unique index allowing one active generation per owner.
- Writes use `BEGIN IMMEDIATE`, so writers are serialized.
- `npm run reset-data` deletes `data/` (except `.gitkeep`).

## Consequences
- No external services to install. Postgres would need migrations tooling; at this size, `CREATE … IF NOT EXISTS` is enough.
- The same invariants map directly onto Postgres in production (partial unique indexes, CAS updates).
