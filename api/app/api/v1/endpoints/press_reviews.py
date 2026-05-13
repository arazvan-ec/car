"""
Endpoints para reviews individuales de prensa.
Rutas anidadas bajo /analyses/{analysis_id}/reviews/
"""
from uuid import UUID
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.security import require_api_key
from app.db.session import get_db
from app.domain.models import PressReview
from app.repositories.press_review_repository import PressReviewRepository
from app.repositories.vehicle_analysis_repository import VehicleAnalysisRepository

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class PressReviewCreate(BaseModel):
    source: str = Field(..., examples=["km77"])
    url: str = Field(..., examples=["https://www.km77.com/coches/ford/kuga/2024/..."])
    rating: Optional[float] = Field(None, examples=[7.5])
    title: Optional[str] = Field(None, examples=["Ford Kuga 2024 - Cumple bien como vehículo familiar"])
    author: Optional[str] = Field(None, examples=["Alfonso Herrero"])
    published_date: Optional[str] = Field(None, examples=["2025-02-18"])
    summary: Optional[str] = None
    full_text: Optional[str] = None
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    verdict: Optional[str] = None


class PressReviewResponse(PressReviewCreate):
    id: UUID
    analysis_id: UUID
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=PressReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Guardar una review de prensa",
    description=(
        "Persiste el texto completo y los metadatos de una review de prensa "
        "vinculada a un análisis de vehículo. Permite consultar la fuente original "
        "sin necesidad de volver a buscarla."
    ),
)
def create_review(
    analysis_id: UUID,
    payload: PressReviewCreate,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    # Verificar que el análisis existe
    analysis_repo = VehicleAnalysisRepository(db)
    if not analysis_repo.find_by_id(analysis_id):
        raise HTTPException(status_code=404, detail="Análisis no encontrado.")

    repo = PressReviewRepository(db)
    review = PressReview(analysis_id=analysis_id, **payload.model_dump())
    saved = repo.save(review)
    return _to_response(saved)


@router.get(
    "/",
    response_model=list[PressReviewResponse],
    summary="Listar reviews de un análisis",
)
def list_reviews(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PressReviewRepository(db)
    results = repo.find_by_analysis(analysis_id)
    return [_to_response(r) for r in results]


@router.get(
    "/{review_id}",
    response_model=PressReviewResponse,
    summary="Obtener una review por ID",
)
def get_review(
    analysis_id: UUID,
    review_id: UUID,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PressReviewRepository(db)
    result = repo.find_by_id(review_id)
    if not result or result.analysis_id != analysis_id:
        raise HTTPException(status_code=404, detail="Review no encontrada.")
    return _to_response(result)


@router.delete(
    "/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una review",
)
def delete_review(
    analysis_id: UUID,
    review_id: UUID,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PressReviewRepository(db)
    result = repo.find_by_id(review_id)
    if not result or result.analysis_id != analysis_id:
        raise HTTPException(status_code=404, detail="Review no encontrada.")
    repo.delete(review_id)


def _to_response(review: PressReview) -> PressReviewResponse:
    return PressReviewResponse(**review.__dict__)
