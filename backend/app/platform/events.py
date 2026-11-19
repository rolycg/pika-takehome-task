"""In-process event bus. Publishers call publish() *after* committing; each SSE subscriber gets its own queue.

A slow subscriber whose queue fills up is dropped; its client reconnects and re-syncs from a snapshot.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Event:
    type: str
    data: dict[str, Any]


class EventBus:
    def __init__(self, max_queue: int = 256) -> None:
        self._subscribers: set[asyncio.Queue[Event | None]] = set()
        self._max_queue = max_queue

    def subscribe(self) -> asyncio.Queue[Event | None]:
        queue: asyncio.Queue[Event | None] = asyncio.Queue(self._max_queue)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[Event | None]) -> None:
        self._subscribers.discard(queue)

    def publish(self, event: Event) -> None:
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                self._subscribers.discard(queue)
                # Sentinel tells the stream to close so the client reconnects and re-syncs.
                queue.get_nowait()
                queue.put_nowait(None)

    def close_all(self) -> None:
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(None)
            except asyncio.QueueFull:
                pass
        self._subscribers.clear()

    @property
    def subscriber_count(self) -> int:
        return len(self._subscribers)
