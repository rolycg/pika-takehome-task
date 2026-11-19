# frontend/src/domains/create-image — the Create Image app

**Purpose:** composer (prompt, aspect ratio, style, Generate) plus a live, newest-first feed of every generation with its status and inputs.

## Files
| Path | What |
|---|---|
| `types.ts` | Mirrors `backend/app/domains/generations/schemas.py`. Keep them in sync |
| `api.ts` | `fetchOptions`, `fetchGenerations`, `createGeneration(input, idempotencyKey)`; SSE constants |
| `state/generationsReducer.ts` | Pure merge logic: version-guarded upserts + snapshot resync (unit tested) |
| `state/useGenerations.ts` | Snapshot + `EventSource('/api/events')`; resync on every `ready`; exposes `active` |
| `state/useNow.ts` | Local clock tick for "2m ago" labels (not server polling) |
| `components/CreateImagePage.tsx` | White composer panel + dark canvas |
| `components/Composer.tsx` | Form; options come from `GET /api/generations/options` |
| `components/GenerationFeed.tsx`, `GenerationCard.tsx`, `StatusBadge.tsx`, `EmptyHero.tsx` | Feed and per-state visuals |

## Invariants
- **No polling.** Live state comes only from SSE plus a snapshot on (re)connect ([ADR-0007](../../../../docs/decisions/0007-sse-live-updates.md)).
- Never apply a record with a lower or equal `version` than the one held.
- Generate is disabled while submitting, while any generation is `queued`/`processing`, or when the trimmed prompt is empty. Each click sends a fresh `Idempotency-Key` ([ADR-0006](../../../../docs/decisions/0006-idempotency-and-single-active.md)).
- Every status looks distinct: queued (dashed + clock), processing (shimmer + spinner), succeeded (image), failed (red + error text).
- Server error messages (422/409) are shown verbatim.

## Figma
Frames "Create Image / Default", "Asset Generated" and "Dropdowns". See [docs/design/figma.md](../../../../docs/design/figma.md) and the screenshots `create-image-*.png`. Deviations (Style instead of Format, 3 ratios, mock model, feed instead of a single result): [ADR-0009](../../../../docs/decisions/0009-figma-vs-brief-deviations.md).

## Tests
`npm --prefix frontend test` (vitest: reducer).
