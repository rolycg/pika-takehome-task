"""Application service for creating generations. The API layer calls this; it never touches SQL."""

from __future__ import annotations

import asyncio

from app.domains.generations.events import publish_generation
from app.domains.generations.models import Generation
from app.domains.generations.repository import GenerationRepository
from app.domains.generations.schemas import CreateGenerationRequest
from app.platform.events import EventBus


class GenerationService:
    def __init__(self, repo: GenerationRepository, bus: EventBus, wake_worker: asyncio.Event, provider: str) -> None:
        self._repo = repo
        self._bus = bus
        self._wake_worker = wake_worker
        self._provider = provider

    def create(self, request: CreateGenerationRequest, idempotency_key: str | None) -> tuple[Generation, bool]:
        """Persist a queued generation and return immediately; the worker does the rest."""
        generation, created = self._repo.create(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            style=request.style,
            provider=self._provider,
            idempotency_key=idempotency_key,
        )
        if created:
            publish_generation(self._bus, generation)
            self._wake_worker.set()
        return generation, created
