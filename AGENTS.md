# AGENTS.md

Entry point for coding agents (Codex, Cursor, Claude Code, …). **[CLAUDE.md](CLAUDE.md) is the canonical guide.** Read it first; this file is a short pointer so the two can't drift.

- **What:** a local Create Image app. React + Vite frontend (`frontend/`), FastAPI backend (`backend/`), mocked async model.
- **Install / run / test:** `npm run setup` · `npm run dev` · `npm test` · `npm run test:e2e` (after `npm run setup:e2e`) · `npm run build` · `npm run reset-data`
- **Structure:** domain-first. Backend domains are in `backend/app/domains/*` plus `backend/app/platform`. Frontend domains are in `frontend/src/domains/*` plus `frontend/src/shared`. Each has its own `CLAUDE.md`. Read it before editing that domain.
- **Decisions and design:** [docs/README.md](docs/README.md) (ADRs, scope, architecture). UI/UX reference: [docs/design/figma.md](docs/design/figma.md).
- **Non-negotiables:**
  - The backend owns status; transitions are compare-and-set and happen only in the worker.
  - One active generation (DB-enforced) and an Idempotency-Key per click.
  - SSE, never polling.
  - No real model APIs.
  - Stay within [docs/scope.md](docs/scope.md).
