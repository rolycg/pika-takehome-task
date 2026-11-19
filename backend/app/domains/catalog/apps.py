"""The Apps catalog. The product currently ships exactly one App."""

from __future__ import annotations

from pydantic import BaseModel


class AppEntry(BaseModel):
    id: str
    name: str
    description: str
    path: str


APPS: tuple[AppEntry, ...] = (
    AppEntry(
        id="create-image",
        name="Create Image",
        description="Generate an image from a prompt, Pick any image model.",
        path="/apps/create-image",
    ),
)
