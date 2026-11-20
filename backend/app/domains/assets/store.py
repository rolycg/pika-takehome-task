"""Stores generated media on local disk. In production this is object storage behind signed URLs."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

_SAFE_ID = re.compile(r"^[A-Za-z0-9-]{1,64}$")
_MEDIA_TYPES = {"svg": "image/svg+xml", "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}


@dataclass(frozen=True)
class StoredAsset:
    path: Path
    media_type: str


class AssetStore:
    def __init__(self, root: Path) -> None:
        self.root = root
        root.mkdir(parents=True, exist_ok=True)

    def save(self, owner_id: str, content: bytes, extension: str) -> str:
        """Write atomically and return the storage key (file name)."""
        if not _SAFE_ID.match(owner_id) or extension not in _MEDIA_TYPES:
            raise ValueError("unsafe asset key")
        key = f"{owner_id}.{extension}"
        tmp = self.root / f".{key}.tmp"
        tmp.write_bytes(content)
        tmp.replace(self.root / key)
        return key

    def find(self, owner_id: str) -> StoredAsset | None:
        if not _SAFE_ID.match(owner_id):
            return None
        for ext, media_type in _MEDIA_TYPES.items():
            path = self.root / f"{owner_id}.{ext}"
            if path.is_file():
                return StoredAsset(path=path, media_type=media_type)
        return None

    def delete(self, key: str) -> None:
        """Remove a stored asset by the key `save` returned. Missing files are ignored."""
        owner_id, _, extension = key.rpartition(".")
        if not _SAFE_ID.match(owner_id) or extension not in _MEDIA_TYPES:
            raise ValueError("unsafe asset key")
        (self.root / key).unlink(missing_ok=True)
