"""
Repositorio del patrón Pipeline.
Gestiona PipelineRun, PipelineStep, DataSource y CacheEntry.
"""
import hashlib
import json
from uuid import UUID
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session, joinedload

from app.domain.pipeline import (
    PipelineRun, PipelineStep, DataSource, CacheEntry,
    RunStatus, StepStatus, STEP_DEPENDENCIES, VEHICLE_STEP_TYPES
)
from app.db.pipeline_entities import (
    PipelineRunEntity, PipelineStepEntity,
    DataSourceEntity, CacheEntryEntity
)


def _hash_subject(subject_data: dict) -> str:
    """SHA256 del subject_data ordenado para deduplicación."""
    canonical = json.dumps(subject_data, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(canonical.encode()).hexdigest()


class PipelineRepository:

    def __init__(self, db: Session):
        self.db = db

    # ── PipelineRun ───────────────────────────────────────────────────────────

    def create_run(
        self,
        pipeline_type: str,
        subject_type: str,
        subject_data: dict,
        skill_version: Optional[str] = None,
        notes: Optional[str] = None,
        step_types: Optional[list[str]] = None,
    ) -> PipelineRun:
        """
        Crea un nuevo PipelineRun con todos sus pasos inicializados en 'pending'.
        Si ya existe un run con el mismo subject_hash, lo devuelve sin crear uno nuevo.
        """
        subject_hash = _hash_subject(subject_data)

        # Deduplicación: devolver run existente si el subject es el mismo
        existing = self.db.query(PipelineRunEntity).filter(
            PipelineRunEntity.pipeline_type == pipeline_type,
            PipelineRunEntity.subject_hash == subject_hash,
        ).first()
        if existing:
            return self._run_to_domain(existing)

        # Crear el run
        run_entity = PipelineRunEntity(
            pipeline_type=pipeline_type,
            subject_type=subject_type,
            subject_data=subject_data,
            subject_hash=subject_hash,
            status=RunStatus.PENDING,
            skill_version=skill_version,
            notes=notes,
        )
        self.db.add(run_entity)
        self.db.flush()  # Obtener el ID antes de crear los pasos

        # Crear los pasos según el tipo de pipeline
        types = step_types or (VEHICLE_STEP_TYPES if pipeline_type == "vehicle_analysis" else [])
        for step_type in types:
            step = PipelineStepEntity(
                run_id=run_entity.id,
                step_type=step_type,
                status=StepStatus.PENDING,
                depends_on=STEP_DEPENDENCIES.get(step_type, []),
            )
            self.db.add(step)

        self.db.commit()
        self.db.refresh(run_entity)
        return self._run_to_domain(run_entity)

    def get_run(self, run_id: UUID) -> Optional[PipelineRun]:
        entity = (
            self.db.query(PipelineRunEntity)
            .options(
                joinedload(PipelineRunEntity.steps)
                .joinedload(PipelineStepEntity.data_sources)
                .joinedload(DataSourceEntity.cache_entries)
            )
            .filter(PipelineRunEntity.id == run_id)
            .first()
        )
        return self._run_to_domain(entity) if entity else None

    def list_runs(
        self,
        pipeline_type: Optional[str] = None,
        subject_type: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[PipelineRun]:
        q = self.db.query(PipelineRunEntity)
        if pipeline_type:
            q = q.filter(PipelineRunEntity.pipeline_type == pipeline_type)
        if subject_type:
            q = q.filter(PipelineRunEntity.subject_type == subject_type)
        if status:
            q = q.filter(PipelineRunEntity.status == status)
        entities = q.order_by(PipelineRunEntity.created_at.desc()).offset(skip).limit(limit).all()
        return [self._run_to_domain(e) for e in entities]

    def update_run_status(self, run_id: UUID, status: RunStatus, decision: Optional[dict] = None) -> Optional[PipelineRun]:
        entity = self.db.query(PipelineRunEntity).filter(PipelineRunEntity.id == run_id).first()
        if not entity:
            return None
        entity.status = status
        entity.updated_at = datetime.utcnow()
        if decision is not None:
            entity.decision = decision
        self.db.commit()
        self.db.refresh(entity)
        return self._run_to_domain(entity)

    def rerun(self, run_id: UUID) -> Optional[PipelineRun]:
        """Marca todos los pasos como stale para relanzar el pipeline completo."""
        entity = self.db.query(PipelineRunEntity).filter(PipelineRunEntity.id == run_id).first()
        if not entity:
            return None
        for step in entity.steps:
            step.status = StepStatus.STALE
            step.completed_at = None
        entity.status = RunStatus.STALE
        entity.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(entity)
        return self._run_to_domain(entity)

    # ── PipelineStep ──────────────────────────────────────────────────────────

    def update_step(
        self,
        run_id: UUID,
        step_type: str,
        status: StepStatus,
        structured_result: Optional[dict] = None,
        error_message: Optional[str] = None,
    ) -> Optional[PipelineStep]:
        step = (
            self.db.query(PipelineStepEntity)
            .filter(
                PipelineStepEntity.run_id == run_id,
                PipelineStepEntity.step_type == step_type,
            )
            .first()
        )
        if not step:
            return None
        step.status = status
        if status == StepStatus.RUNNING:
            step.started_at = datetime.utcnow()
        if status in (StepStatus.COMPLETED, StepStatus.FAILED):
            step.completed_at = datetime.utcnow()
        if structured_result is not None:
            step.structured_result = structured_result
        if error_message is not None:
            step.error_message = error_message

        # Propagar stale a pasos dependientes
        if status == StepStatus.STALE:
            self._propagate_stale(run_id, step_type)

        # Recalcular estado global del run
        self._recalculate_run_status(run_id)
        self.db.commit()
        self.db.refresh(step)
        return self._step_to_domain(step)

    def rerun_step(self, run_id: UUID, step_type: str) -> Optional[PipelineStep]:
        """Marca un paso específico como stale y propaga a dependientes."""
        return self.update_step(run_id, step_type, StepStatus.STALE)

    # ── DataSource + CacheEntry ───────────────────────────────────────────────

    def add_source_with_cache(
        self,
        run_id: UUID,
        step_type: str,
        source_name: str,
        source_url: str,
        raw_content: Optional[str] = None,
        structured_data: Optional[dict] = None,
        notes: Optional[str] = None,
    ) -> tuple[DataSource, CacheEntry]:
        """
        Añade una fuente de datos y su primera (o nueva) entrada de caché.
        Si la fuente ya existe para este paso, crea una nueva versión de caché.
        """
        step = (
            self.db.query(PipelineStepEntity)
            .filter(
                PipelineStepEntity.run_id == run_id,
                PipelineStepEntity.step_type == step_type,
            )
            .first()
        )
        if not step:
            raise ValueError(f"Step '{step_type}' not found in run {run_id}")

        # Buscar fuente existente o crear nueva
        source_entity = (
            self.db.query(DataSourceEntity)
            .filter(
                DataSourceEntity.step_id == step.id,
                DataSourceEntity.source_name == source_name,
            )
            .first()
        )
        if not source_entity:
            source_entity = DataSourceEntity(
                step_id=step.id,
                source_name=source_name,
                source_url=source_url,
                fetched_at=datetime.utcnow(),
            )
            self.db.add(source_entity)
            self.db.flush()
        else:
            # Actualizar URL y timestamp
            source_entity.source_url = source_url
            source_entity.fetched_at = datetime.utcnow()

        # Calcular nueva versión
        existing_versions = (
            self.db.query(CacheEntryEntity)
            .filter(CacheEntryEntity.data_source_id == source_entity.id)
            .all()
        )
        new_version = max((e.version for e in existing_versions), default=0) + 1

        # Marcar versiones anteriores como no-current
        for old in existing_versions:
            old.is_current = False

        # Crear nueva entrada de caché
        cache_entity = CacheEntryEntity(
            data_source_id=source_entity.id,
            version=new_version,
            is_current=True,
            raw_content=raw_content,
            structured_data=structured_data,
            notes=notes,
        )
        self.db.add(cache_entity)
        self.db.commit()
        self.db.refresh(source_entity)
        self.db.refresh(cache_entity)

        return self._source_to_domain(source_entity), self._cache_to_domain(cache_entity)

    def get_cache_history(self, run_id: UUID, step_type: str, source_name: str) -> list[CacheEntry]:
        """Devuelve todas las versiones de caché de una fuente, ordenadas por versión."""
        step = (
            self.db.query(PipelineStepEntity)
            .filter(PipelineStepEntity.run_id == run_id, PipelineStepEntity.step_type == step_type)
            .first()
        )
        if not step:
            return []
        source = (
            self.db.query(DataSourceEntity)
            .filter(DataSourceEntity.step_id == step.id, DataSourceEntity.source_name == source_name)
            .first()
        )
        if not source:
            return []
        entries = (
            self.db.query(CacheEntryEntity)
            .filter(CacheEntryEntity.data_source_id == source.id)
            .order_by(CacheEntryEntity.version.desc())
            .all()
        )
        return [self._cache_to_domain(e) for e in entries]

    # ── Helpers privados ──────────────────────────────────────────────────────

    def _propagate_stale(self, run_id: UUID, stale_step_type: str):
        """Marca como stale todos los pasos que dependen del paso dado."""
        all_steps = (
            self.db.query(PipelineStepEntity)
            .filter(PipelineStepEntity.run_id == run_id)
            .all()
        )
        for step in all_steps:
            deps = step.depends_on or []
            if stale_step_type in deps and step.status == StepStatus.COMPLETED:
                step.status = StepStatus.STALE
                step.completed_at = None

    def _recalculate_run_status(self, run_id: UUID):
        """Recalcula y actualiza el estado global del run."""
        run = self.db.query(PipelineRunEntity).filter(PipelineRunEntity.id == run_id).first()
        if not run:
            return
        statuses = {s.status for s in run.steps}
        if StepStatus.FAILED in statuses:
            run.status = RunStatus.FAILED
        elif StepStatus.RUNNING in statuses:
            run.status = RunStatus.RUNNING
        elif StepStatus.STALE in statuses:
            run.status = RunStatus.STALE
        elif all(s.status == StepStatus.COMPLETED for s in run.steps) and run.steps:
            run.status = RunStatus.COMPLETED
        else:
            run.status = RunStatus.PENDING
        run.updated_at = datetime.utcnow()

    # ── Traductores Domain ↔ Entity ───────────────────────────────────────────

    def _cache_to_domain(self, e: CacheEntryEntity) -> CacheEntry:
        return CacheEntry(
            id=e.id, created_at=e.created_at,
            data_source_id=e.data_source_id,
            version=e.version, is_current=e.is_current,
            raw_content=e.raw_content,
            structured_data=e.structured_data,
            notes=e.notes,
        )

    def _source_to_domain(self, e: DataSourceEntity) -> DataSource:
        return DataSource(
            id=e.id, created_at=e.created_at,
            step_id=e.step_id,
            source_name=e.source_name, source_url=e.source_url,
            fetched_at=e.fetched_at,
            cache_entries=[self._cache_to_domain(c) for c in e.cache_entries],
        )

    def _step_to_domain(self, e: PipelineStepEntity) -> PipelineStep:
        return PipelineStep(
            id=e.id, created_at=e.created_at,
            run_id=e.run_id, step_type=e.step_type,
            status=StepStatus(e.status),
            structured_result=e.structured_result,
            error_message=e.error_message,
            depends_on=e.depends_on or [],
            data_sources=[self._source_to_domain(s) for s in (e.data_sources or [])],
            started_at=e.started_at, completed_at=e.completed_at,
        )

    def _run_to_domain(self, e: PipelineRunEntity) -> PipelineRun:
        return PipelineRun(
            id=e.id, created_at=e.created_at, updated_at=e.updated_at,
            pipeline_type=e.pipeline_type,
            subject_type=e.subject_type,
            subject_data=e.subject_data,
            subject_hash=e.subject_hash,
            status=RunStatus(e.status),
            decision=e.decision,
            skill_version=e.skill_version,
            notes=e.notes,
            steps=[self._step_to_domain(s) for s in (e.steps or [])],
        )
