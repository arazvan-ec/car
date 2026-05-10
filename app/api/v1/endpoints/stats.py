from fastapi import APIRouter, Depends, Security
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import require_api_key
from app.db.session import get_db
from app.db.entities import VehicleAnalysisEntity, ComparisonEntity
from app.api.v1.schemas import AnalysisStats

router = APIRouter()


@router.get(
    "/",
    response_model=AnalysisStats,
    summary="Estadísticas de negocio",
    description=(
        "Devuelve métricas agregadas sobre los análisis guardados: marcas más "
        "analizadas, tipos de propulsión, precio medio y valoración media de prensa. "
        "Diseñado para alimentar dashboards de negocio."
    ),
)
def get_stats(
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    total_analyses = db.query(func.count(VehicleAnalysisEntity.id)).scalar()
    total_comparisons = db.query(func.count(ComparisonEntity.id)).scalar()

    top_brands = (
        db.query(VehicleAnalysisEntity.brand, func.count().label("count"))
        .group_by(VehicleAnalysisEntity.brand)
        .order_by(func.count().desc())
        .limit(10)
        .all()
    )

    top_fuel_types = (
        db.query(VehicleAnalysisEntity.fuel_type, func.count().label("count"))
        .group_by(VehicleAnalysisEntity.fuel_type)
        .order_by(func.count().desc())
        .all()
    )

    avg_price = db.query(func.avg(VehicleAnalysisEntity.list_price_eur)).scalar()
    avg_rating = db.query(func.avg(VehicleAnalysisEntity.press_rating)).scalar()

    return AnalysisStats(
        total_analyses=total_analyses or 0,
        total_comparisons=total_comparisons or 0,
        top_brands=[{"brand": b, "count": c} for b, c in top_brands],
        top_fuel_types=[{"fuel_type": f, "count": c} for f, c in top_fuel_types],
        avg_price_eur=round(avg_price, 2) if avg_price else None,
        avg_press_rating=round(avg_rating, 2) if avg_rating else None,
    )
