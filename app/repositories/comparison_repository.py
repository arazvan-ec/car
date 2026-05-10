from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.domain.models import Comparison
from app.db.entities import ComparisonEntity
from app.db.translators import ComparisonTranslator


class ComparisonRepository:

    def __init__(self, db: Session):
        self.db = db

    def save(self, comparison: Comparison) -> Comparison:
        entity = ComparisonTranslator.to_entity(comparison)
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return ComparisonTranslator.to_domain(entity)

    def find_by_id(self, comparison_id: UUID) -> Optional[Comparison]:
        entity = self.db.query(ComparisonEntity).filter(
            ComparisonEntity.id == comparison_id
        ).first()
        return ComparisonTranslator.to_domain(entity) if entity else None

    def find_all(self, skip: int = 0, limit: int = 50) -> list[Comparison]:
        entities = self.db.query(ComparisonEntity).order_by(
            ComparisonEntity.created_at.desc()
        ).offset(skip).limit(limit).all()
        return [ComparisonTranslator.to_domain(e) for e in entities]
