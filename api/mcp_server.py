"""
Car Analytics MCP Server
========================
Expone las operaciones del patrón Pipeline como herramientas MCP para que un
agente IA pueda crear y actualizar análisis y comparativas de vehículos.

Transporte: Streamable HTTP (montado en /mcp en la FastAPI principal).
Auth:       X-API-Key (misma clave que la REST API; gestionada por FastAPI,
            no por este módulo).
"""

import json
from typing import Optional
from uuid import UUID

from mcp.server.fastmcp import FastMCP
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db import pipeline_entities  # noqa: F401 — registrar modelos en Base.metadata
from app.db.pipeline_entities import PipelineRunEntity, PipelineStepEntity
from app.domain.pipeline import RunStatus, StepStatus
from app.repositories.pipeline_repository import PipelineRepository


mcp = FastMCP(
    name="Car Analytics",
    instructions=(
        "Herramientas para orquestar análisis de vehículos como pipelines. "
        "Flujo típico: crea un pipeline con create_analysis_pipeline, añade "
        "fuentes a cada paso con add_source, marca el paso completed con "
        "complete_step y consulta el estado con get_pipeline. Cada análisis "
        "tiene los 8 step_types definidos en el skill car-configurator-preferences."
    ),
)


def _get_db() -> Session:
    return SessionLocal()


def _run_summary(run) -> dict:
    return {
        "id": str(run.id),
        "pipeline_type": run.pipeline_type,
        "subject_type": run.subject_type,
        "subject_data": run.subject_data,
        "status": run.status.value if hasattr(run.status, "value") else run.status,
        "skill_version": run.skill_version,
        "created_at": run.created_at.isoformat() if run.created_at else None,
        "steps": [
            {
                "step_type": s.step_type,
                "status": s.status.value if hasattr(s.status, "value") else s.status,
                "sources_count": len(s.data_sources) if s.data_sources else 0,
            }
            for s in (run.steps or [])
        ],
    }


# ── Herramientas MCP ──────────────────────────────────────────────────────────


@mcp.tool()
def create_analysis_pipeline(
    brand: str,
    model: str,
    year: int,
    trim: Optional[str] = None,
    fuel_type: Optional[str] = None,
    drivetrain: Optional[str] = None,
    skill_version: Optional[str] = "car-configurator-preferences v2.0",
    notes: Optional[str] = None,
) -> str:
    """
    Crea un PipelineRun de tipo vehicle_analysis con los 8 step_types inicializados
    en pending. Si ya existía un run con el mismo subject (brand+model+year+trim),
    lo devuelve sin duplicar.

    - brand, model, year: obligatorios
    - trim, fuel_type, drivetrain: opcionales pero recomendados
    - Devuelve el run_id que se usará en add_source y complete_step
    """
    db = _get_db()
    try:
        repo = PipelineRepository(db)
        subject_data = {"brand": brand, "model": model, "year": year}
        if trim: subject_data["trim"] = trim
        if fuel_type: subject_data["fuel_type"] = fuel_type
        if drivetrain: subject_data["drivetrain"] = drivetrain
        run = repo.create_run(
            pipeline_type="vehicle_analysis",
            subject_type="vehicle",
            subject_data=subject_data,
            skill_version=skill_version,
            notes=notes,
        )
        return json.dumps({"success": True, "run_id": str(run.id), "summary": _run_summary(run)})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def create_comparison_pipeline(
    subjects: str,
    step_types: str,
    skill_version: Optional[str] = "car-configurator-preferences v2.0",
    notes: Optional[str] = None,
) -> str:
    """
    Crea un PipelineRun de tipo vehicle_comparison con step_types custom.

    - subjects: JSON string. Ejemplo:
        '{"subject_a":{"brand":"Ford","model":"Focus"},
          "subjects_b":[{"brand":"Toyota","model":"Corolla"}]}'
    - step_types: lista de step types separados por coma (uno por rival + "comparison_verdict").
        Ejemplo: "toyota_corolla,vw_golf,honda_civic,comparison_verdict"
    """
    db = _get_db()
    try:
        try:
            subject_data = json.loads(subjects)
        except Exception as e:
            return json.dumps({"success": False, "error": f"subjects no es JSON válido: {e}"})
        types = [s.strip() for s in step_types.split(",") if s.strip()]
        if not types:
            return json.dumps({"success": False, "error": "step_types vacío"})

        repo = PipelineRepository(db)
        run = repo.create_run(
            pipeline_type="vehicle_comparison",
            subject_type="comparison",
            subject_data=subject_data,
            skill_version=skill_version,
            notes=notes,
            step_types=types,
        )
        return json.dumps({"success": True, "run_id": str(run.id), "summary": _run_summary(run)})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def add_source(
    run_id: str,
    step_type: str,
    source_name: str,
    source_url: str,
    raw_content: Optional[str] = None,
    structured_data: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """
    Añade una DataSource con su CacheEntry a un step. Si la fuente ya existía
    para ese step, crea una nueva versión y marca la anterior is_current=false.

    - run_id, step_type: identifican el step destino
    - source_name: nombre corto (km77, CarWow, euroncap, ...)
    - source_url: URL real consultada
    - raw_content: texto literal devuelto por la fuente (recomendado)
    - structured_data: JSON string con los datos extraídos
    - notes: nota libre (ej. "Fetch real verificado 2026-05-14")
    """
    db = _get_db()
    try:
        sd: Optional[dict] = None
        if structured_data:
            try:
                sd = json.loads(structured_data)
            except Exception as e:
                return json.dumps({"success": False, "error": f"structured_data no es JSON válido: {e}"})

        repo = PipelineRepository(db)
        source, cache = repo.add_source_with_cache(
            run_id=UUID(run_id),
            step_type=step_type,
            source_name=source_name,
            source_url=source_url,
            raw_content=raw_content,
            structured_data=sd,
            notes=notes,
        )
        return json.dumps({
            "success": True,
            "source_id": str(source.id),
            "version": cache.version,
            "is_current": cache.is_current,
        })
    except ValueError as e:
        return json.dumps({"success": False, "error": str(e)})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def complete_step(
    run_id: str,
    step_type: str,
    structured_result: Optional[str] = None,
) -> str:
    """
    Marca un step como completed y guarda su structured_result consolidado.

    - structured_result: JSON string con los datos finales del paso
      (ver schemas por step_type en SKILL.md sección 4)
    """
    db = _get_db()
    try:
        sr: Optional[dict] = None
        if structured_result:
            try:
                sr = json.loads(structured_result)
            except Exception as e:
                return json.dumps({"success": False, "error": f"structured_result no es JSON válido: {e}"})

        repo = PipelineRepository(db)
        step = repo.update_step(
            run_id=UUID(run_id),
            step_type=step_type,
            status=StepStatus.COMPLETED,
            structured_result=sr,
        )
        if not step:
            return json.dumps({"success": False, "error": f"Step '{step_type}' no encontrado"})
        return json.dumps({"success": True, "step_type": step.step_type, "status": step.status.value if hasattr(step.status, "value") else step.status})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def fail_step(run_id: str, step_type: str, error_message: str) -> str:
    """
    Marca un step como failed con un mensaje de error. Útil cuando una fuente
    externa no es accesible y no se puede generar structured_result fiable.
    """
    db = _get_db()
    try:
        repo = PipelineRepository(db)
        step = repo.update_step(
            run_id=UUID(run_id),
            step_type=step_type,
            status=StepStatus.FAILED,
            error_message=error_message,
        )
        if not step:
            return json.dumps({"success": False, "error": f"Step '{step_type}' no encontrado"})
        return json.dumps({"success": True, "step_type": step.step_type, "status": "failed"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def rerun_step_tool(run_id: str, step_type: str) -> str:
    """
    Marca un step como stale (para volver a ejecutarlo) y propaga el estado
    stale a los steps que dependen de él (definido en STEP_DEPENDENCIES).
    """
    db = _get_db()
    try:
        repo = PipelineRepository(db)
        step = repo.rerun_step(UUID(run_id), step_type)
        if not step:
            return json.dumps({"success": False, "error": f"Step '{step_type}' no encontrado"})
        return json.dumps({"success": True, "step_type": step.step_type, "status": "stale"})
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def list_pipelines(
    pipeline_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
) -> str:
    """
    Lista los pipelines guardados, ordenados por fecha descendente.

    - pipeline_type: filtrar por tipo (vehicle_analysis | vehicle_comparison)
    - status: filtrar por estado (pending | running | completed | failed | stale)
    - limit: máximo de resultados (default 20)
    """
    db = _get_db()
    try:
        repo = PipelineRepository(db)
        runs = repo.list_runs(pipeline_type=pipeline_type, status=status, limit=limit)
        return json.dumps({
            "success": True,
            "count": len(runs),
            "runs": [_run_summary(r) for r in runs],
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def get_pipeline(run_id: str) -> str:
    """
    Devuelve el detalle completo de un pipeline: subject, status, todos los
    steps con sus structured_result, y las sources de cada step.
    """
    db = _get_db()
    try:
        repo = PipelineRepository(db)
        run = repo.get_run(UUID(run_id))
        if not run:
            return json.dumps({"success": False, "error": "Pipeline no encontrado"})

        return json.dumps({
            "success": True,
            "run": {
                "id": str(run.id),
                "pipeline_type": run.pipeline_type,
                "subject_data": run.subject_data,
                "status": run.status.value if hasattr(run.status, "value") else run.status,
                "skill_version": run.skill_version,
                "notes": run.notes,
                "decision": run.decision,
                "created_at": run.created_at.isoformat() if run.created_at else None,
                "updated_at": run.updated_at.isoformat() if run.updated_at else None,
                "steps": [
                    {
                        "step_type": s.step_type,
                        "status": s.status.value if hasattr(s.status, "value") else s.status,
                        "structured_result": s.structured_result,
                        "error_message": s.error_message,
                        "depends_on": s.depends_on,
                        "sources": [
                            {
                                "source_name": src.source_name,
                                "source_url": src.source_url,
                                "fetched_at": src.fetched_at.isoformat() if src.fetched_at else None,
                                "current_version": (src.cache_entries[-1].version if src.cache_entries else None),
                            }
                            for src in (s.data_sources or [])
                        ],
                    }
                    for s in (run.steps or [])
                ],
            },
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})
    finally:
        db.close()


@mcp.tool()
def get_stats() -> str:
    """
    Estadísticas agregadas: totales por pipeline_type, marcas más analizadas
    y tipos de propulsión más frecuentes (extraídos de subject_data JSON).
    """
    db = _get_db()
    try:
        total_runs = db.query(func.count(PipelineRunEntity.id)).scalar() or 0
        total_analyses = (
            db.query(func.count(PipelineRunEntity.id))
            .filter(PipelineRunEntity.pipeline_type == "vehicle_analysis")
            .scalar() or 0
        )
        total_comparisons = (
            db.query(func.count(PipelineRunEntity.id))
            .filter(PipelineRunEntity.pipeline_type == "vehicle_comparison")
            .scalar() or 0
        )
        completed = (
            db.query(func.count(PipelineRunEntity.id))
            .filter(PipelineRunEntity.status == RunStatus.COMPLETED)
            .scalar() or 0
        )

        # Agregación en cliente (subject_data es JSON, mejor enumerar en Python)
        analyses = (
            db.query(PipelineRunEntity.subject_data)
            .filter(PipelineRunEntity.pipeline_type == "vehicle_analysis")
            .all()
        )
        brand_counts: dict[str, int] = {}
        fuel_counts: dict[str, int] = {}
        for (sd,) in analyses:
            if not sd:
                continue
            brand = sd.get("brand")
            if brand:
                brand_counts[brand] = brand_counts.get(brand, 0) + 1
            fuel = sd.get("fuel_type")
            if fuel:
                fuel_counts[fuel] = fuel_counts.get(fuel, 0) + 1

        top_brands = sorted(brand_counts.items(), key=lambda x: -x[1])[:10]
        top_fuels = sorted(fuel_counts.items(), key=lambda x: -x[1])

        steps_completed = (
            db.query(func.count(PipelineStepEntity.id))
            .filter(PipelineStepEntity.status == StepStatus.COMPLETED)
            .scalar() or 0
        )

        return json.dumps({
            "success": True,
            "stats": {
                "total_runs": total_runs,
                "total_analyses": total_analyses,
                "total_comparisons": total_comparisons,
                "completed_runs": completed,
                "completed_steps": steps_completed,
                "top_brands": [{"brand": b, "count": c} for b, c in top_brands],
                "top_fuel_types": [{"fuel_type": f, "count": c} for f, c in top_fuels],
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
