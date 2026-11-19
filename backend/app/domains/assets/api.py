"""GET /api/assets/{generation_id} — serves a stored asset."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.domains.assets.store import AssetStore


def build_router(store: AssetStore) -> APIRouter:
    router = APIRouter()

    @router.get("/api/assets/{generation_id}")
    async def get_asset(generation_id: str) -> FileResponse:
        asset = store.find(generation_id)
        if asset is None:
            raise HTTPException(status_code=404, detail="Asset not found.")
        return FileResponse(asset.path, media_type=asset.media_type, headers={"Cache-Control": "private, max-age=31536000, immutable"})

    return router
