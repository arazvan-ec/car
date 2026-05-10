"""
Entidades ORM (SQLAlchemy). Separadas del dominio para permitir evolución
independiente del modelo de negocio y del esquema de base de datos.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Float, Integer,
    String, Text, JSON, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class VehicleAnalysisEntity(Base):
    __tablename__ = "vehicle_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Identificación del vehículo
    brand = Column(String(100), nullable=False, index=True)
    model = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    trim = Column(String(200), nullable=False)

    # Motorización y dinámica
    engine = Column(String(200), nullable=False)
    drivetrain = Column(String(20), nullable=False)   # AWD / FWD / 4WD
    fuel_type = Column(String(20), nullable=False)    # FHEV / PHEV / BEV / MHEV
    horsepower = Column(Integer, nullable=False)
    wheel_size_inches = Column(Integer, nullable=True)
    headlights_type = Column(String(100), nullable=True)

    # Eficiencia
    wltp_consumption = Column(Float, nullable=True)
    real_consumption = Column(Float, nullable=True)
    dgt_label = Column(String(10), nullable=True)     # ECO / CERO / C / B

    # Precio
    list_price_eur = Column(Float, nullable=False)

    # Seguridad pasiva (Euro NCAP)
    euro_ncap_stars = Column(Integer, nullable=True)
    euro_ncap_adult_pct = Column(Integer, nullable=True)

    # Valoración de prensa
    press_rating = Column(Float, nullable=True)
    press_sources = Column(JSON, nullable=True)       # ["km77", "Motor1", ...]

    # Análisis cualitativo
    pros = Column(JSON, nullable=True)                # ["...", "..."]
    cons = Column(JSON, nullable=True)
    reliability_notes = Column(Text, nullable=True)
    has_daily_charging = Column(Boolean, nullable=True)
    raw_notes = Column(Text, nullable=True)

    # Relaciones
    comparisons_as_a = relationship(
        "ComparisonEntity",
        foreign_keys="ComparisonEntity.analysis_a_id",
        back_populates="analysis_a",
    )
    comparisons_as_b = relationship(
        "ComparisonEntity",
        foreign_keys="ComparisonEntity.analysis_b_id",
        back_populates="analysis_b",
    )


class ComparisonEntity(Base):
    __tablename__ = "comparisons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    analysis_a_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vehicle_analyses.id", ondelete="CASCADE"),
        nullable=False,
    )
    analysis_b_id = Column(
        UUID(as_uuid=True),
        ForeignKey("vehicle_analyses.id", ondelete="CASCADE"),
        nullable=False,
    )

    verdict = Column(Text, nullable=False)
    winner_brand = Column(String(100), nullable=False)
    winner_model = Column(String(100), nullable=False)
    criteria_winners = Column(JSON, nullable=True)    # {"tracción": "Ford", ...}
    raw_notes = Column(Text, nullable=True)

    analysis_a = relationship(
        "VehicleAnalysisEntity",
        foreign_keys=[analysis_a_id],
        back_populates="comparisons_as_a",
    )
    analysis_b = relationship(
        "VehicleAnalysisEntity",
        foreign_keys=[analysis_b_id],
        back_populates="comparisons_as_b",
    )
