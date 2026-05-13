from fastapi import APIRouter, Depends, Security
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import require_api_key
from app.db.session import get_db
from app.db.entities import VehicleAnalysisEntity, ComparisonEntity
from app.api.v1.schemas import AnalysisStats

router = APIRouter()


@router.get("/", response_model=AnalysisStats, summary="Estadísticas de negocio")
def get_stats(db: Session = Depends(get_db), _: str = Security(require_api_key)):
    total_analyses = db.query(func.count(VehicleAnalysisEntity.id)).scalar() or 0
    total_comparisons = db.query(func.count(ComparisonEntity.id)).scalar() or 0

    top_brands = (
        db.query(VehicleAnalysisEntity.brand, func.count().label("count"))
        .group_by(VehicleAnalysisEntity.brand)
        .order_by(func.count().desc()).limit(10).all()
    )
    top_fuel_types = (
        db.query(VehicleAnalysisEntity.fuel_type, func.count().label("count"))
        .group_by(VehicleAnalysisEntity.fuel_type)
        .order_by(func.count().desc()).all()
    )
    top_segments = (
        db.query(VehicleAnalysisEntity.segment, func.count().label("count"))
        .filter(VehicleAnalysisEntity.segment.isnot(None))
        .group_by(VehicleAnalysisEntity.segment)
        .order_by(func.count().desc()).limit(10).all()
    )

    avg_price = db.query(func.avg(VehicleAnalysisEntity.list_price_eur)).scalar()
    avg_press = db.query(func.avg(VehicleAnalysisEntity.press_rating)).scalar()
    avg_owner = db.query(func.avg(VehicleAnalysisEntity.owner_rating)).scalar()
    avg_ncap = db.query(func.avg(VehicleAnalysisEntity.euro_ncap_stars)).scalar()

    return AnalysisStats(
        total_analyses=total_analyses,
        total_comparisons=total_comparisons,
        top_brands=[{"brand": b, "count": c} for b, c in top_brands],
        top_fuel_types=[{"fuel_type": f, "count": c} for f, c in top_fuel_types],
        top_segments=[{"segment": s, "count": c} for s, c in top_segments],
        avg_price_eur=round(avg_price, 2) if avg_price else None,
        avg_press_rating=round(avg_press, 2) if avg_press else None,
        avg_owner_rating=round(avg_owner, 2) if avg_owner else None,
        avg_euro_ncap_stars=round(avg_ncap, 2) if avg_ncap else None,
    )
