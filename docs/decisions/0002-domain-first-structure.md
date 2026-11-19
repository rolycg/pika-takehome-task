# 0002 — Domain-first structure, with a CLAUDE.md per domain

**Status:** accepted

## Context
The product will grow into many Apps and surfaces (Home, Projects, Library, Jobs, Discover). Code organized by layer (`models/`, `routes/`, `components/`) scatters each feature across the tree, and humans and AI agents both lose context.

## Decision
- Backend: `app/domains/{catalog,generations,providers,assets}` plus `app/platform` (infrastructure). Frontend: `src/domains/{shell,apps-catalog,create-image}` plus `src/shared`.
- Each domain keeps its API, logic, persistence/state, tests and a `CLAUDE.md` together.
- Dependency rules are in [architecture.md](../architecture.md). Only the composition roots (`backend/app/main.py`, `frontend/src/domains/shell/routes.tsx`) wire domains together.

## Consequences
- Adding an App means adding a domain plus one registration line, without touching unrelated code. The production design keeps the same boundaries.
- There is some duplication across domains (small helpers), which is accepted to keep the boundaries clear.
