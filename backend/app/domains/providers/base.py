"""The provider boundary. Everything model-specific lives behind ImageProvider.

A provider is an async stream of lifecycle events for one request. That shape fits both a mock
(sleep + yield) and real vendors (submit, then poll or receive webhooks, translating vendor
states into these events) without the generations domain knowing which one it is talking to.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ProviderRequest:
    generation_id: str
    prompt: str
    aspect_ratio: str
    style: str


@dataclass(frozen=True)
class Started:
    """The provider has picked the request up and is generating."""


@dataclass(frozen=True)
class Completed:
    content: bytes
    media_type: str
    extension: str


@dataclass(frozen=True)
class Failed:
    reason: str


ProviderEvent = Started | Completed | Failed


class ImageProvider(Protocol):
    name: str

    def run(self, request: ProviderRequest) -> AsyncIterator[ProviderEvent]:
        """Yield Started once, then exactly one terminal event (Completed or Failed)."""
        ...
