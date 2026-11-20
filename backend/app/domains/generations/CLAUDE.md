# backend/app/domains/generations — core domain

**Purpose:** owns a generation's inputs, status, timestamps and lifecycle. The backend is authoritative; the UI only renders what comes from here.

## Public interface
- HTTP (`api.py`):
  - `POST /api/generations` → 202 queued. Same `Idempotency-Key` again → 200 with the original record. 409 `generation_active`; 422 `validation_error` / `idempotency_key_reused`.
  - `GET /api/generations` (newest first) · `GET /api/generations/{id}` · `GET /api/generations/options`
- Events (`events.py`): `generation.updated` carrying the full `GenerationOut`, published after every committed change.
- For the composition root: `GenerationRepository`, `GenerationService`, `GenerationWorker`, `recover_interrupted`.

## Lifecycle (`models.py: ALLOWED_TRANSITIONS`)
```
queued ──Started──▶ processing ──Completed──▶ succeeded
   │                    │ └──────Failed/timeout──▶ failed
   └──error/timeout──▶ failed
processing ──(startup recovery only)──▶ queued
```

## Invariants: don't break these
1. **The API only creates.** After creation, only `worker.py` (and `recovery.py` at startup) changes `status`.
2. Every status change goes through `repository.transition()`, a compare-and-set (`WHERE id=? AND status=?`) that bumps `version`. If it returns `None`, the caller is stale and must stop.
3. **At most one active generation per owner**, enforced by the partial unique index `ux_generations_one_active` in `schema.sql`, not just by the UI.
4. **Idempotency keys are scoped per owner** (`ux_generations_owner_idempotency` on `(owner_id, idempotency_key)`); `_get_by_key` must filter by `owner_id`.
5. Prompts are trimmed at validation (`schemas.py`). `"fail"` (case-insensitive, after trimming) is a valid prompt that the mock provider fails.
6. Restart policy: queued work stays queued; processing work is requeued, and fails once `attempts >= MAX_ATTEMPTS` ([ADR-0008](../../../../docs/decisions/0008-restart-resume-policy.md)).
7. If the worker saves an asset and then loses the `succeeded` CAS, it deletes that file unless the winning row already points at the same key (`worker._discard_unowned_asset`).

## Dependencies
`providers.base` (the provider protocol), `assets.store` (`AssetStore`), `platform.*`. Nothing else.

## Tests
`uv run pytest app/domains/generations`. `test_api.py` covers the HTTP contract; `test_lifecycle.py` covers compare-and-set, recovery, persistence, events, timeouts, the lost-CAS asset cleanup and per-owner idempotency keys.

Related ADRs: [0004](../../../../docs/decisions/0004-provider-boundary-event-stream.md), [0005](../../../../docs/decisions/0005-worker-owns-transitions-cas.md), [0006](../../../../docs/decisions/0006-idempotency-and-single-active.md), [0008](../../../../docs/decisions/0008-restart-resume-policy.md)
