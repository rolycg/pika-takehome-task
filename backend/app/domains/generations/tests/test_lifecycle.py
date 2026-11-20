"""Transitions, events, recovery after restart, and persistence across restarts."""

import asyncio

import pytest

from app.domains.assets.store import AssetStore
from app.domains.generations.models import AspectRatio, Status, Style
from app.domains.generations.recovery import recover_interrupted
from app.domains.generations.repository import GenerationRepository, IllegalTransition
from app.domains.generations.worker import GenerationWorker
from app.domains.providers.base import Completed, Started
from app.main import create_app
from app.platform.db import Database
from app.platform.events import EventBus
from conftest import make_settings, wait_until


def make_repo(settings) -> GenerationRepository:
    repo = GenerationRepository(Database(settings.db_path))
    repo.init_schema()
    return repo


def seed(repo: GenerationRepository, prompt: str = "seeded"):
    generation, _ = repo.create(
        prompt=prompt, aspect_ratio=AspectRatio.SQUARE, style=Style.ILLUSTRATION, provider="mock", idempotency_key=None
    )
    return generation


def test_transitions_are_compare_and_set(settings) -> None:
    repo = make_repo(settings)
    g = seed(repo)
    moved = repo.transition(g.id, expected=Status.QUEUED, to=Status.PROCESSING, increment_attempts=True)
    assert moved is not None and moved.status == Status.PROCESSING and moved.version == 2 and moved.attempts == 1
    # A second writer that still thinks it's queued loses.
    assert repo.transition(g.id, expected=Status.QUEUED, to=Status.PROCESSING) is None


def test_illegal_transitions_are_rejected(settings) -> None:
    repo = make_repo(settings)
    g = seed(repo)
    with pytest.raises(IllegalTransition):
        repo.transition(g.id, expected=Status.QUEUED, to=Status.SUCCEEDED)
    with pytest.raises(IllegalTransition):
        repo.transition(g.id, expected=Status.SUCCEEDED, to=Status.QUEUED)


def test_database_enforces_single_active(settings) -> None:
    repo = make_repo(settings)
    seed(repo)
    conn = Database(settings.db_path).connect()
    with pytest.raises(Exception):
        conn.execute(
            "INSERT INTO generations (id, prompt, aspect_ratio, style, provider, status, created_at, updated_at)"
            " VALUES ('x', 'p', '1:1', 'Cinematic', 'mock', 'queued', 'now', 'now')"
        )
    conn.close()


def test_recovery_requeues_processing_and_gives_up_after_max_attempts(settings) -> None:
    repo = make_repo(settings)
    g = seed(repo)

    def start_then_restart():
        repo.transition(g.id, expected=Status.QUEUED, to=Status.PROCESSING, increment_attempts=True)
        return recover_interrupted(repo, max_attempts=3)

    # Starts 1 and 2 are interrupted -> resumed (back to queued).
    for attempt in (1, 2):
        report = start_then_restart()
        assert (report.requeued, report.failed, report.still_queued) == (1, 0, 1)
        assert repo.get(g.id).status == Status.QUEUED
        assert repo.get(g.id).attempts == attempt

    # Start 3 is interrupted -> out of attempts -> failed with a reason.
    report = start_then_restart()
    assert (report.requeued, report.failed) == (0, 1)
    assert repo.get(g.id).status == Status.FAILED
    assert "giving up" in repo.get(g.id).error


def test_recovery_leaves_queued_and_finished_rows_alone(settings) -> None:
    repo = make_repo(settings)
    g = seed(repo)
    report = recover_interrupted(repo, max_attempts=3)
    assert (report.requeued, report.failed, report.still_queued) == (0, 0, 1)
    assert repo.get(g.id).version == 1


async def test_interrupted_generation_resumes_after_restart(tmp_path) -> None:
    settings = make_settings(tmp_path / "data")
    repo = make_repo(settings)
    g = seed(repo, "interrupted mid-flight")
    repo.transition(g.id, expected=Status.QUEUED, to=Status.PROCESSING, increment_attempts=True)

    # "Restart": a fresh app on the same data dir runs recovery and the worker finishes the job.
    app = create_app(settings)
    async with app.router.lifespan_context(app):
        await wait_until(lambda: repo.get(g.id).status == Status.SUCCEEDED)
    finished = repo.get(g.id)
    assert finished.attempts == 2


async def test_history_survives_restart(tmp_path) -> None:
    settings = make_settings(tmp_path / "data")
    app = create_app(settings)
    async with app.router.lifespan_context(app):
        repo = app.state.repo
        g = seed(repo, "keep me")
        app.state.worker._wake.set()
        await wait_until(lambda: repo.get(g.id).status == Status.SUCCEEDED)

    app2 = create_app(settings)
    async with app2.router.lifespan_context(app2):
        items = app2.state.repo.list_for_owner()
        assert [i.prompt for i in items] == ["keep me"]
        assert items[0].status == Status.SUCCEEDED


async def test_every_transition_is_published_in_order(client) -> None:
    bus = client.app.state.bus
    queue = bus.subscribe()
    created = (await client.post("/api/generations", json={
        "prompt": "watch me", "aspect_ratio": "9:16", "style": "Photorealistic"})).json()
    seen = []
    while not seen or seen[-1] not in ("succeeded", "failed"):
        event = await asyncio.wait_for(queue.get(), timeout=3)
        assert event.data["id"] == created["id"]
        seen.append(event.data["status"])
    assert seen == ["queued", "processing", "succeeded"]


async def test_provider_timeout_fails_generation(tmp_path) -> None:
    settings = make_settings(tmp_path / "data", processing_delay_s=1.0, provider_timeout_s=0.2)
    app = create_app(settings)
    async with app.router.lifespan_context(app):
        repo = app.state.repo
        g = seed(repo, "slow")
        app.state.worker._wake.set()
        await wait_until(lambda: repo.get(g.id).status == Status.FAILED)
        assert "Timed out" in repo.get(g.id).error


async def test_asset_is_removed_when_worker_loses_the_success_transition(settings) -> None:
    repo = make_repo(settings)
    assets = AssetStore(settings.assets_dir)
    g = seed(repo, "raced")

    class RacedProvider:
        async def run(self, request):
            yield Started()
            # Someone else finishes the generation while the provider is still working.
            repo.transition(g.id, expected=Status.PROCESSING, to=Status.FAILED, error="moved elsewhere")
            yield Completed(content=b"<svg/>", media_type="image/svg+xml", extension="svg")

    worker = GenerationWorker(repo=repo, providers={"mock": RacedProvider()}, assets=assets,
                              bus=EventBus(), wake=asyncio.Event(), provider_timeout_s=5)
    await worker.process(repo.get(g.id))

    assert repo.get(g.id).status == Status.FAILED
    assert repo.get(g.id).asset_key is None
    assert assets.find(g.id) is None


def test_idempotency_keys_are_scoped_per_owner(settings) -> None:
    repo = make_repo(settings)
    inputs = dict(prompt="same", aspect_ratio=AspectRatio.SQUARE, style=Style.ILLUSTRATION, provider="mock",
                  idempotency_key="click-1")
    a, created_a = repo.create(**inputs, owner_id="owner-a")
    b, created_b = repo.create(**inputs, owner_id="owner-b")
    replay, created_replay = repo.create(**inputs, owner_id="owner-a")
    assert created_a and created_b and not created_replay
    assert a.id != b.id
    assert replay.id == a.id
