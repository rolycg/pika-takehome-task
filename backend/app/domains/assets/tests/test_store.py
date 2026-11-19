import pytest

from app.domains.assets.store import AssetStore


def test_save_and_find_roundtrip(tmp_path) -> None:
    store = AssetStore(tmp_path)
    key = store.save("abc-123", b"<svg/>", "svg")
    assert key == "abc-123.svg"
    found = store.find("abc-123")
    assert found is not None
    assert found.media_type == "image/svg+xml"
    assert found.path.read_bytes() == b"<svg/>"


def test_rejects_path_traversal(tmp_path) -> None:
    store = AssetStore(tmp_path)
    with pytest.raises(ValueError):
        store.save("../evil", b"x", "svg")
    assert store.find("../evil") is None
    assert store.find("missing") is None
