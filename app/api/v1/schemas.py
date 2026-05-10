from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Vehicle Analysis ──────────────────────────────────────────────────────────

class VehicleAnalysisCreate(BaseModel):
    brand: str = Field(..., examples=["Ford"])
    model: str = Field(..., examples=["Kuga"])
    year: int = Field(..., examples=[2025])
    trim: str = Field(..., examples=["Active X"])
    engine: str = Field(..., examples=["2.5 FHEV 183 CV AWD"])
    drivetrain: str = Field(..., examples=["AWD"])
    fuel_type: str = Field(..., examples=["FHEV"])
    horsepower: int = Field(..., examples=[183])
    wheel_size_inches: Optional[int] = Field(None, examples=[19])
    headlights_type: Optional[str] = Field(None, examples=["LED Matricial"])
    wltp_consumption: Optional[float] = Field(None, examples=[5.7])
    real_consumption: Optional[float] = Field(None, examples=[6.4])
    dgt_label: str = Field(..., examples=["ECO"])
    list_price_eur: float = Field(..., examples=[47886.0])
    euro_ncap_stars: Optional[int] = Field(None, examples=[5])
    euro_ncap_adult_pct: Optional[int] = Field(None, examples=[85])
    press_rating: Optional[float] = Field(None, examples=[8.2])
    press_sources: list[str] = Field(default_factory=list, examples=[["km77", "Motor1"]])
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    reliability_notes: Optional[str] = None
    has_daily_charging: Optional[bool] = None
    raw_notes: Optional[str] = None


class VehicleAnalysisResponse(VehicleAnalysisCreate):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Comparison ────────────────────────────────────────────────────────────────

class ComparisonCreate(BaseModel):
    analysis_a_id: UUID
    analysis_b_id: UUID
    verdict: str
    winner_brand: str
    winner_model: str
    criteria_winners: dict = Field(default_factory=dict)
    raw_notes: Optional[str] = None


class ComparisonResponse(ComparisonCreate):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Stats (para analítica futura) ─────────────────────────────────────────────

class AnalysisStats(BaseModel):
    total_analyses: int
    total_comparisons: int
    top_brands: list[dict]
    top_fuel_types: list[dict]
    avg_price_eur: Optional[float]
    avg_press_rating: Optional[float]
