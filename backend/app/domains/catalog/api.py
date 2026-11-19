"""GET /api/apps — the Apps page reads its cards from here."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.domains.catalog.apps import APPS, AppEntry


class AppList(BaseModel):
    items: list[AppEntry]


def build_router() -> APIRouter:
    router = APIRouter(tags=["catalog"])

    @router.get("/api/apps", response_model=AppList)
    async def list_apps() -> AppList:
        return AppList(items=list(APPS))

    return router
