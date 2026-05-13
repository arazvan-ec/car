"""
Traductores entre modelos de dominio y entidades ORM.
Mantienen el dominio independiente de la infraestructura de persistencia.
"""
from app.domain.models import VehicleAnalysis, Comparison
from app.db.entities import VehicleAnalysisEntity, ComparisonEntity


class VehicleAnalysisTranslator:

    @staticmethod
    def to_entity(domain: VehicleAnalysis) -> VehicleAnalysisEntity:
        return VehicleAnalysisEntity(
            id=domain.id,
            created_at=domain.created_at,
            brand=domain.brand,
            model=domain.model,
            year=domain.year,
            trim=domain.trim,
            engine=domain.engine,
            drivetrain=domain.drivetrain,
            fuel_type=domain.fuel_type,
            horsepower=domain.horsepower,
            wheel_size_inches=domain.wheel_size_inches,
            headlights_type=domain.headlights_type,
            wltp_consumption=domain.wltp_consumption,
            real_consumption=domain.real_consumption,
            dgt_label=domain.dgt_label,
            list_price_eur=domain.list_price_eur,
            euro_ncap_stars=domain.euro_ncap_stars,
            euro_ncap_adult_pct=domain.euro_ncap_adult_pct,
            press_rating=domain.press_rating,
            press_sources=domain.press_sources,
            pros=domain.pros,
            cons=domain.cons,
            reliability_notes=domain.reliability_notes,
            has_daily_charging=domain.has_daily_charging,
            raw_notes=domain.raw_notes,
        )

    @staticmethod
    def to_domain(entity: VehicleAnalysisEntity) -> VehicleAnalysis:
        return VehicleAnalysis(
            id=entity.id,
            created_at=entity.created_at,
            brand=entity.brand,
            model=entity.model,
            year=entity.year,
            trim=entity.trim,
            engine=entity.engine,
            drivetrain=entity.drivetrain,
            fuel_type=entity.fuel_type,
            horsepower=entity.horsepower,
            wheel_size_inches=entity.wheel_size_inches,
            headlights_type=entity.headlights_type,
            wltp_consumption=entity.wltp_consumption,
            real_consumption=entity.real_consumption,
            dgt_label=entity.dgt_label,
            list_price_eur=entity.list_price_eur,
            euro_ncap_stars=entity.euro_ncap_stars,
            euro_ncap_adult_pct=entity.euro_ncap_adult_pct,
            press_rating=entity.press_rating,
            press_sources=entity.press_sources or [],
            pros=entity.pros or [],
            cons=entity.cons or [],
            reliability_notes=entity.reliability_notes,
            has_daily_charging=entity.has_daily_charging,
            raw_notes=entity.raw_notes,
        )


class ComparisonTranslator:

    @staticmethod
    def to_entity(domain: Comparison) -> ComparisonEntity:
        return ComparisonEntity(
            id=domain.id,
            created_at=domain.created_at,
            analysis_a_id=domain.analysis_a_id,
            analysis_b_id=domain.analysis_b_id,
            verdict=domain.verdict,
            winner_brand=domain.winner_brand,
            winner_model=domain.winner_model,
            criteria_winners=domain.criteria_winners,
            raw_notes=domain.raw_notes,
        )

    @staticmethod
    def to_domain(entity: ComparisonEntity) -> Comparison:
        return Comparison(
            id=entity.id,
            created_at=entity.created_at,
            analysis_a_id=entity.analysis_a_id,
            analysis_b_id=entity.analysis_b_id,
            verdict=entity.verdict,
            winner_brand=entity.winner_brand,
            winner_model=entity.winner_model,
            criteria_winners=entity.criteria_winners or {},
            raw_notes=entity.raw_notes,
        )
