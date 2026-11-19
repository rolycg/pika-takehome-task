# 0005 — The worker owns transitions; compare-and-set with a version

**Status:** accepted

## Context
The backend is authoritative for status. Several actors could write status (the API, the worker, startup recovery), and late or duplicate writes must never regress a record.

## Decision
- The API **only creates** (`queued`). After creation, only `GenerationWorker` (and `recover_interrupted` at startup, before the worker starts) changes status.
- Legal moves are listed in `ALLOWED_TRANSITIONS`; anything else raises `IllegalTransition`.
- Every change is `UPDATE … SET status=?, version=version+1 … WHERE id=? AND status=?`. Zero rows updated means the writer is stale and stops.
- `version` goes out with every event, so clients keep the highest version and ignore out-of-order events.

## Consequences
- Duplicate or late provider events can't regress a record. In production the same pattern rejects stale webhooks.
- One worker task at a time is enough because only one generation can be active.
