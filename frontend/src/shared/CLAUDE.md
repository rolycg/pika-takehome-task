# frontend/src/shared — domain-agnostic building blocks

**Rule:** nothing here may import from `src/domains/*`. If something needs domain knowledge, it belongs in that domain.

| Path | What |
|---|---|
| `api/http.ts` | `requestJson<T>()` + `ApiError(status, code, message, details)`. Parses the backend's `{error:{code,message}}` shape |
| `ui/Select.tsx` | Figma-style dropdown (filled pill, list opens upward; keyboard: arrows/Enter/Esc) |
| `ui/Spinner.tsx`, `ui/Logo.tsx` | Small visual atoms (the logo is original placeholder art) |

Design tokens (colors, fonts) live in `src/index.css` under `@theme`, taken from [docs/design/figma.md](../../../docs/design/figma.md).
