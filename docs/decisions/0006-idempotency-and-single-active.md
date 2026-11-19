# 0006 — Idempotency-Key per click; one active generation, enforced by the DB

**Status:** accepted

## Context
"Does not create duplicate records from one user action" and "only one generation may be active."

## Decision
- The UI generates a `crypto.randomUUID()` per Generate click and sends it as `Idempotency-Key`. The same key with the same inputs returns the original record (200); the same key with different inputs → 422 `idempotency_key_reused`.
- The Generate button is also disabled while submitting and while anything is queued or processing (a UX layer, not the guarantee).
- The **database** guarantees one active generation: `CREATE UNIQUE INDEX ux_generations_one_active ON generations(owner_id) WHERE status IN ('queued','processing')`. The service checks first and returns 409 `generation_active` with the active id.
- `owner_id` defaults to `local-user`, so the rule is already per-user when auth arrives.

## Consequences
- Double-clicks, React StrictMode double effects and network retries can't create duplicates.
- Two tabs can't run two generations at once.
