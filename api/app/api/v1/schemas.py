"""Schemas Pydantic — modelo enriquecido Car Analytics."""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class VehicleAnalysisCreate(BaseModel):
    brand: str; model: str; year: int; trim: str
    body_type: Optional[str] = None
    segment: Optional[str] = None
    country_of_manufacture: Optional[str] = None
    engine: str; drivetrain: str; fuel_type: str; horsepower: int
    torque_nm: Optional[int] = None
    acceleration_0_100: Optional[float] = None
    top_speed_kmh: Optional[int] = None
    electric_range_km: Optional[int] = None
    gearbox: Optional[str] = None
    wheel_size_inches: Optional[int] = None
    headlights_type: Optional[str] = None
    adas_features: list[str] = Field(default_factory=list)
    wltp_consumption: Optional[float] = None
    real_consumption: Optional[float] = None
    real_consumption_source: Optional[str] = None
    co2_gkm: Optional[int] = None
    dgt_label: str
    boot_liters: Optional[int] = None
    length_mm: Optional[int] = None
    width_mm: Optional[int] = None
    height_mm: Optional[int] = None
    wheelbase_mm: Optional[int] = None
    seats: Optional[int] = None
    list_price_eur: float
    typical_discount_pct: Optional[float] = None
    estimated_street_price_eur: Optional[float] = None
    renting_monthly_eur: Optional[float] = None
    maintenance_cost_annual_eur: Optional[float] = None
    main_competitors: list[str] = Field(default_factory=list)
    price_vs_competitors: Optional[str] = None
    competitive_advantage: Optional[str] = None
    competitive_disadvantage: Optional[str] = None
    euro_ncap_stars: Optional[int] = None
    euro_ncap_year: Optional[int] = None
    euro_ncap_adult_pct: Optional[int] = None
    euro_ncap_child_pct: Optional[int] = None
    euro_ncap_pedestrian_pct: Optional[int] = None
    euro_ncap_safety_assist_pct: Optional[int] = None
    press_rating: Optional[float] = None
    press_sources: list[str] = Field(default_factory=list)
    press_summary: Optional[str] = None
    owner_rating: Optional[float] = None
    owner_rating_source: Optional[str] = None
    owner_sample_size: Optional[int] = None
    common_complaints: list[str] = Field(default_factory=list)
    reliability_notes: Optional[str] = None
    known_issues: list[str] = Field(default_factory=list)
    warranty_years: Optional[int] = None
    extended_warranty_available: Optional[bool] = None
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    recommended_for: list[str] = Field(default_factory=list)
    not_recommended_for: list[str] = Field(default_factory=list)
    ideal_use_case: Optional[str] = None
    has_daily_charging: Optional[bool] = None
    skill_version: Optional[str] = None
    analyst_notes: Optional[str] = None
    raw_notes: Optional[str] = None


class VehicleAnalysisResponse(VehicleAnalysisCreate):
    id: UUID
    created_at: datetime
    model_config = {"from_attributes": True}


class ComparisonCreate(BaseModel):
    analysis_a_id: UUID
    analysis_b_id: UUID
    verdict: str
    winner_brand: str
    winner_model: str
    criteria_winners: dict = Field(default_factory=dict)
    summary: Optional[str] = None
    raw_notes: Optional[str] = None


class ComparisonResponse(ComparisonCreate):
    id: UUID
    created_at: datetime
    model_config = {"from_attributes": True}


class AnalysisStats(BaseModel):
    total_analyses: int
    total_comparisons: int
    top_brands: list[dict]
    top_fuel_types: list[dict]
    top_segments: list[dict]
    avg_price_eur: Optional[float]
    avg_press_rating: Optional[float]
    avg_owner_rating: Optional[float]
    avg_euro_ncap_stars: Optional[float]
