from app.domains.providers.base import Completed, Failed, ProviderRequest, Started
from app.domains.providers.mock import MockImageProvider


def request(prompt: str) -> ProviderRequest:
    return ProviderRequest(generation_id="g1", prompt=prompt, aspect_ratio="1:1", style="Cinematic")


async def collect(prompt: str) -> list:
    provider = MockImageProvider(queued_delay_s=0, processing_delay_s=0)
    return [event async for event in provider.run(request(prompt))]


async def test_successful_prompt_returns_fixture_after_started() -> None:
    events = await collect("A tiny astronaut exploring a bioluminescent forest.")
    assert isinstance(events[0], Started)
    assert isinstance(events[1], Completed)
    assert events[1].media_type == "image/svg+xml"
    assert events[1].content.startswith(b"<svg")
    assert len(events) == 2


async def test_fail_prompt_is_trimmed_and_case_insensitive() -> None:
    for prompt in ["fail", "  FAIL ", "\tFaIl\n"]:
        events = await collect(prompt)
        assert isinstance(events[0], Started)
        assert isinstance(events[1], Failed)


async def test_prompt_merely_containing_fail_succeeds() -> None:
    events = await collect("failure is not an option")
    assert isinstance(events[-1], Completed)
