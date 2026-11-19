# 0007 — Server-Sent Events for live updates (no polling)

**Status:** accepted

## Context
The UI must update without a reload. The user prefers event-driven updates over polling, which scales poorly.

## Decision
- `GET /api/events` streams `generation.updated` events carrying the full generation JSON (`sse-starlette`, 15 s ping). Each stream starts with a `ready` event.
- Events are published **after** the DB commit, from the service (create) and the worker (transitions).
- Client (`create-image/state/useGenerations.ts`): open the `EventSource`; on every `ready` (first connect and each reconnect) refetch the snapshot `GET /api/generations`, then apply events by `id`, keeping the higher `version`.
- The bus is in-memory and lossy. A slow subscriber is dropped and closed, so the browser reconnects and resyncs. The database stays the source of truth.

## Consequences
- No polling. Updates arrive within milliseconds of the commit.
- With multiple backend processes, the in-memory bus would need a shared fan-out (Postgres LISTEN/NOTIFY or Redis pub/sub); see `production-system-design.md`.
