# 0010: End-to-end tests with Playwright, covering required behavior only

**Status:** accepted

## Context
Unit tests (pytest, vitest) prove the parts work. The grader judges the product: the browser UI talking to the real backend, with live updates, the mock's timing, persistence and restarts. These behaviors were checked by hand. They need a repeatable suite.

## Decision
- A top-level `e2e/` package with `@playwright/test`, its own `CLAUDE.md`, and one spec per product area (`apps`, `navigation`, `create-image`, `api`, `restart`).
- The config starts the **real** backend (from `backend/.venv`) on :8100 with a **fresh** `e2e/.data/`, plus the Vite dev server on :5180 proxying to it. This is isolated from `npm run dev` and `data/`.
- Mock delays are shortened (1.0 s queued, 1.5 s processing) but still observable, so the specs assert every state.
- Restart specs start their own backend through `support/api-process.ts`, so they can SIGTERM (graceful restart) or SIGKILL (crash) it.
- Runs serially (`workers: 1`) because the product allows one active generation.
- **Scope rule:** only required, user-visible behavior from the brief. No implementation details, no visual snapshots (pixel-perfect is out of scope).
- Browser: Playwright's Chromium by default. `E2E_BROWSER_CHANNEL=chrome` uses an installed Chrome and skips the download.

## Consequences
- About 30 s per run, and it needs the backend venv (`npm run setup`).
- Selectors use roles and accessible names, so the specs also guard basic accessibility of the composer and feed.
