"""Mocked image model. No network calls: waits, then returns the local fixture (or fails on "fail")."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from pathlib import Path

from app.domains.providers.base import Completed, Failed, ProviderEvent, ProviderRequest, Started

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "bioluminescent-forest.svg"
FAIL_PROMPT = "fail"


class MockImageProvider:
    name = "mock"

    def __init__(self, queued_delay_s: float, processing_delay_s: float, fixture: Path = FIXTURE_PATH) -> None:
        self._queued_delay_s = queued_delay_s
        self._processing_delay_s = processing_delay_s
        self._fixture = fixture

    async def run(self, request: ProviderRequest) -> AsyncIterator[ProviderEvent]:
        # Simulated time waiting in the vendor's queue before work starts.
        await asyncio.sleep(self._queued_delay_s)
        yield Started()
        await asyncio.sleep(self._processing_delay_s)
        if request.prompt.strip().casefold() == FAIL_PROMPT:
            yield Failed("The mock model rejected this prompt.")
            return
        yield Completed(content=self._fixture.read_bytes(), media_type="image/svg+xml", extension="svg")
