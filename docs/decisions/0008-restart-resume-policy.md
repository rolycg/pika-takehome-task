# 0008 — Restart policy: resume interrupted work, with a bounded number of attempts

**Status:** accepted

## Context
"Queued or processing work may resume or transition predictably to failed; document the choice."

## Decision
**Resume.** At startup, before the worker starts, `recover_interrupted()` in `generations/recovery.py` runs:
- `queued` rows stay queued and are processed oldest-first.
- `processing` rows move back to `queued` (CAS, version+1) and run again. `attempts` counts each start.
- A `processing` row that has already started `MAX_ATTEMPTS` times (default 3) goes to `failed` with "Interrupted by restarts N times; giving up." so a crash-looping job can't block the queue forever.

## Consequences
- The user doesn't lose work to a restart; the UI shows the item go back to queued, then processing, then the result.
- The mock's in-flight work died with the process, so resuming means re-running it. A real provider adapter would persist the vendor operation id and **re-attach** (poll the existing job) instead of resubmitting, using the generation id as the vendor idempotency key to avoid paying twice.
