"""Startup recovery: resume work interrupted by a restart.

Policy (see docs/decisions/0008-restart-resume-policy.md):
- queued rows are left alone; the worker picks them up in creation order.
- processing rows go back to queued and will be re-run. The mock provider's in-flight work died
  with the process, so re-running is the only way to finish it. (A real provider would re-attach
  to its stored operation id instead of resubmitting.)
- a row that has already been started MAX_ATTEMPTS times is failed instead, so a generation that
  crashes the process can't loop forever.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.domains.generations.models import Status
from app.domains.generations.repository import GenerationRepository, utc_now


@dataclass(frozen=True)
class RecoveryReport:
    requeued: int
    failed: int
    still_queued: int


def recover_interrupted(repo: GenerationRepository, max_attempts: int) -> RecoveryReport:
    requeued = failed = 0
    for generation in repo.list_by_status(Status.PROCESSING):
        if generation.attempts >= max_attempts:
            moved = repo.transition(
                generation.id,
                expected=Status.PROCESSING,
                to=Status.FAILED,
                error=f"Interrupted by restarts {generation.attempts} times; giving up.",
                completed_at=utc_now(),
            )
            failed += moved is not None
        else:
            moved = repo.transition(generation.id, expected=Status.PROCESSING, to=Status.QUEUED)
            requeued += moved is not None
    return RecoveryReport(requeued=requeued, failed=failed, still_queued=len(repo.list_by_status(Status.QUEUED)))
