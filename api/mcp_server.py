"""
Car Analytics MCP Server
========================
Servidor MCP que expone las herramientas de persistencia de la Car Analytics API
para que Manus pueda interactuar con la base de datos de forma nativa.

Transporte: Streamable HTTP (compatible con Manus Custom MCP)
Endpoint:   /mcp  (montado en la app FastAPI principal)
Auth:       X-API-Key header (misma clave que la REST API)
"""

import os
import json
from typing import Optional
from uuid import UUID

from mcp.server.fastmcp import FastMCP
from sqlalchemy.orm import Session

# Importar la infraestructura ya construida
from app.db.session import SessionLocal, engine, Base
from app.db import entities  # noqa: F401 — registrar modelos
from app.domain.models import VehicleAnalysis, Comparison
from app.repositories.vehicle_analysis_repository import VehicleAnalysisRepository
from app.repositories.comparison_repository import ComparisonRepository
from app.db.entities import VehicleAnalysisEntity, ComparisonEntity
from sqlalchemy import func

# ── Inicializar FastMCP ───────────────────────────────────────────────────────

mcp = FastMCP(
    name="Car Analytics",
    instructions=(
        "Herramientas de persistencia para análisis de vehículos generados con el "
        "skill car-configurator-preferences. Usa save_analysis después de cada análisis "
        "y save_comparison después de cada comparativa. Usa get_stats para obtener "
        "métricas de negocio y list_analyses para consultar análisis previos."
    ),
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_db() -> Session:
    return SessionLocal()


# ── Herramientas MCP ──────────────────────────────────────────────────────────

@mcp.tool()
def save_analysis(
    brand: str,
    model: str,
    year: int,
    trim: str,
    engine_desc: str,
    drivetrain: str,
    fuel_type: str,
    horsepower: int,
    list_price_eur: float,
    dgt_label: str,
    wheel_size_inches: Optional[int] = None,
    headlights_type: Optional[str] = None,
    wltp_consumption: Optional[float] = None,
    real_consumption: Optional[float] = None,
    euro_ncap_stars: Optional[int] = None,
    euro_ncap_adult_pct: Optional[int] = None,
    press_rating: Optional[float] = None,
    press_sources: Optional[str] = None,
    pros: Optional[str] = None,
    cons: Optional[str] = None,
    reliability_notes: Optional[str] = None,
    has_daily_charging: Optional[bool] = None,
    raw_notes: Optional[str] = None,
) -> str:
    """
    Guarda un análisis de vehículo en la base de datos.
    Llamar siempre al finalizar un análisis con el skill car-configurator-preferences.

    - press_sources, pros, cons: listas separadas por comas (ej. "km77,Motor1")
    - engine_desc: descripción completa de la motorización (ej. "2.5 FHEV 183 CV AWD")
    - dgt_label: etiqueta DGT (ECO, CERO, C, B)
    - drivetrain: AWD, FWD, 4WD
    - fuel_type: FHEV, PHEV, BEV, MHEV, Gasolina, Diésel
    """
    db = _get_db()
    try:
        repo = VehicleAnalysisRepository(db)
        analysis = VehicleAnalysis(
            brand=brand,
            model=model,
            year=year,
            trim=trim,
            engine=engine_desc,
            drivetrain=drivetrain,
            fuel_type=fuel_type,
            horsepower=horsepower,
            list_price_eur=list_price_eur,
            dgt_label=dgt_label,
            wheel_size_inches=wheel_size_inches,
            headlights_type=headlights_type,
            wltp_consumption=wltp_consumption,
            real_consumption=real_consumption,
            euro_ncap_stars=euro_ncap_stars,
            euro_ncap_adult_pct=euro_ncap_adult_pct,
            press_rating=press_rating,
            press_sources=[s.strip() for s in press_sources.split(",")] if press_sources else [],
            pros=[p.strip() for p in pros.split(",")] if pros else [],
            cons=[c.strip() for c in cons.split(",")] if cons else [],
            reliability_notes=reliability_notes,
            has_daily_charging=has_daily_charging,
            raw_notes=raw_notes,
        )
        saved = repo.save(analysis)
        return json.dumps({
            "success": True,
            "id": str(saved.id),
            "message": f"Análisis de {brand} {model} {year} guardado correctamente.",
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def save_comparison(
    analysis_a_id: str,
    analysis_b_id: str,
    verdict: str,
    winner_brand: str,
    winner_model: str,
    criteria_winners: str,
    raw_notes: Optional[str] = None,
) -> str:
    """
    Guarda una comparativa entre dos análisis de vehículos.
    Llamar siempre al finalizar una comparativa con el skill car-configurator-preferences.
    Requiere que ambos análisis hayan sido guardados previamente con save_analysis.

    - analysis_a_id / analysis_b_id: UUIDs devueltos por save_analysis
    - criteria_winners: JSON string con el ganador por criterio
      Ejemplo: '{"Tracción": "Ford", "Precio": "Ford", "Potencia": "Volkswagen"}'
    """
    db = _get_db()
    try:
        repo = ComparisonRepository(db)
        try:
            criteria = json.loads(criteria_winners)
        except Exception:
            criteria = {}

        comparison = Comparison(
            analysis_a_id=UUID(analysis_a_id),
            analysis_b_id=UUID(analysis_b_id),
            verdict=verdict,
            winner_brand=winner_brand,
            winner_model=winner_model,
            criteria_winners=criteria,
            raw_notes=raw_notes,
        )
        saved = repo.save(comparison)
        return json.dumps({
            "success": True,
            "id": str(saved.id),
            "message": f"Comparativa guardada. Ganador: {winner_brand} {winner_model}.",
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def list_analyses(
    brand: Optional[str] = None,
    model: Optional[str] = None,
    fuel_type: Optional[str] = None,
    limit: int = 20,
) -> str:
    """
    Lista los análisis de vehículos guardados, con filtros opcionales.
    Útil para consultar si un modelo ya ha sido analizado antes de hacer uno nuevo.

    - brand: filtrar por marca (parcial, insensible a mayúsculas)
    - model: filtrar por modelo (parcial)
    - fuel_type: filtrar por tipo de propulsión (FHEV, PHEV, BEV, MHEV)
    - limit: número máximo de resultados (por defecto 20)
    """
    db = _get_db()
    try:
        repo = VehicleAnalysisRepository(db)
        results = repo.find_all(brand=brand, model=model, fuel_type=fuel_type, limit=limit)
        items = [
            {
                "id": str(r.id),
                "brand": r.brand,
                "model": r.model,
                "year": r.year,
                "trim": r.trim,
                "engine": r.engine,
                "fuel_type": r.fuel_type,
                "horsepower": r.horsepower,
                "list_price_eur": r.list_price_eur,
                "press_rating": r.press_rating,
                "euro_ncap_stars": r.euro_ncap_stars,
                "created_at": r.created_at.isoformat(),
            }
            for r in results
        ]
        return json.dumps({"success": True, "count": len(items), "analyses": items})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def get_analysis(analysis_id: str) -> str:
    """
    Obtiene el detalle completo de un análisis por su ID.
    Útil para recuperar los datos de un análisis previo antes de una comparativa.
    """
    db = _get_db()
    try:
        repo = VehicleAnalysisRepository(db)
        result = repo.find_by_id(UUID(analysis_id))
        if not result:
            return json.dumps({"success": False, "error": "Análisis no encontrado."})
        return json.dumps({
            "success": True,
            "analysis": {
                "id": str(result.id),
                "brand": result.brand,
                "model": result.model,
                "year": result.year,
                "trim": result.trim,
                "engine": result.engine,
                "drivetrain": result.drivetrain,
                "fuel_type": result.fuel_type,
                "horsepower": result.horsepower,
                "wheel_size_inches": result.wheel_size_inches,
                "headlights_type": result.headlights_type,
                "wltp_consumption": result.wltp_consumption,
                "real_consumption": result.real_consumption,
                "dgt_label": result.dgt_label,
                "list_price_eur": result.list_price_eur,
                "euro_ncap_stars": result.euro_ncap_stars,
                "euro_ncap_adult_pct": result.euro_ncap_adult_pct,
                "press_rating": result.press_rating,
                "press_sources": result.press_sources,
                "pros": result.pros,
                "cons": result.cons,
                "reliability_notes": result.reliability_notes,
                "has_daily_charging": result.has_daily_charging,
                "raw_notes": result.raw_notes,
                "created_at": result.created_at.isoformat(),
            },
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def get_stats() -> str:
    """
    Devuelve estadísticas de negocio agregadas sobre todos los análisis guardados.
    Incluye: total de análisis, comparativas, marcas más analizadas, tipos de
    propulsión más frecuentes, precio medio y valoración media de prensa.
    Útil para obtener una visión general del uso del skill.
    """
    db = _get_db()
    try:
        total_analyses = db.query(func.count(VehicleAnalysisEntity.id)).scalar() or 0
        total_comparisons = db.query(func.count(ComparisonEntity.id)).scalar() or 0

        top_brands = (
            db.query(VehicleAnalysisEntity.brand, func.count().label("count"))
            .group_by(VehicleAnalysisEntity.brand)
            .order_by(func.count().desc())
            .limit(10)
            .all()
        )
        top_fuel_types = (
            db.query(VehicleAnalysisEntity.fuel_type, func.count().label("count"))
            .group_by(VehicleAnalysisEntity.fuel_type)
            .order_by(func.count().desc())
            .all()
        )
        avg_price = db.query(func.avg(VehicleAnalysisEntity.list_price_eur)).scalar()
        avg_rating = db.query(func.avg(VehicleAnalysisEntity.press_rating)).scalar()

        return json.dumps({
            "success": True,
            "stats": {
                "total_analyses": total_analyses,
                "total_comparisons": total_comparisons,
                "top_brands": [{"brand": b, "count": c} for b, c in top_brands],
                "top_fuel_types": [{"fuel_type": f, "count": c} for f, c in top_fuel_types],
                "avg_price_eur": round(avg_price, 2) if avg_price else None,
                "avg_press_rating": round(avg_rating, 2) if avg_rating else None,
            },
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


# ── Exportar la app Starlette para montarla en FastAPI ────────────────────────

def get_mcp_app():
    """Devuelve la app Starlette del servidor MCP con transporte HTTP streamable."""
    return mcp.streamable_http_app()
