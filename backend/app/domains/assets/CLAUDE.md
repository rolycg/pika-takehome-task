# backend/app/domains/assets — generated media storage

**Purpose:** persist provider output and serve it. A local stand-in for object storage + CDN.

- `store.py` `AssetStore`: `save(owner_id, bytes, ext)` writes atomically (tmp + rename) to `DATA_DIR/assets/{id}.{ext}` and returns the key. `find(id)` returns the path and media type.
- `api.py`: `GET /api/assets/{generation_id}` (immutable cache headers).

## Invariants
- Keys are validated (`[A-Za-z0-9-]`), so there is no path traversal.
- Asset bytes are written **before** the generation is marked `succeeded`. A succeeded generation always has its file.
- `npm run reset-data` deletes `data/`, which includes all assets.

## Tests
`uv run pytest app/domains/assets`
