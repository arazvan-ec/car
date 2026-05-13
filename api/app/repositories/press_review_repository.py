from uuid import UUID
from typing import Optional

from sqlalchemy.orm import Session

from app.domain.models import PressReview
from app.db.entities import PressReviewEntity


class PressReviewRepository:

    def __init__(self, db: Session):
        self.db = db

    def save(self, review: PressReview) -> PressReview:
        entity = PressReviewEntity(
            id=review.id,
            created_at=review.created_at,
            analysis_id=review.analysis_id,
            source=review.source,
            url=review.url,
            rating=review.rating,
            title=review.title,
            author=review.author,
            published_date=review.published_date,
            summary=review.summary,
            full_text=review.full_text,
            pros=review.pros or [],
            cons=review.cons or [],
            verdict=review.verdict,
        )
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return self._to_domain(entity)

    def find_by_analysis(self, analysis_id: UUID) -> list[PressReview]:
        entities = (
            self.db.query(PressReviewEntity)
            .filter(PressReviewEntity.analysis_id == analysis_id)
            .order_by(PressReviewEntity.created_at.desc())
            .all()
        )
        return [self._to_domain(e) for e in entities]

    def find_by_id(self, review_id: UUID) -> Optional[PressReview]:
        entity = self.db.query(PressReviewEntity).filter(
            PressReviewEntity.id == review_id
        ).first()
        return self._to_domain(entity) if entity else None

    def delete(self, review_id: UUID) -> bool:
        entity = self.db.query(PressReviewEntity).filter(
            PressReviewEntity.id == review_id
        ).first()
        if not entity:
            return False
        self.db.delete(entity)
        self.db.commit()
        return True

    @staticmethod
    def _to_domain(e: PressReviewEntity) -> PressReview:
        return PressReview(
            id=e.id,
            created_at=e.created_at,
            analysis_id=e.analysis_id,
            source=e.source,
            url=e.url,
            rating=e.rating,
            title=e.title,
            author=e.author,
            published_date=e.published_date,
            summary=e.summary,
            full_text=e.full_text,
            pros=e.pros or [],
            cons=e.cons or [],
            verdict=e.verdict,
        )
