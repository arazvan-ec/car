"""Traductores Domain↔Entity — modelo enriquecido Car Analytics."""
from app.domain.models import VehicleAnalysis, Comparison
from app.db.entities import VehicleAnalysisEntity, ComparisonEntity

_LIST_FIELDS = {
    "adas_features","press_sources","main_competitors","common_complaints",
    "known_issues","pros","cons","recommended_for","not_recommended_for",
}

_ALL_FIELDS = [
    "brand","model","year","trim","body_type","segment","country_of_manufacture",
    "engine","drivetrain","fuel_type","horsepower","torque_nm","acceleration_0_100",
    "top_speed_kmh","electric_range_km","gearbox",
    "wheel_size_inches","headlights_type","adas_features",
    "wltp_consumption","real_consumption","real_consumption_source","co2_gkm","dgt_label",
    "boot_liters","length_mm","width_mm","height_mm","wheelbase_mm","seats",
    "list_price_eur","typical_discount_pct","estimated_street_price_eur",
    "renting_monthly_eur","maintenance_cost_annual_eur",
    "main_competitors","price_vs_competitors","competitive_advantage","competitive_disadvantage",
    "euro_ncap_stars","euro_ncap_year","euro_ncap_adult_pct","euro_ncap_child_pct",
    "euro_ncap_pedestrian_pct","euro_ncap_safety_assist_pct",
    "press_rating","press_sources","press_summary",
    "owner_rating","owner_rating_source","owner_sample_size","common_complaints",
    "reliability_notes","known_issues","warranty_years","extended_warranty_available",
    "pros","cons","recommended_for","not_recommended_for","ideal_use_case",
    "has_daily_charging","skill_version","analyst_notes","raw_notes",
]


class VehicleAnalysisTranslator:
    @staticmethod
    def to_entity(d: VehicleAnalysis) -> VehicleAnalysisEntity:
        kwargs = {"id": d.id, "created_at": d.created_at}
        for f in _ALL_FIELDS:
            kwargs[f] = getattr(d, f, None)
        return VehicleAnalysisEntity(**kwargs)

    @staticmethod
    def to_domain(e: VehicleAnalysisEntity) -> VehicleAnalysis:
        kwargs = {"id": e.id, "created_at": e.created_at}
        for f in _ALL_FIELDS:
            val = getattr(e, f, None)
            if f in _LIST_FIELDS:
                val = val or []
            kwargs[f] = val
        return VehicleAnalysis(**kwargs)


class ComparisonTranslator:
    @staticmethod
    def to_entity(d: Comparison) -> ComparisonEntity:
        return ComparisonEntity(
            id=d.id, created_at=d.created_at,
            analysis_a_id=d.analysis_a_id, analysis_b_id=d.analysis_b_id,
            verdict=d.verdict, winner_brand=d.winner_brand, winner_model=d.winner_model,
            criteria_winners=d.criteria_winners, summary=d.summary, raw_notes=d.raw_notes,
        )

    @staticmethod
    def to_domain(e: ComparisonEntity) -> Comparison:
        return Comparison(
            id=e.id, created_at=e.created_at,
            analysis_a_id=e.analysis_a_id, analysis_b_id=e.analysis_b_id,
            verdict=e.verdict, winner_brand=e.winner_brand, winner_model=e.winner_model,
            criteria_winners=e.criteria_winners or {},
            summary=e.summary, raw_notes=e.raw_notes,
        )
