# Docs index

| Doc | What it's for |
|---|---|
| [scope.md](scope.md) | What the take-home must do, what is explicitly out of scope, and where we deviate from the Figma |
| [architecture.md](architecture.md) | Domain map (backend + frontend), request/event flow, dependency rules |
| [design/figma.md](design/figma.md) | **UI/UX source of truth**: Figma link, frame inventory, copy, tokens, deviations; [screenshots](design/screenshots/) |
| [decisions/](decisions/) | Architecture Decision Records (one decision each) |
| [../production-system-design.md](../production-system-design.md) | Part 2: design for the full production Creation product |

## Decisions
| # | Decision |
|---|---|
| [0001](decisions/0001-stack-react-vite-fastapi.md) | React + Vite + TS frontend, FastAPI backend, uv + npm |
| [0002](decisions/0002-domain-first-structure.md) | Organize both apps by domain; each domain has its own CLAUDE.md |
| [0003](decisions/0003-sqlite-local-persistence.md) | SQLite file in `data/` for local persistence |
| [0004](decisions/0004-provider-boundary-event-stream.md) | Providers are async event streams behind one protocol |
| [0005](decisions/0005-worker-owns-transitions-cas.md) | The worker owns transitions; compare-and-set updates with a version |
| [0006](decisions/0006-idempotency-and-single-active.md) | Idempotency-Key per click; one active generation, enforced by the DB |
| [0007](decisions/0007-sse-live-updates.md) | Server-Sent Events for live UI, snapshot + resync |
| [0008](decisions/0008-restart-resume-policy.md) | Restart policy: resume queued/processing, bounded by attempts |
| [0009](decisions/0009-figma-vs-brief-deviations.md) | Where the UI deviates from Figma because the brief wins |
| [0010](decisions/0010-e2e-playwright.md) | Playwright e2e suite in `e2e/` against the real stack, covering required behavior only |

When you make a new decision, add an ADR here (`NNNN-kebab-title.md`, sections Context / Decision / Consequences) and link it from the root `CLAUDE.md` if agents need it.
