# 0004 — Provider boundary: an async stream of lifecycle events

**Status:** accepted

## Context
The mock must be replaceable by a real model API "without reorganizing the whole product". Real providers either hold a request open, or accept a job and report progress later (polling or webhooks).

## Decision
`ImageProvider.run(ProviderRequest) -> AsyncIterator[Started | Completed | Failed]` in `backend/app/domains/providers/base.py`.
- The mock sleeps, yields `Started`, sleeps, then yields `Completed(fixture)` or `Failed` for the `fail` prompt. The visible queued→processing delay lives **in the provider**, where a real vendor queue would put it.
- The worker translates events into status transitions. Providers never touch the DB, the bus or HTTP.
- `registry.build_providers()` maps a name to an adapter. Each generation stores its `provider`.

## Consequences
- A real adapter implements `run()` by submitting, then polling or awaiting a webhook, translating vendor states into the same events. The generations domain does not change.
- Resuming after a restart currently resubmits. A real adapter would also persist the vendor operation id and re-attach (see ADR-0008).
