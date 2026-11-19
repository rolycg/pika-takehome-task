# frontend/src/domains/shell — app frame and routing

**Purpose:** layout, the left icon rail and URL routing. `routes.tsx` is the frontend **composition root**, the only file that imports other domains.

| File | What |
|---|---|
| `routes.tsx` | `/` → `/apps`; `/apps`; `/apps/create-image`; `/projects`, `/library`, `/jobs`, `/discover` → `BlankPage`; unknown → `/apps` |
| `Layout.tsx` | Rail + `<Outlet/>` |
| `SideNav.tsx`, `navItems.ts` | Rail with logo, the 5 tabs (order and labels from Figma), hover tooltips, avatar |
| `BlankPage.tsx` | Intentionally empty pages (brief: other tabs show nothing) |

**Figma:** the side rail in the "Apps" and "Create Image" frames; see [docs/design/figma.md](../../../../docs/design/figma.md) and [screenshots/apps.png](../../../../docs/design/screenshots/apps.png).
