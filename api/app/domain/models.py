"""
Modelos de dominio puros. Car Analytics — modelo enriquecido.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class VehicleAnalysis:
    # Identificación
    brand: str
    model: str
    year: int
    trim: str
    body_type: Optional[str] = None
    segment: Optional[str] = None
    country_of_manufacture: Optional[str] = None
    # Motorización
    engine: str = ""
    drivetrain: str = ""
    fuel_type: str = ""
    horsepower: int = 0
    torque_nm: Optional[int] = None
    acceleration_0_100: Optional[float] = None
    top_speed_kmh: Optional[int] = None
    electric_range_km: Optional[int] = None
    gearbox: Optional[str] = None
    # Seguridad activa
    wheel_size_inches: Optional[int] = None
    headlights_type: Optional[str] = None
    adas_features: list = field(default_factory=list)
    # Eficiencia
    wltp_consumption: Optional[float] = None
    real_consumption: Optional[float] = None
    real_consumption_source: Optional[str] = None
    co2_gkm: Optional[int] = None
    dgt_label: str = ""
    # Dimensiones
    boot_liters: Optional[int] = None
    length_mm: Optional[int] = None
    width_mm: Optional[int] = None
    height_mm: Optional[int] = None
    wheelbase_mm: Optional[int] = None
    seats: Optional[int] = None
    # Precio
    list_price_eur: float = 0.0
    typical_discount_pct: Optional[float] = None
    estimated_street_price_eur: Optional[float] = None
    renting_monthly_eur: Optional[float] = None
    maintenance_cost_annual_eur: Optional[float] = None
    # Competencia
    main_competitors: list = field(default_factory=list)
    price_vs_competitors: Optional[str] = None
    competitive_advantage: Optional[str] = None
    competitive_disadvantage: Optional[str] = None
    # Euro NCAP
    euro_ncap_stars: Optional[int] = None
    euro_ncap_year: Optional[int] = None
    euro_ncap_adult_pct: Optional[int] = None
    euro_ncap_child_pct: Optional[int] = None
    euro_ncap_pedestrian_pct: Optional[int] = None
    euro_ncap_safety_assist_pct: Optional[int] = None
    # Prensa
    press_rating: Optional[float] = None
    press_sources: list = field(default_factory=list)
    press_summary: Optional[str] = None
    # Propietarios
    owner_rating: Optional[float] = None
    owner_rating_source: Optional[str] = None
    owner_sample_size: Optional[int] = None
    common_complaints: list = field(default_factory=list)
    # Fiabilidad
    reliability_notes: Optional[str] = None
    known_issues: list = field(default_factory=list)
    warranty_years: Optional[int] = None
    extended_warranty_available: Optional[bool] = None
    # Análisis cualitativo
    pros: list = field(default_factory=list)
    cons: list = field(default_factory=list)
    recommended_for: list = field(default_factory=list)
    not_recommended_for: list = field(default_factory=list)
    ideal_use_case: Optional[str] = None
    # Contexto
    has_daily_charging: Optional[bool] = None
    skill_version: Optional[str] = None
    analyst_notes: Optional[str] = None
    raw_notes: Optional[str] = None
    # Metadatos
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Comparison:
    analysis_a_id: UUID
    analysis_b_id: UUID
    verdict: str
    winner_brand: str
    winner_model: str
    criteria_winners: dict
    summary: Optional[str] = None
    raw_notes: Optional[str] = None
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
