"""HTTP contract for /api/generations."""

import time

import pytest

from conftest import wait_until

VALID = {"prompt": "A tiny astronaut exploring a bioluminescent forest.", "aspect_ratio": "16:9", "style": "Cinematic"}


async def status_of(client, generation_id: str) -> str:
    return (await client.get(f"/api/generations/{generation_id}")).json()["status"]


async def wait_for_status(client, generation_id: str, expected: str) -> None:
    async def check():
        return await status_of(client, generation_id) == expected
    await wait_until(check)


async def test_create_returns_queued_immediately(client) -> None:
    started = time.monotonic()
    response = await client.post("/api/generations", json=VALID)
    assert time.monotonic() - started < 0.5
    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "queued"
    assert body["prompt"] == VALID["prompt"]
    assert body["aspect_ratio"] == "16:9"
    assert body["style"] == "Cinematic"
    assert body["image_url"] is None
    assert body["created_at"].endswith("Z")
    assert response.headers["location"] == f"/api/generations/{body['id']}"


async def test_lifecycle_reaches_succeeded_with_image(client) -> None:
    created = (await client.post("/api/generations", json=VALID)).json()
    await wait_for_status(client, created["id"], "succeeded")
    done = (await client.get(f"/api/generations/{created['id']}")).json()
    assert done["attempts"] == 1
    assert done["started_at"] and done["completed_at"]
    assert done["version"] == 3  # created, processing, succeeded
    image = await client.get(done["image_url"])
    assert image.status_code == 200
    assert image.headers["content-type"].startswith("image/svg+xml")


@pytest.mark.parametrize("prompt", ["fail", "  FAIL  ", "FaIl\n"])
async def test_fail_prompt_ends_failed(client, prompt) -> None:
    created = (await client.post("/api/generations", json={**VALID, "prompt": prompt})).json()
    assert created["prompt"] == prompt.strip()
    await wait_for_status(client, created["id"], "failed")
    failed = (await client.get(f"/api/generations/{created['id']}")).json()
    assert failed["error"]
    assert failed["image_url"] is None


@pytest.mark.parametrize(
    "payload, field",
    [
        ({**VALID, "prompt": ""}, "prompt"),
        ({**VALID, "prompt": "   \n\t"}, "prompt"),
        ({**VALID, "prompt": "x" * 1001}, "prompt"),
        ({**VALID, "aspect_ratio": "4:3"}, "aspect_ratio"),
        ({**VALID, "style": "Anime"}, "style"),
        ({k: v for k, v in VALID.items() if k != "style"}, "style"),
        ({**VALID, "model": "gpt-image"}, "model"),
    ],
)
async def test_validation_rejects_bad_input(client, payload, field) -> None:
    response = await client.post("/api/generations", json=payload)
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert any(f["field"] == field for f in error["fields"])
    assert (await client.get("/api/generations")).json()["items"] == []


async def test_only_one_active_generation(client) -> None:
    first = (await client.post("/api/generations", json=VALID)).json()
    second = await client.post("/api/generations", json={**VALID, "prompt": "another"})
    assert second.status_code == 409
    assert second.json()["error"]["active_generation_id"] == first["id"]
    await wait_for_status(client, first["id"], "succeeded")
    third = await client.post("/api/generations", json={**VALID, "prompt": "another"})
    assert third.status_code == 202


async def test_idempotency_key_prevents_duplicates(client) -> None:
    headers = {"Idempotency-Key": "click-123"}
    a = await client.post("/api/generations", json=VALID, headers=headers)
    b = await client.post("/api/generations", json=VALID, headers=headers)
    assert a.status_code == 202
    assert b.status_code == 200
    assert a.json()["id"] == b.json()["id"]
    assert len((await client.get("/api/generations")).json()["items"]) == 1


async def test_idempotency_key_reuse_with_different_inputs_is_rejected(client) -> None:
    headers = {"Idempotency-Key": "click-456"}
    await client.post("/api/generations", json=VALID, headers=headers)
    response = await client.post("/api/generations", json={**VALID, "style": "Illustration"}, headers=headers)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "idempotency_key_reused"


async def test_list_is_newest_first(client) -> None:
    ids = []
    for prompt in ["one", "two", "three"]:
        created = (await client.post("/api/generations", json={**VALID, "prompt": prompt})).json()
        ids.append(created["id"])
        await wait_for_status(client, created["id"], "succeeded")
    items = (await client.get("/api/generations")).json()["items"]
    assert [i["id"] for i in items] == list(reversed(ids))
    assert [i["prompt"] for i in items] == ["three", "two", "one"]


async def test_options_expose_supported_values(client) -> None:
    body = (await client.get("/api/generations/options")).json()
    assert body["aspect_ratios"] == ["1:1", "16:9", "9:16"]
    assert body["styles"] == ["Photorealistic", "Illustration", "Cinematic"]


async def test_unknown_generation_is_404(client) -> None:
    response = await client.get("/api/generations/does-not-exist")
    assert response.status_code == 404
