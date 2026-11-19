"""Background worker. After creation, every status change of a generation happens here.

One generation runs at a time (the product allows only one active). The worker is woken by the
service when work is created, and also re-checks the queue periodically as a safety net.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Mapping

from app.domains.assets.store import AssetStore
from app.domains.generations.events import publish_generation
from app.domains.generations.models import Generation, Status
from app.domains.generations.repository import GenerationRepository, utc_now
from app.domains.providers.base import Completed, Failed, ImageProvider, ProviderRequest, Started
from app.platform.events import EventBus

log = logging.getLogger(__name__)

IDLE_RECHECK_S = 2.0


class GenerationWorker:
    def __init__(
        self,
        *,
        repo: GenerationRepository,
        providers: Mapping[str, ImageProvider],
        assets: AssetStore,
        bus: EventBus,
        wake: asyncio.Event,
        provider_timeout_s: float,
    ) -> None:
        self._repo = repo
        self._providers = providers
        self._assets = assets
        self._bus = bus
        self._wake = wake
        self._timeout_s = provider_timeout_s
        self._task: asyncio.Task[None] | None = None

    # --- lifecycle ------------------------------------------------------------------------

    def start(self) -> None:
        if self._task is None:
            self._task = asyncio.create_task(self._run(), name="generation-worker")

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _run(self) -> None:
        while True:
            self._wake.clear()
            generation = self._repo.next_queued()
            if generation is None:
                try:
                    await asyncio.wait_for(self._wake.wait(), timeout=IDLE_RECHECK_S)
                except TimeoutError:
                    pass
                continue
            try:
                await self.process(generation)
            except asyncio.CancelledError:
                raise
            except Exception:  # never let one bad generation kill the loop
                log.exception("unexpected error processing generation %s", generation.id)
                self._fail(generation.id, Status.QUEUED, "Internal error while generating.")
                self._fail(generation.id, Status.PROCESSING, "Internal error while generating.")

    # --- one generation -------------------------------------------------------------------

    async def process(self, generation: Generation) -> None:
        provider = self._providers.get(generation.provider)
        if provider is None:
            self._fail(generation.id, Status.QUEUED, f"Unknown provider '{generation.provider}'.")
            return

        request = ProviderRequest(
            generation_id=generation.id,
            prompt=generation.prompt,
            aspect_ratio=generation.aspect_ratio.value,
            style=generation.style.value,
        )
        current = Status.QUEUED
        try:
            async with asyncio.timeout(self._timeout_s):
                async for event in provider.run(request):
                    match event:
                        case Started():
                            updated = self._move(generation.id, current, Status.PROCESSING,
                                                 increment_attempts=True, started_at=utc_now())
                            if updated is None:
                                return  # someone else moved it; our view is stale
                            current = Status.PROCESSING
                        case Completed(content=content, extension=extension):
                            if current is not Status.PROCESSING:
                                self._fail(generation.id, current, "Provider completed without starting.")
                                return
                            key = self._assets.save(generation.id, content, extension)
                            self._move(generation.id, current, Status.SUCCEEDED,
                                       asset_key=key, completed_at=utc_now())
                            return
                        case Failed(reason=reason):
                            self._fail(generation.id, current, reason)
                            return
            self._fail(generation.id, current, "Provider finished without a result.")
        except TimeoutError:
            self._fail(generation.id, current, f"Timed out after {self._timeout_s:g}s.")

    # --- helpers --------------------------------------------------------------------------

    def _move(self, generation_id: str, expected: Status, to: Status, **kwargs) -> Generation | None:
        updated = self._repo.transition(generation_id, expected=expected, to=to, **kwargs)
        if updated is None:
            log.warning("stale transition %s -> %s ignored for %s", expected, to, generation_id)
        else:
            publish_generation(self._bus, updated)
        return updated

    def _fail(self, generation_id: str, expected: Status, reason: str) -> None:
        updated = self._repo.transition(
            generation_id, expected=expected, to=Status.FAILED, error=reason, completed_at=utc_now()
        )
        if updated is not None:
            publish_generation(self._bus, updated)
