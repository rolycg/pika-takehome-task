"""HTTP request/response shapes. Validation of user input happens here."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domains.generations.models import AspectRatio, Generation, Status, Style

PROMPT_MAX_LENGTH = 1000


class CreateGenerationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: str = Field(max_length=PROMPT_MAX_LENGTH + 200)  # coarse cap before trimming
    aspect_ratio: AspectRatio
    style: Style

    @field_validator("prompt")
    @classmethod
    def prompt_not_blank(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Prompt must not be empty.")
        if len(trimmed) > PROMPT_MAX_LENGTH:
            raise ValueError(f"Prompt must be at most {PROMPT_MAX_LENGTH} characters.")
        return trimmed


class GenerationOut(BaseModel):
    id: str
    prompt: str
    aspect_ratio: AspectRatio
    style: Style
    provider: str
    status: Status
    version: int
    attempts: int
    error: str | None
    image_url: str | None
    created_at: str
    updated_at: str
    started_at: str | None
    completed_at: str | None

    @classmethod
    def from_domain(cls, g: Generation) -> "GenerationOut":
        return cls(
            id=g.id,
            prompt=g.prompt,
            aspect_ratio=g.aspect_ratio,
            style=g.style,
            provider=g.provider,
            status=g.status,
            version=g.version,
            attempts=g.attempts,
            error=g.error,
            image_url=f"/api/assets/{g.id}" if g.status == Status.SUCCEEDED and g.asset_key else None,
            created_at=g.created_at,
            updated_at=g.updated_at,
            started_at=g.started_at,
            completed_at=g.completed_at,
        )


class GenerationList(BaseModel):
    items: list[GenerationOut]


class GenerationOptions(BaseModel):
    aspect_ratios: list[AspectRatio]
    styles: list[Style]
    default_aspect_ratio: AspectRatio
    default_style: Style
    prompt_max_length: int
    example_prompt: str
