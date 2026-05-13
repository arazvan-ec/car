from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session

from app.core.security import require_api_key
from app.db.session import get_db
from app.domain.models import Comparison
from app.repositories.comparison_repository import ComparisonRepository
from app.repositories.vehicle_analysis_repository import VehicleAnalysisRepository
from app.api.v1.schemas import ComparisonCreate, ComparisonResponse

router = APIRouter()


@router.post(
    "/",
    response_model=ComparisonResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Guardar una comparativa entre dos modelos",
)
def create_comparison(
    payload: ComparisonCreate,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    analysis_repo = VehicleAnalysisRepository(db)
    if not analysis_repo.find_by_id(payload.analysis_a_id):
        raise HTTPException(status_code=404, detail="Análisis A no encontrado.")
    if not analysis_repo.find_by_id(payload.analysis_b_id):
        raise HTTPException(status_code=404, detail="Análisis B no encontrado.")

    repo = ComparisonRepository(db)
    comparison = Comparison(**payload.model_dump())
    saved = repo.save(comparison)
    return _to_response(saved)


@router.get(
    "/",
    response_model=list[ComparisonResponse],
    summary="Listar comparativas guardadas",
)
def list_comparisons(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = ComparisonRepository(db)
    results = repo.find_all(skip=skip, limit=limit)
    return [_to_response(r) for r in results]


@router.get(
    "/{comparison_id}",
    response_model=ComparisonResponse,
    summary="Obtener una comparativa por ID",
)
def get_comparison(
    comparison_id: UUID,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = ComparisonRepository(db)
    result = repo.find_by_id(comparison_id)
    if not result:
        raise HTTPException(status_code=404, detail="Comparativa no encontrada.")
    return _to_response(result)


def _to_response(comparison: Comparison) -> ComparisonResponse:
    return ComparisonResponse(**comparison.__dict__)
