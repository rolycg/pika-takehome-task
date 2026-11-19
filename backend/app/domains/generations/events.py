"""Turns generation changes into bus events. Always called after the change is committed."""

from __future__ import annotations

from app.domains.generations.models import Generation
from app.domains.generations.schemas import GenerationOut
from app.platform.events import Event, EventBus

GENERATION_UPDATED = "generation.updated"


def publish_generation(bus: EventBus, generation: Generation) -> None:
    bus.publish(Event(GENERATION_UPDATED, GenerationOut.from_domain(generation).model_dump(mode="json")))
