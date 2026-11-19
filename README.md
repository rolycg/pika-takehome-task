# Create Image (Pika engineering take-home)

A local, full-stack **Create Image** app:
- **Frontend:** React + Vite + TypeScript (`frontend/`).
- **Backend:** FastAPI + SQLite (`backend/`).
- **Model:** a **mocked asynchronous image model** behind a replaceable provider boundary.
- **Live updates:** Server-Sent Events. No polling, no page reloads.

Part 2, the production design for the whole Creation product, is in [production-system-design.md](production-system-design.md).

---

## Prerequisites
| Tool | Version | Check | Install |
|---|---|---|---|
| Node.js (includes npm) | **20.19+** (22 LTS recommended) | `node -v` | https://nodejs.org |
| uv (Python package manager) | **0.5+** | `uv --version` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` (or `brew install uv`) |

You don't need to install Python yourself. `uv` downloads the pinned **Python 3.12** automatically (`backend/.python-version`).
Ports **8000** (API) and **5173** (web) must be free.

## Install
From the repository root:
```bash
npm run setup
```
This runs `npm --prefix frontend install` and `uv --directory backend sync` (creates `backend/.venv` and installs Python 3.12 if needed).

## Run (local development)
```bash
npm run dev
```
- Web app: **http://localhost:5173** (it proxies `/api/*` to the API)
- API: http://127.0.0.1:8000 (interactive docs at http://127.0.0.1:8000/docs)

Stop both with `Ctrl+C`.

<details>
<summary>Run the two processes separately (optional)</summary>

```bash
# terminal 1
uv --directory backend run uvicorn --factory app.main:create_app --reload --reload-dir app --port 8000
# terminal 2
npm --prefix frontend run dev
```
</details>

## Build
The backend needs no build step. To typecheck and build the frontend, then serve the built bundle:
```bash
npm run build      # tsc + vite build → frontend/dist
npm run start      # API on :8000 + built web app on http://localhost:4173
```

## Test
```bash
npm test           # backend pytest (API, lifecycle, recovery, persistence) + frontend vitest (live-state reducer)
```

### End-to-end (Playwright, real browser + real servers)
```bash
npm run setup:e2e  # once: installs e2e deps + Playwright's Chromium
npm run test:e2e   # starts its own API (:8100) and web (:5180) with a fresh e2e/.data, runs all specs
```
If you'd rather not download Chromium, skip `npm --prefix e2e run install-browser` and run against an installed Google Chrome instead: `E2E_BROWSER_CHANNEL=chrome npm run test:e2e`.
The e2e suite covers only required behavior: the Apps page, blank tabs, composer options, live status transitions, the `fail` rule, newest-first history, no duplicates, backend validation, one active generation, and restart survival and resume. See [e2e/CLAUDE.md](e2e/CLAUDE.md).

## Reset data
Generation history and generated images live in `data/` (`data/app.db` + `data/assets/`). To wipe them:
```bash
# stop `npm run dev` first (Ctrl+C), then:
npm run reset-data
```
The script refuses to run while the API is up. Set `DATA_DIR=/some/path` to keep data elsewhere.

---

## What to try
1. Open http://localhost:5173. The **Apps** page shows exactly one card, **Create Image**. The other side-nav tabs (Projects, Library, Jobs, Discover) are intentionally empty.
2. Open Create Image and enter *A tiny astronaut exploring a bioluminescent forest.* Pick an aspect ratio (1:1 / 16:9 / 9:16) and a style (Photorealistic / Illustration / Cinematic), then click **Generate**.
3. A card appears at the top of the feed as **Queued**. About 1.5 s later it becomes **Processing**, and about 3 s after that it becomes **Succeeded**, showing the fixture image. Generate is disabled while a generation is queued or processing.
4. Enter the prompt `fail` (any case, surrounding spaces ignored). The generation ends **Failed** with an error message.
5. **Restart resume.** Start a generation and, while it is still processing, kill the API hard from another terminal: `pkill -9 -f "uvicorn --factory"`. The UI shows *Reconnecting…*. Run `npm run dev` again (stop the old one with `Ctrl+C` first if it's still running). The generation resumes (back to queued, then processing, then succeeded), shows "Attempt 2", and the open page reconnects and catches up without a reload.
   A normal `Ctrl+C` shuts down gracefully: anything still processing after the 3 s grace period is resumed the same way on the next start.

### Configuration (environment variables, all optional)
| Variable | Default | Meaning |
|---|---|---|
| `DATA_DIR` | `./data` | Where the SQLite DB and generated assets are stored |
| `MOCK_QUEUED_DELAY_S` | `1.5` | Mock time spent queued before processing starts |
| `MOCK_PROCESSING_DELAY_S` | `3.0` | Mock processing time |
| `PROVIDER_TIMEOUT_S` | `30` | A generation that takes longer fails with a timeout |
| `MAX_ATTEMPTS` | `3` | Restart-interrupted runs before a generation is failed |

## How it works (short)
- `POST /api/generations` validates the input (trimmed, non-empty prompt; supported ratio and style; no unknown fields), stores a **queued** generation and returns **202** right away.
  - The same `Idempotency-Key` returns the original record, so one click can never create two records.
  - A second request while a generation is active gets **409**. A partial unique index in the database enforces this rule.
- A background **worker** runs the provider (`backend/app/domains/providers/mock.py`) and moves the generation queued → processing → succeeded/failed using compare-and-set updates.
- Every committed change is pushed to the browser over **SSE** (`GET /api/events`). The browser also loads a snapshot whenever the stream (re)connects.
- **Restart policy: resume.** Queued work stays queued. Interrupted processing work is requeued and re-run, up to `MAX_ATTEMPTS`, then failed. See [ADR-0008](docs/decisions/0008-restart-resume-policy.md).

More detail:
- [docs/architecture.md](docs/architecture.md)
- [docs/decisions/](docs/decisions/)
- [docs/scope.md](docs/scope.md)
- [docs/design/figma.md](docs/design/figma.md) (the UI reference)

## Repository layout
```
backend/   FastAPI app — app/platform (config, db, events, sse) + app/domains/{catalog,generations,providers,assets}
frontend/  React app  — src/shared + src/domains/{shell,apps-catalog,create-image}
data/      local SQLite DB + generated assets (gitignored)
e2e/       Playwright end-to-end specs for the required behavior
docs/      scope, architecture, ADRs, Figma reference + screenshots
scripts/   reset-data, check-links
```
Each domain has a `CLAUDE.md` describing what it owns. [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md) are the entry points for AI coding agents.

## Submission note
**What works**
- An Apps page with one card, a side nav whose other tabs are blank, and the Create Image composer (prompt, aspect ratio, style).
- An async mocked model with visible queued → processing → succeeded/failed states and the `fail` rule.
- A live feed of every generation, newest first, showing status and inputs, with no reloads.
- Server-side validation; idempotent creates; one active generation, enforced in the database.
- Persistent history; resume-on-restart.
- Backend and frontend unit tests, plus a Playwright e2e suite covering every required behavior.

**Known gaps**
- The UI is an approximation of the Figma (not pixel-perfect, desktop only).
- The model picker is a fixed "Mock Image Model".
- The search box is visual only.
- The in-memory event bus and in-process worker assume a single backend process.
- Retry, Reuse and Cancel are not implemented; they are out of scope.

**Next change I'd make:** persist a provider operation id on each attempt and make the worker re-attach to an in-flight provider job on restart instead of re-running it. That is the first step toward real providers, and it is what production needs to avoid paying twice for interrupted work.
