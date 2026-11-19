# backend/app/domains/providers — model provider boundary

**Purpose:** everything model-specific lives here, behind one protocol, so a real provider can replace the mock without touching other domains.

## Contract (`base.py`)
`ImageProvider.run(ProviderRequest) -> AsyncIterator[ProviderEvent]` yields `Started` once, then exactly one terminal event, `Completed(content, media_type, extension)` or `Failed(reason)`.
The worker maps these events onto generation statuses. Providers never touch the database, the event bus or HTTP.

## Mock (`mock.py`)
- Sleeps `MOCK_QUEUED_DELAY_S` (default 1.5), yields `Started`, sleeps `MOCK_PROCESSING_DELAY_S` (default 3.0).
- If `prompt.strip().casefold() == "fail"` it yields `Failed`; otherwise `Completed` with `fixtures/bioluminescent-forest.svg`.
- The fixture is an original SVG with `preserveAspectRatio="xMidYMid slice"`, so it fills 1:1, 16:9 and 9:16 frames.

## Adding a real provider
1. Write a new `<vendor>.py` implementing `run()`: submit, then poll or receive a webhook, translating vendor states into the events above. Use the generation id as the vendor idempotency key.
2. Register it in `registry.py:build_providers`, with any secrets read from env.
3. Nothing in `generations/` changes. See [ADR-0004](../../../../docs/decisions/0004-provider-boundary-event-stream.md).

## Tests
`uv run pytest app/domains/providers`
