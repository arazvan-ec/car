"""
Endpoints REST del patrón Pipeline de Enriquecimiento de Datos.

Rutas:
  POST   /pipelines/runs/                                    Crear run
  GET    /pipelines/runs/                                    Listar runs
  GET    /pipelines/runs/{run_id}                            Obtener run completo
  POST   /pipelines/runs/{run_id}/rerun                      Relanzar todo el pipeline
  PATCH  /pipelines/runs/{run_id}/steps/{step_type}          Actualizar estado de un paso
  POST   /pipelines/runs/{run_id}/steps/{step_type}/rerun    Relanzar un paso específico
  POST   /pipelines/runs/{run_id}/steps/{step_type}/sources/ Añadir fuente + caché
  GET    /pipelines/runs/{run_id}/steps/{step_type}/sources/{source}/history  Historial de caché
"""
from uuid import UUID
from typing import Optional, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.security import require_api_key
from app.db.session import get_db
from app.domain.pipeline import StepStatus, RunStatus, VEHICLE_STEP_TYPES
from app.repositories.pipeline_repository import PipelineRepository

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateRunRequest(BaseModel):
    pipeline_type: str = Field(..., examples=["vehicle_analysis"])
    subject_type: str = Field(..., examples=["vehicle"])
    subject_data: dict = Field(..., examples=[{"brand": "Ford", "model": "Kuga", "year": 2025}])
    skill_version: Optional[str] = None
    notes: Optional[str] = None
    step_types: Optional[list[str]] = Field(
        None,
        description="Pasos a crear. Si no se especifica, se usan los del tipo de pipeline."
    )


class UpdateStepRequest(BaseModel):
    status: str
    structured_result: Optional[dict] = None
    error_message: Optional[str] = None


class AddSourceRequest(BaseModel):
    source_name: str = Field(..., examples=["km77"])
    source_url: str = Field(..., examples=["https://www.km77.com/coches/ford/kuga/2024/..."])
    raw_content: Optional[str] = Field(None, description="Texto completo de la fuente guardado")
    structured_data: Optional[dict] = Field(None, description="Datos extraídos en formato JSON")
    notes: Optional[str] = None


class CacheEntryResponse(BaseModel):
    id: UUID
    version: int
    is_current: bool
    structured_data: Optional[dict]
    raw_content: Optional[str]
    notes: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class DataSourceResponse(BaseModel):
    id: UUID
    source_name: str
    source_url: str
    fetched_at: datetime
    current_version: Optional[int]
    total_versions: int
    current_cache: Optional[CacheEntryResponse]
    model_config = {"from_attributes": True}


class StepResponse(BaseModel):
    id: UUID
    step_type: str
    status: str
    structured_result: Optional[dict]
    error_message: Optional[str]
    depends_on: list[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    sources_count: int
    model_config = {"from_attributes": True}


class StepDetailResponse(StepResponse):
    data_sources: list[DataSourceResponse]


class RunSummaryResponse(BaseModel):
    id: UUID
    pipeline_type: str
    subject_type: str
    subject_data: dict
    status: str
    skill_version: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    steps_total: int
    steps_completed: int
    steps_pending: int
    steps_stale: int
    steps_failed: int
    model_config = {"from_attributes": True}


class RunDetailResponse(RunSummaryResponse):
    steps: list[StepDetailResponse]
    decision: Optional[dict]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _source_response(source) -> DataSourceResponse:
    current = source.current_cache
    return DataSourceResponse(
        id=source.id,
        source_name=source.source_name,
        source_url=source.source_url,
        fetched_at=source.fetched_at,
        current_version=current.version if current else None,
        total_versions=len(source.cache_entries),
        current_cache=CacheEntryResponse(
            id=current.id, version=current.version, is_current=current.is_current,
            structured_data=current.structured_data, raw_content=current.raw_content,
            notes=current.notes, created_at=current.created_at,
        ) if current else None,
    )


def _step_response(step, detail=False):
    base = dict(
        id=step.id, step_type=step.step_type, status=step.status,
        structured_result=step.structured_result, error_message=step.error_message,
        depends_on=step.depends_on, started_at=step.started_at,
        completed_at=step.completed_at, created_at=step.created_at,
        sources_count=len(step.data_sources),
    )
    if detail:
        base["data_sources"] = [_source_response(s) for s in step.data_sources]
        return StepDetailResponse(**base)
    return StepResponse(**base)


def _run_summary(run) -> RunSummaryResponse:
    by_status = {s: 0 for s in ["completed", "pending", "stale", "failed"]}
    for step in run.steps:
        by_status[step.status] = by_status.get(step.status, 0) + 1
    return RunSummaryResponse(
        id=run.id, pipeline_type=run.pipeline_type, subject_type=run.subject_type,
        subject_data=run.subject_data, status=run.status,
        skill_version=run.skill_version, notes=run.notes,
        created_at=run.created_at, updated_at=run.updated_at,
        steps_total=len(run.steps),
        steps_completed=by_status["completed"],
        steps_pending=by_status["pending"],
        steps_stale=by_status["stale"],
        steps_failed=by_status["failed"],
    )


def _run_detail(run) -> RunDetailResponse:
    summary = _run_summary(run)
    return RunDetailResponse(
        **summary.model_dump(),
        steps=[_step_response(s, detail=True) for s in run.steps],
        decision=run.decision,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/runs/", status_code=status.HTTP_201_CREATED, response_model=RunDetailResponse,
             summary="Crear un nuevo pipeline run")
def create_run(
    payload: CreateRunRequest,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PipelineRepository(db)
    run = repo.create_run(
        pipeline_type=payload.pipeline_type,
        subject_type=payload.subject_type,
        subject_data=payload.subject_data,
        skill_version=payload.skill_version,
        notes=payload.notes,
        step_types=payload.step_types,
    )
    return _run_detail(run)


@router.get("/runs/", response_model=list[RunSummaryResponse], summary="Listar pipeline runs")
def list_runs(
    pipeline_type: Optional[str] = None,
    subject_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PipelineRepository(db)
    runs = repo.list_runs(pipeline_type=pipeline_type, subject_type=subject_type,
                          status=status_filter, skip=skip, limit=limit)
    return [_run_summary(r) for r in runs]


@router.get("/runs/{run_id}", response_model=RunDetailResponse, summary="Obtener run completo")
def get_run(
    run_id: UUID,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PipelineRepository(db)
    run = repo.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run no encontrado.")
    return _run_detail(run)


@router.post("/runs/{run_id}/rerun", response_model=RunSummaryResponse,
             summary="Relanzar todo el pipeline (marca todos los pasos como stale)")
def rerun_pipeline(
    run_id: UUID,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PipelineRepository(db)
    run = repo.rerun(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run no encontrado.")
    return _run_summary(run)


@router.patch("/runs/{run_id}/steps/{step_type}", response_model=StepDetailResponse,
              summary="Actualizar el estado y resultado de un paso")
def update_step(
    run_id: UUID, step_type: str,
    payload: UpdateStepRequest,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PipelineRepository(db)
    try:
        step = repo.update_step(
            run_id=run_id, step_type=step_type,
            status=StepStatus(payload.status),
            structured_result=payload.structured_result,
            error_message=payload.error_message,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not step:
        raise HTTPException(status_code=404, detail=f"Paso '{step_type}' no encontrado.")
    return _step_response(step, detail=True)


@router.post("/runs/{run_id}/steps/{step_type}/rerun", response_model=StepDetailResponse,
             summary="Relanzar un paso específico (marca como stale y propaga dependientes)")
def rerun_step(
    run_id: UUID, step_type: str,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PipelineRepository(db)
    step = repo.rerun_step(run_id, step_type)
    if not step:
        raise HTTPException(status_code=404, detail=f"Paso '{step_type}' no encontrado.")
    return _step_response(step, detail=True)


@router.post("/runs/{run_id}/steps/{step_type}/sources/",
             status_code=status.HTTP_201_CREATED,
             summary="Añadir fuente de datos con entrada de caché")
def add_source(
    run_id: UUID, step_type: str,
    payload: AddSourceRequest,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PipelineRepository(db)
    try:
        source, cache = repo.add_source_with_cache(
            run_id=run_id, step_type=step_type,
            source_name=payload.source_name,
            source_url=payload.source_url,
            raw_content=payload.raw_content,
            structured_data=payload.structured_data,
            notes=payload.notes,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {
        "source": _source_response(source),
        "cache_entry": CacheEntryResponse(
            id=cache.id, version=cache.version, is_current=cache.is_current,
            structured_data=cache.structured_data, raw_content=cache.raw_content,
            notes=cache.notes, created_at=cache.created_at,
        ),
    }


@router.get("/runs/{run_id}/steps/{step_type}/sources/{source_name}/history",
            response_model=list[CacheEntryResponse],
            summary="Historial completo de versiones de caché de una fuente")
def get_cache_history(
    run_id: UUID, step_type: str, source_name: str,
    db: Session = Depends(get_db),
    _: str = Security(require_api_key),
):
    repo = PipelineRepository(db)
    entries = repo.get_cache_history(run_id, step_type, source_name)
    return [
        CacheEntryResponse(
            id=e.id, version=e.version, is_current=e.is_current,
            structured_data=e.structured_data, raw_content=e.raw_content,
            notes=e.notes, created_at=e.created_at,
        )
        for e in entries
    ]
