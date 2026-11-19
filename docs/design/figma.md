# UI/UX source of truth: Figma

**Figma:** https://www.figma.com/design/a3vrZO0Xi7DeZ7YgBbhy8D/Pika-Engineering-Take-Home?node-id=18-2592

**Precedence:** Figma for **layout and copy**; the brief for **behavior and scope**. **When they conflict, the brief wins.** Deviations are listed below and in [ADR-0009](../decisions/0009-figma-vs-brief-deviations.md).

> Viewing tip: the file is view-only without signing in. Keyboard shortcuts don't work, so use the zoom menu (top-right %) and drag to pan.

## Frame inventory

### In scope for the take-home (section "In-scope for takehome interview")
| Frame | What it shows | Screenshot | Implemented in |
|---|---|---|---|
| **Apps** | Left icon rail, search bar, grid of app cards; the first card is Create Image | [apps.png](screenshots/apps.png) | `frontend/src/domains/apps-catalog`, `shell` |
| **Create Image / Default** | Composer panel + dark canvas with the "CREATE IMAGE" hero, image, subtitle | [create-image-default.png](screenshots/create-image-default.png) | `frontend/src/domains/create-image` (`EmptyHero`, `Composer`) |
| **Create Image / Asset Generated** | Canvas shows a title ("Outer Kingdoms ▾") above a large generated image | [create-image-asset-generated.png](screenshots/create-image-asset-generated.png) | `GenerationFeed`, `GenerationCard` |
| **Create Image / Dropdowns** | Open model list, aspect-ratio list (Auto, 1:1…21:9), format list (JPEG/PNG) | [create-image-dropdowns.png](screenshots/create-image-dropdowns.png) | `shared/ui/Select` |

### Production scope (section "Production scope for product understanding"; for `production-system-design.md`)
| Frame | Key elements | Screenshot |
|---|---|---|
| Home | Continue Working (recent projects), hero carousel (Marketing/Founder/Influencer/Social Media), Trending Apps, Model Labs, Community Showcase | [prod-home.png](screenshots/prod-home.png) |
| Apps | Full app grid | (same layout as Apps above) |
| Projects | Project cards (cover, name, item count, updated time); empty state "No Projects yet" + "Start Creating" | [prod-projects.png](screenshots/prod-projects.png) |
| Library | Tabs **Assets** (filters, search, grouped by project) / **Characters** / **Elements** (Product, Scene, Brand, Style) | [prod-library.png](screenshots/prod-library.png) |
| Jobs | "In Progress" list (App name, Project name, time, job id, Processing pill) + "Complete" list; "Start Something New" button | [prod-jobs.png](screenshots/prod-jobs.png) |
| Discover | Featured / Favorites, masonry grid, creator chip, **Remix** button; detail view with title, prompt, source model, date, aspect ratio and **Make your own** | [prod-discover.png](screenshots/prod-discover.png) |

## Copy used verbatim
- App card title: **Create Image**
- App card description: **Generate an image from a prompt, Pick any image model.**
- Composer header pill: **CREATE IMAGE**; field label **Image Model**; button **Generate**
- Empty canvas hero: **CREATE IMAGE** / **Generate an image from a prompt, Pick any image model.**
- Search placeholder: **Search for apps, models and more...**
- Nav labels (tooltips): **Apps, Projects, Library, Jobs, Discover**
- Example prompt (from the brief): *A tiny astronaut exploring a bioluminescent forest.*

## Visual tokens (approximate; pixel-perfect is out of scope)
| Token | Value | Where |
|---|---|---|
| App background | `#f7f6f3` (warm off-white) | Apps page, side rail |
| Canvas | `#111111` / `#1c1c1c` | Create Image right side |
| Panel | `#ffffff`, radius ~20px | Composer |
| Field fill | `#f4f4f4`, radius ~12px | Model card, prompt, selects |
| Primary button | `#000` pill, white text | Generate |
| Active nav | black rounded square, white icon | Side rail |
| Text | `#111` primary, `#7a7a7a` secondary | |
| Display font | wide uppercase grotesk (we use a system bold, letter-spaced, as an approximation) | "CREATE IMAGE" |

## Deviations (brief wins)
See [ADR-0009](../decisions/0009-figma-vs-brief-deviations.md): Style replaces Format; only 3 aspect ratios; fixed Mock model; no upload row; a feed of all generations instead of a single result; exactly one app card; non-Apps tabs are blank.
