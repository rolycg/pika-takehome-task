# 0001 — Stack: React + Vite + TypeScript frontend, FastAPI backend

**Status:** accepted

## Context
The brief allows TypeScript, Python or a mix. Graders run everything from a clean clone using only the README.

## Decision
- **Frontend:** React 19 + Vite 8 + TypeScript, Tailwind CSS v4, react-router, lucide-react icons, vitest (exact versions pinned in `frontend/package-lock.json`).
- **Backend:** Python 3.12 + FastAPI + Pydantic + `sse-starlette`, managed by **uv** (uv also installs the pinned Python, so the grader needs no system Python).
- **Root `package.json`:** convenience scripts only (`setup`, `dev`, `build`, `test`, `reset-data`). `scripts/run-both.mjs` runs both servers without extra dependencies.

## Consequences
- Two toolchains (Node and uv) are needed, and the README lists both as prerequisites.
- Pydantic gives precise server-side validation; the frontend mirrors the types by hand in `create-image/types.ts` (no codegen at this size).
