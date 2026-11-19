# CLAUDE.md — Create Image (Pika take-home)

Local full-stack **Create Image** app: a React + Vite frontend, a FastAPI backend, and a **mocked async image model** behind a provider boundary. Part 2 is the production design for the full Creation product: [production-system-design.md](production-system-design.md).

**UI/UX source of truth:** [docs/design/figma.md](docs/design/figma.md) (Figma link, frames, copy, tokens, screenshots). Figma decides **layout and copy**; the brief decides **behavior and scope**. **When they conflict, the brief wins** ([ADR-0009](docs/decisions/0009-figma-vs-brief-deviations.md)).

## Commands (repo root)
| Task | Command |
|---|---|
| Install everything | `npm run setup` |
| Dev (API :8000 + web :5173) | `npm run dev` → http://localhost:5173 |
| Tests (pytest + vitest) | `npm test` (or `npm run test:api` / `npm run test:web`) |
| End-to-end (Playwright) | `npm run setup:e2e` once, then `npm run test:e2e` |
| Typecheck + build frontend | `npm run build` |
| Wipe local history | stop dev, then `npm run reset-data` |
| Verify doc links | `npm run check-links` |

## Domain map (read the domain's CLAUDE.md before editing it)
| Domain | Path | Context |
|---|---|---|
| Platform (config, SQLite, event bus, SSE) | `backend/app/platform/` | [CLAUDE.md](backend/app/platform/CLAUDE.md) |
| Catalog (Apps list) | `backend/app/domains/catalog/` | [CLAUDE.md](backend/app/domains/catalog/CLAUDE.md) |
| Generations (core lifecycle, worker, recovery) | `backend/app/domains/generations/` | [CLAUDE.md](backend/app/domains/generations/CLAUDE.md) |
| Providers (mock model boundary + fixture) | `backend/app/domains/providers/` | [CLAUDE.md](backend/app/domains/providers/CLAUDE.md) |
| Assets (store and serve media) | `backend/app/domains/assets/` | [CLAUDE.md](backend/app/domains/assets/CLAUDE.md) |
| Shared UI/http | `frontend/src/shared/` | [CLAUDE.md](frontend/src/shared/CLAUDE.md) |
| Shell (layout, nav, routes) | `frontend/src/domains/shell/` | [CLAUDE.md](frontend/src/domains/shell/CLAUDE.md) |
| Apps catalog page | `frontend/src/domains/apps-catalog/` | [CLAUDE.md](frontend/src/domains/apps-catalog/CLAUDE.md) |
| Create Image app | `frontend/src/domains/create-image/` | [CLAUDE.md](frontend/src/domains/create-image/CLAUDE.md) |
| End-to-end specs (required behavior) | `e2e/` | [CLAUDE.md](e2e/CLAUDE.md) |

Composition roots: `backend/app/main.py` and `frontend/src/domains/shell/routes.tsx`. Those are the only places that wire domains together.

## Rules
1. **Domain-first.** New code goes inside a domain, with its tests next to it. Only `platform`/`shared` and a sibling's *public* module may be imported ([architecture](docs/architecture.md), [ADR-0002](docs/decisions/0002-domain-first-structure.md)).
2. **The backend is authoritative.** The API only *creates*; after that only the worker (and startup recovery) changes status, using compare-and-set `repository.transition()` ([ADR-0005](docs/decisions/0005-worker-owns-transitions-cas.md)).
3. **One active generation**, enforced by the DB index, plus an **Idempotency-Key per click** ([ADR-0006](docs/decisions/0006-idempotency-and-single-active.md)).
4. **No polling.** Live UI uses SSE plus a snapshot resync on (re)connect; events are published after commit ([ADR-0007](docs/decisions/0007-sse-live-updates.md)).
5. **Never call a real model API.** All model code lives behind `ImageProvider` ([ADR-0004](docs/decisions/0004-provider-boundary-event-stream.md)).
6. **Respect the scope.** Retry/Reuse/Cancel, uploads, auth, billing, video, multi-user and mobile layouts are out of scope for the code ([docs/scope.md](docs/scope.md)).
7. **Record decisions.** Any non-obvious choice gets an ADR in `docs/decisions/`, plus a link here and in [docs/README.md](docs/README.md). Keep domain `CLAUDE.md` files current when you change a domain.
8. Keep `frontend/src/domains/create-image/types.ts` in sync with `backend/app/domains/generations/schemas.py`.
9. **Behavior changes need an e2e update.** If you change a required behavior, update the spec covering it in `e2e/tests/` and run `npm run test:e2e` ([ADR-0010](docs/decisions/0010-e2e-playwright.md)).

## Docs
- [docs/README.md](docs/README.md): index
- [docs/scope.md](docs/scope.md): requirements, out-of-scope list, precedence
- [docs/architecture.md](docs/architecture.md): domain map, request/event flow, dependency rules
- [docs/design/figma.md](docs/design/figma.md): Figma reference and [screenshots](docs/design/screenshots/)
- Decisions:
  - [0001 stack](docs/decisions/0001-stack-react-vite-fastapi.md)
  - [0002 domain-first](docs/decisions/0002-domain-first-structure.md)
  - [0003 SQLite](docs/decisions/0003-sqlite-local-persistence.md)
  - [0004 provider boundary](docs/decisions/0004-provider-boundary-event-stream.md)
  - [0005 transitions/CAS](docs/decisions/0005-worker-owns-transitions-cas.md)
  - [0006 idempotency + single active](docs/decisions/0006-idempotency-and-single-active.md)
  - [0007 SSE](docs/decisions/0007-sse-live-updates.md)
  - [0008 restart = resume](docs/decisions/0008-restart-resume-policy.md)
  - [0009 Figma deviations](docs/decisions/0009-figma-vs-brief-deviations.md)
  - [0010 e2e with Playwright](docs/decisions/0010-e2e-playwright.md)
