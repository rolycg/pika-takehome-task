"""Shared test fixtures: an isolated data dir, near-zero mock delays, and an app client with lifespan."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Callable
from pathlib import Path

import httpx
import pytest

from app.main import create_app
from app.platform.config import Settings


def make_settings(data_dir: Path, **overrides) -> Settings:
    values = dict(
        data_dir=data_dir,
        queued_delay_s=0.05,
        processing_delay_s=0.05,
        provider_timeout_s=5,
        max_attempts=3,
    )
    values.update(overrides)
    return Settings(**values)


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    return make_settings(tmp_path / "data")


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[httpx.AsyncClient]:
    app = create_app(settings)
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
            c.app = app  # type: ignore[attr-defined]
            yield c


async def wait_until(predicate: Callable[[], object], timeout: float = 3.0, interval: float = 0.01) -> None:
    deadline = asyncio.get_running_loop().time() + timeout
    while not await _maybe_await(predicate()):
        if asyncio.get_running_loop().time() > deadline:
            raise AssertionError("condition not met in time")
        await asyncio.sleep(interval)


async def _maybe_await(value: object) -> object:
    if asyncio.iscoroutine(value):
        return await value
    return value
