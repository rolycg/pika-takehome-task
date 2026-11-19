"""Composition root: builds platform services, wires the domains together, and owns the lifespan.

Run with: uv run uvicorn --factory app.main:create_app --reload
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.domains.assets import api as assets_api
from app.domains.assets.store import AssetStore
from app.domains.catalog import api as catalog_api
from app.domains.generations import api as generations_api
from app.domains.generations.recovery import recover_interrupted
from app.domains.generations.repository import GenerationRepository
from app.domains.generations.service import GenerationService
from app.domains.generations.worker import GenerationWorker
from app.domains.providers.registry import DEFAULT_PROVIDER, build_providers
from app.platform import sse
from app.platform.config import Settings
from app.platform.db import Database
from app.platform.events import EventBus

log = logging.getLogger("app")


def create_app(settings: Settings | None = None) -> FastAPI:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    settings = settings or Settings.from_env()

    db = Database(settings.db_path)
    bus = EventBus()
    assets = AssetStore(settings.assets_dir)
    repo = GenerationRepository(db)
    repo.init_schema()
    wake = asyncio.Event()
    service = GenerationService(repo, bus, wake, provider=DEFAULT_PROVIDER)
    worker = GenerationWorker(
        repo=repo,
        providers=build_providers(settings),
        assets=assets,
        bus=bus,
        wake=wake,
        provider_timeout_s=settings.provider_timeout_s,
    )

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        report = recover_interrupted(repo, settings.max_attempts)
        log.info("recovery: requeued=%s failed=%s queued=%s", report.requeued, report.failed, report.still_queued)
        worker.start()
        try:
            yield
        finally:
            bus.close_all()
            await worker.stop()

    app = FastAPI(title="Create Image API", version="0.1.0", lifespan=lifespan)
    app.state.settings = settings
    app.state.repo = repo
    app.state.worker = worker
    app.state.bus = bus

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        fields = []
        for err in exc.errors():
            loc = [str(p) for p in err.get("loc", ()) if p not in ("body",)]
            message = str(err.get("msg", "Invalid value")).removeprefix("Value error, ")
            fields.append({"field": ".".join(loc), "message": message})
        summary = "; ".join(f"{f['field']}: {f['message']}" if f["field"] else f["message"] for f in fields)
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "validation_error", "message": summary or "Invalid request.", "fields": fields}},
        )

    @app.get("/api/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(catalog_api.build_router())
    app.include_router(generations_api.build_router(service, repo))
    app.include_router(assets_api.build_router(assets))
    app.include_router(sse.build_router(bus))
    return app

