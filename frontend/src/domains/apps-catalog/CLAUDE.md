# frontend/src/domains/apps-catalog — Apps page

**Purpose:** renders the Apps grid from `GET /api/apps`. The brief requires **exactly one** card, Create Image; the backend `catalog` domain is the source.

| File | What |
|---|---|
| `api.ts` | `fetchApps()` |
| `AppsPage.tsx` | Search bar (visual only) + card grid |
| `AppCard.tsx` | Cover, app badge, title, description; links to `app.path`. Cover art is mapped by app id in `COVERS` |

**Figma:** the "Apps" frame. Copy is used verbatim ("Create Image" / "Generate an image from a prompt, Pick any image model."). See [docs/design/figma.md](../../../../docs/design/figma.md) and [screenshots/apps.png](../../../../docs/design/screenshots/apps.png).
