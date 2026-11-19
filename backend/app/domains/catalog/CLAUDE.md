# backend/app/domains/catalog — Apps catalog

**Purpose:** the list of Apps on the Apps page. The brief requires **exactly one** card: Create Image.

- `apps.py`: the static `APPS` tuple (id, name, description, path). The copy comes from the Figma ([docs/design/figma.md](../../../../docs/design/figma.md)).
- `api.py`: `GET /api/apps`.

Adding an App later means adding one entry here plus its own domain, which leaves other domains untouched. In production this becomes App manifests (see `production-system-design.md`).

## Tests
`uv run pytest app/domains/catalog`. The test asserts exactly one app.
