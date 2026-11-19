"""Provider lookup. Adding a real provider = new adapter module + one entry here."""

from __future__ import annotations

from app.domains.providers.base import ImageProvider
from app.domains.providers.mock import MockImageProvider
from app.platform.config import Settings

DEFAULT_PROVIDER = "mock"


def build_providers(settings: Settings) -> dict[str, ImageProvider]:
    return {
        "mock": MockImageProvider(
            queued_delay_s=settings.queued_delay_s,
            processing_delay_s=settings.processing_delay_s,
        ),
    }
