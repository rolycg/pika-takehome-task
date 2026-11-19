async def test_exactly_one_app_create_image(client) -> None:
    items = (await client.get("/api/apps")).json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == "create-image"
    assert items[0]["name"] == "Create Image"
    assert items[0]["path"] == "/apps/create-image"
