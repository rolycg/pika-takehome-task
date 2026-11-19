"""HTTP routes for generations."""

from __future__ import annotations

from fastapi import APIRouter, Header, Response, status
from fastapi.responses import JSONResponse

from app.domains.generations.models import AspectRatio, Style
from app.domains.generations.repository import (
    ActiveGenerationExists,
    GenerationRepository,
    IdempotencyKeyReused,
)
from app.domains.generations.schemas import (
    PROMPT_MAX_LENGTH,
    CreateGenerationRequest,
    GenerationList,
    GenerationOptions,
    GenerationOut,
)
from app.domains.generations.service import GenerationService

EXAMPLE_PROMPT = "A tiny astronaut exploring a bioluminescent forest."


def error(status_code: int, code: str, message: str, **extra: object) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": {"code": code, "message": message, **extra}})


def build_router(service: GenerationService, repo: GenerationRepository) -> APIRouter:
    router = APIRouter(prefix="/api/generations", tags=["generations"])

    @router.get("/options", response_model=GenerationOptions)
    async def options() -> GenerationOptions:
        return GenerationOptions(
            aspect_ratios=list(AspectRatio),
            styles=list(Style),
            default_aspect_ratio=AspectRatio.SQUARE,
            default_style=Style.PHOTOREALISTIC,
            prompt_max_length=PROMPT_MAX_LENGTH,
            example_prompt=EXAMPLE_PROMPT,
        )

    @router.post(
        "",
        status_code=status.HTTP_202_ACCEPTED,
        response_model=GenerationOut,
        responses={200: {"description": "Idempotent replay"}, 409: {}, 422: {}},
    )
    async def create(
        body: CreateGenerationRequest,
        response: Response,
        idempotency_key: str | None = Header(default=None, max_length=128),
    ):
        try:
            generation, created = service.create(body, idempotency_key)
        except ActiveGenerationExists as exc:
            return error(
                409,
                "generation_active",
                "A generation is already in progress. Wait for it to finish before starting another.",
                active_generation_id=exc.active.id,
            )
        except IdempotencyKeyReused:
            return error(422, "idempotency_key_reused", "This Idempotency-Key was already used with different inputs.")
        if not created:
            response.status_code = status.HTTP_200_OK
        response.headers["Location"] = f"/api/generations/{generation.id}"
        return GenerationOut.from_domain(generation)

    @router.get("", response_model=GenerationList)
    async def list_generations() -> GenerationList:
        return GenerationList(items=[GenerationOut.from_domain(g) for g in repo.list_for_owner()])

    @router.get("/{generation_id}", response_model=GenerationOut)
    async def get_generation(generation_id: str):
        generation = repo.get(generation_id)
        if generation is None:
            return error(404, "not_found", "Generation not found.")
        return GenerationOut.from_domain(generation)

    return router
