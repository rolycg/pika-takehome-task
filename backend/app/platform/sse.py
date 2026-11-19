"""GET /api/events — Server-Sent Events stream of everything published on the EventBus."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse

from app.platform.events import EventBus


def build_router(bus: EventBus) -> APIRouter:
    router = APIRouter()

    @router.get("/api/events")
    async def events(request: Request) -> EventSourceResponse:
        queue = bus.subscribe()

        async def stream() -> AsyncIterator[dict[str, str]]:
            try:
                # Lets the client know the stream is live so it can (re)fetch its snapshot.
                yield {"event": "ready", "data": "{}"}
                while True:
                    event = await queue.get()
                    if event is None:
                        return
                    yield {"event": event.type, "data": json.dumps(event.data)}
            finally:
                bus.unsubscribe(queue)

        return EventSourceResponse(stream(), ping=15)

    return router
