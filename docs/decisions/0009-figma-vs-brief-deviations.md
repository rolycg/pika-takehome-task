# 0009 — Figma vs. brief deviations

**Status:** accepted. The brief wins on behavior and scope; the Figma wins on layout and copy.

| Figma | Implemented | Why |
|---|---|---|
| Format dropdown (JPEG / PNG) | **Style** dropdown (Photorealistic / Illustration / Cinematic) | The brief's required controls |
| Aspect ratio: Auto + 10 ratios | **1:1, 16:9, 9:16** only | The brief |
| Image Model picker (GPT Image 2, Nano Banana, …) | Fixed, non-interactive "Mock Image Model" card | Mocked models only; real providers out of scope |
| Reference-image "+" row in the prompt box | Omitted | Uploads out of scope |
| Canvas shows one large result under a project title ("Outer Kingdoms ▾") | Newest-first **feed of every generation** with status + inputs; the title reads "Generations" | The brief's assets-panel requirement; projects out of scope |
| "Generate ⚡99" credit badge | Kept as a static visual | Billing out of scope |
| Apps grid with many cards + search | **Exactly one** card; the search bar is shown but inert | The brief |
| Nav tooltips / Discover etc. | Projects, Library, Jobs and Discover render an empty page | The brief |
| Pixel-perfect sizing | Close approximation, desktop only | Pixel-perfect and mobile are out of scope |
