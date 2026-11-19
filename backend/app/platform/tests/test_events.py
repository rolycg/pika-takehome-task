import asyncio

from app.platform.events import Event, EventBus


async def test_fan_out_to_every_subscriber() -> None:
    bus = EventBus()
    a, b = bus.subscribe(), bus.subscribe()
    bus.publish(Event("x", {"n": 1}))
    assert (await a.get()).data == {"n": 1}
    assert (await b.get()).data == {"n": 1}


async def test_slow_subscriber_is_dropped_and_told_to_resync() -> None:
    bus = EventBus(max_queue=2)
    slow = bus.subscribe()
    for n in range(3):
        bus.publish(Event("x", {"n": n}))
    assert bus.subscriber_count == 0
    drained = [slow.get_nowait() for _ in range(slow.qsize())]
    assert drained[-1] is None  # close sentinel -> client reconnects and refetches a snapshot


async def test_unsubscribe_stops_delivery() -> None:
    bus = EventBus()
    q = bus.subscribe()
    bus.unsubscribe(q)
    bus.publish(Event("x", {}))
    await asyncio.sleep(0)
    assert q.empty()
