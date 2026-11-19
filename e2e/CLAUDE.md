# e2e: end-to-end tests (Playwright)

**Purpose:** prove the **expected product behavior** against the real stack (FastAPI + SQLite + mock provider + Vite/React) in a real browser. Only required functionality belongs here. Implementation details go in the backend (pytest) or frontend (vitest) unit tests.

## Run
```bash
npm run setup                      # once (backend venv + frontend deps)
npm --prefix e2e install           # once
npm --prefix e2e run install-browser   # once: Playwright's Chromium (or set E2E_BROWSER_CHANNEL=chrome)
npm run test:e2e                   # from repo root
```
The config starts its **own** servers on **API :8100** and **web :5180** with a fresh `e2e/.data/` and shorter mock delays (queued 1.0 s, processing 1.5 s). It doesn't touch `npm run dev` (8000/5173) or `data/`.

## Layout
| Path | What |
|---|---|
| `playwright.config.ts` | Serial run (one active generation at a time); webServer = `scripts/serve-api.mjs` + Vite dev with `API_URL` |
| `support/env.ts` | Ports, dirs, mock timings |
| `support/helpers.ts` | `composer(page)`, `choose()`, `cardFor()`, `listGenerations()`, `waitUntilIdle()` |
| `support/api-process.ts` | `startApi(port, dataDir)`: starts a dedicated backend that a spec can SIGTERM or SIGKILL and restart |
| `tests/apps.spec.ts` | Apps page has exactly one card (Create Image); the card opens the app |
| `tests/navigation.spec.ts` | Projects / Library / Jobs / Discover show nothing; Apps navigates back |
| `tests/create-image.spec.ts` | Controls and options; disabled Generate; queued→processing→succeeded live with no reload; inputs shown; `fail`→failed; newest first; no duplicates from one action; history after reload |
| `tests/api.spec.ts` | Backend validation (empty prompt, unsupported options), 202 + queued immediately, single active (409), Idempotency-Key |
| `tests/restart.spec.ts` | Completed work survives a restart; a crash mid-processing resumes ([ADR-0008](../docs/decisions/0008-restart-resume-policy.md)) |

## Conventions
- Select by **role and accessible name** (`getByRole('button', { name: 'Style' })`) or the card's `data-status`. Don't use CSS classes.
- Each test starts idle (`waitUntilIdle`) and uses `uniquePrompt()` so tests don't depend on each other.
- Never call real model APIs. Never use `page.reload()` to make a status change appear; live updates must arrive by themselves.
- When a product requirement changes, update the spec that covers it (see the table) in the same change.
