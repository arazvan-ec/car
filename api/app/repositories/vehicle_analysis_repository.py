from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.domain.models import VehicleAnalysis
from app.db.entities import VehicleAnalysisEntity
from app.db.translators import VehicleAnalysisTranslator


class VehicleAnalysisRepository:

    def __init__(self, db: Session):
        self.db = db

    def save(self, analysis: VehicleAnalysis) -> VehicleAnalysis:
        entity = VehicleAnalysisTranslator.to_entity(analysis)
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return VehicleAnalysisTranslator.to_domain(entity)

    def update(self, analysis_id: UUID, fields: dict) -> Optional[VehicleAnalysis]:
        """Actualización parcial: solo actualiza los campos presentes en el dict."""
        entity = self.db.query(VehicleAnalysisEntity).filter(
            VehicleAnalysisEntity.id == analysis_id
        ).first()
        if not entity:
            return None
        for key, value in fields.items():
            if hasattr(entity, key):
                setattr(entity, key, value)
        self.db.commit()
        self.db.refresh(entity)
        return VehicleAnalysisTranslator.to_domain(entity)

    def find_by_id(self, analysis_id: UUID) -> Optional[VehicleAnalysis]:
        entity = self.db.query(VehicleAnalysisEntity).filter(
            VehicleAnalysisEntity.id == analysis_id
        ).first()
        return VehicleAnalysisTranslator.to_domain(entity) if entity else None

    def find_all(
        self,
        brand: Optional[str] = None,
        model: Optional[str] = None,
        fuel_type: Optional[str] = None,
        segment: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[VehicleAnalysis]:
        query = self.db.query(VehicleAnalysisEntity)
        if brand:
            query = query.filter(VehicleAnalysisEntity.brand.ilike(f"%{brand}%"))
        if model:
            query = query.filter(VehicleAnalysisEntity.model.ilike(f"%{model}%"))
        if fuel_type:
            query = query.filter(VehicleAnalysisEntity.fuel_type == fuel_type)
        if segment:
            query = query.filter(VehicleAnalysisEntity.segment.ilike(f"%{segment}%"))
        entities = query.order_by(
            VehicleAnalysisEntity.created_at.desc()
        ).offset(skip).limit(limit).all()
        return [VehicleAnalysisTranslator.to_domain(e) for e in entities]

    def delete(self, analysis_id: UUID) -> bool:
        entity = self.db.query(VehicleAnalysisEntity).filter(
            VehicleAnalysisEntity.id == analysis_id
        ).first()
        if not entity:
            return False
        self.db.delete(entity)
        self.db.commit()
        return True
