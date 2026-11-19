# Architecture (local take-home)

```
┌──────────────── frontend (React + Vite, :5173) ────────────────┐
│ domains/shell ─ domains/apps-catalog ─ domains/create-image    │
│                         shared/ (http, ui)                     │
└──────────────┬──────────────────────────────▲──────────────────┘
               │ fetch /api/* (Vite proxy)    │ EventSource /api/events
┌──────────────▼──────────────────────────────┴──────────────────┐
│ backend (FastAPI, :8000)  app/main.py = composition root       │
│  domains/catalog      GET /api/apps                            │
│  domains/generations  API → Service → Repository (SQLite)      │
│                       Worker ──▶ providers (ImageProvider)     │
│                         └──▶ assets (AssetStore, data/assets)  │
│  platform/            config · db · events (EventBus) · sse    │
└────────────────────────────────────────────────────────────────┘
                     data/app.db  data/assets/
```

## Request → result flow
1. `POST /api/generations`: Pydantic validates the body. `GenerationService.create` inserts a `queued` row (in one transaction, with the idempotency check and the active-generation check), **then** publishes `generation.updated`, wakes the worker and returns 202.
2. `GenerationWorker` picks the oldest queued row and runs `provider.run(request)` under a timeout.
   - `Started` → CAS `queued→processing` (attempts+1), publish.
   - `Completed` → `AssetStore.save`, then CAS `processing→succeeded`, publish.
   - `Failed` / timeout / error → CAS `→failed` with the error, publish.
3. The browser's `useGenerations` hook loads a snapshot (`GET /api/generations`), applies `generation.updated` events by `version`, and refetches the snapshot every time the stream (re)opens.

## Domain map
| Side | Domain | Owns |
|---|---|---|
| backend | `platform` | config, SQLite access, event bus, SSE endpoint. No business rules |
| backend | `catalog` | the Apps list (one App) |
| backend | `generations` | generation inputs, statuses, timestamps, lifecycle, worker, recovery |
| backend | `providers` | the `ImageProvider` protocol, the mock, the fixture, the registry |
| backend | `assets` | storing and serving generated media |
| frontend | `shared` | http client, generic UI (Select, Spinner), design tokens |
| frontend | `shell` | layout, side nav, routes, blank pages |
| frontend | `apps-catalog` | Apps page and card |
| frontend | `create-image` | composer, generation feed, live-state hook |
| repo | `e2e` | Playwright specs for required behavior, run against the real servers |

Every domain folder has a `CLAUDE.md` with its purpose, interface, invariants and tests.

## Dependency rules
- A domain may import `platform`/`shared`, plus the **public module** of a sibling (backend: `generations` → `providers.base`, `assets.store`). No other cross-domain imports.
- `platform` / `shared` never import a domain.
- Only `backend/app/main.py` and `frontend/src/domains/shell/routes.tsx` wire domains together.
- Tests live inside the domain they test.
