from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session

from app.core.security import require_api_key
from app.db.session import get_db
from app.domain.models import VehicleAnalysis
from app.repositories.vehicle_analysis_repository import VehicleAnalysisRepository
from app.api.v1.schemas import VehicleAnalysisCreate, VehicleAnalysisResponse

router = APIRouter()


@router.post(
    "/",
    response_model=VehicleAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Guardar un análisis de vehículo",
    description=(
        "Persiste el resultado de un análisis generado por el skill "
        "car-configurator-preferences. Incluye datos de catálogo y datos reales "
        "obtenidos de fuentes especializadas (km77, Motor1, Euro NCAP, etc.)."
    ),
)
def create_analysis(
    payload: VehicleAnalysisCreate,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = VehicleAnalysisRepository(db)
    analysis = VehicleAnalysis(**payload.model_dump())
    saved = repo.save(analysis)
    return _to_response(saved)


@router.get(
    "/",
    response_model=list[VehicleAnalysisResponse],
    summary="Listar análisis guardados",
)
def list_analyses(
    brand: Optional[str] = None,
    model: Optional[str] = None,
    fuel_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = VehicleAnalysisRepository(db)
    results = repo.find_all(brand=brand, model=model, fuel_type=fuel_type, skip=skip, limit=limit)
    return [_to_response(r) for r in results]


@router.get(
    "/{analysis_id}",
    response_model=VehicleAnalysisResponse,
    summary="Obtener un análisis por ID",
)
def get_analysis(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = VehicleAnalysisRepository(db)
    result = repo.find_by_id(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail="Análisis no encontrado.")
    return _to_response(result)


@router.delete(
    "/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar un análisis",
)
def delete_analysis(
    analysis_id: UUID,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = VehicleAnalysisRepository(db)
    deleted = repo.delete(analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Análisis no encontrado.")


def _to_response(analysis: VehicleAnalysis) -> VehicleAnalysisResponse:
    return VehicleAnalysisResponse(**analysis.__dict__)
