"""Entidades ORM (SQLAlchemy) — modelo enriquecido Car Analytics."""
import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class VehicleAnalysisEntity(Base):
    __tablename__ = "vehicle_analyses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # Identificación
    brand = Column(String(100), nullable=False, index=True)
    model = Column(String(100), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    trim = Column(String(200), nullable=False)
    body_type = Column(String(50), nullable=True)
    segment = Column(String(100), nullable=True)
    country_of_manufacture = Column(String(100), nullable=True)
    # Motorización
    engine = Column(String(200), nullable=False)
    drivetrain = Column(String(20), nullable=False)
    fuel_type = Column(String(20), nullable=False)
    horsepower = Column(Integer, nullable=False)
    torque_nm = Column(Integer, nullable=True)
    acceleration_0_100 = Column(Float, nullable=True)
    top_speed_kmh = Column(Integer, nullable=True)
    electric_range_km = Column(Integer, nullable=True)
    gearbox = Column(String(100), nullable=True)
    # Seguridad activa
    wheel_size_inches = Column(Integer, nullable=True)
    headlights_type = Column(String(100), nullable=True)
    adas_features = Column(JSON, nullable=True)
    # Eficiencia
    wltp_consumption = Column(Float, nullable=True)
    real_consumption = Column(Float, nullable=True)
    real_consumption_source = Column(String(100), nullable=True)
    co2_gkm = Column(Integer, nullable=True)
    dgt_label = Column(String(10), nullable=True)
    # Dimensiones
    boot_liters = Column(Integer, nullable=True)
    length_mm = Column(Integer, nullable=True)
    width_mm = Column(Integer, nullable=True)
    height_mm = Column(Integer, nullable=True)
    wheelbase_mm = Column(Integer, nullable=True)
    seats = Column(Integer, nullable=True)
    # Precio
    list_price_eur = Column(Float, nullable=False)
    typical_discount_pct = Column(Float, nullable=True)
    estimated_street_price_eur = Column(Float, nullable=True)
    renting_monthly_eur = Column(Float, nullable=True)
    maintenance_cost_annual_eur = Column(Float, nullable=True)
    # Competencia
    main_competitors = Column(JSON, nullable=True)
    price_vs_competitors = Column(String(30), nullable=True)
    competitive_advantage = Column(Text, nullable=True)
    competitive_disadvantage = Column(Text, nullable=True)
    # Euro NCAP
    euro_ncap_stars = Column(Integer, nullable=True)
    euro_ncap_year = Column(Integer, nullable=True)
    euro_ncap_adult_pct = Column(Integer, nullable=True)
    euro_ncap_child_pct = Column(Integer, nullable=True)
    euro_ncap_pedestrian_pct = Column(Integer, nullable=True)
    euro_ncap_safety_assist_pct = Column(Integer, nullable=True)
    # Prensa
    press_rating = Column(Float, nullable=True)
    press_sources = Column(JSON, nullable=True)
    press_summary = Column(Text, nullable=True)
    # Propietarios
    owner_rating = Column(Float, nullable=True)
    owner_rating_source = Column(String(200), nullable=True)
    owner_sample_size = Column(Integer, nullable=True)
    common_complaints = Column(JSON, nullable=True)
    # Fiabilidad
    reliability_notes = Column(Text, nullable=True)
    known_issues = Column(JSON, nullable=True)
    warranty_years = Column(Integer, nullable=True)
    extended_warranty_available = Column(Boolean, nullable=True)
    # Análisis cualitativo
    pros = Column(JSON, nullable=True)
    cons = Column(JSON, nullable=True)
    recommended_for = Column(JSON, nullable=True)
    not_recommended_for = Column(JSON, nullable=True)
    ideal_use_case = Column(Text, nullable=True)
    # Contexto
    has_daily_charging = Column(Boolean, nullable=True)
    skill_version = Column(String(100), nullable=True)
    analyst_notes = Column(Text, nullable=True)
    raw_notes = Column(Text, nullable=True)
    # Relaciones
    comparisons_as_a = relationship("ComparisonEntity", foreign_keys="ComparisonEntity.analysis_a_id", back_populates="analysis_a")
    comparisons_as_b = relationship("ComparisonEntity", foreign_keys="ComparisonEntity.analysis_b_id", back_populates="analysis_b")


class ComparisonEntity(Base):
    __tablename__ = "comparisons"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    analysis_a_id = Column(UUID(as_uuid=True), ForeignKey("vehicle_analyses.id", ondelete="CASCADE"), nullable=False)
    analysis_b_id = Column(UUID(as_uuid=True), ForeignKey("vehicle_analyses.id", ondelete="CASCADE"), nullable=False)
    verdict = Column(Text, nullable=False)
    winner_brand = Column(String(100), nullable=False)
    winner_model = Column(String(100), nullable=False)
    criteria_winners = Column(JSON, nullable=True)
    summary = Column(Text, nullable=True)
    raw_notes = Column(Text, nullable=True)
    analysis_a = relationship("VehicleAnalysisEntity", foreign_keys=[analysis_a_id], back_populates="comparisons_as_a")
    analysis_b = relationship("VehicleAnalysisEntity", foreign_keys=[analysis_b_id], back_populates="comparisons_as_b")
