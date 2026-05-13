"""
Modelos de dominio puros — Patrón Pipeline de Enriquecimiento de Datos.
Sin dependencia de ORM ni frameworks.

Jerarquía:
  PipelineRun → PipelineStep → DataSource → CacheEntry
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Any
from uuid import UUID, uuid4
from enum import Enum


class RunStatus(str, Enum):
    PENDING   = "pending"    # Creado, sin iniciar
    RUNNING   = "running"    # En ejecución activa
    COMPLETED = "completed"  # Todos los pasos completados
    FAILED    = "failed"     # Algún paso crítico falló
    STALE     = "stale"      # Datos desactualizados, pendiente de relanzar


class StepStatus(str, Enum):
    PENDING   = "pending"
    RUNNING   = "running"
    COMPLETED = "completed"
    FAILED    = "failed"
    STALE     = "stale"      # Marcado para actualización


# ── Tipos de paso para análisis de vehículos ──────────────────────────────────
# Extensible: añadir nuevos step_type sin cambiar el modelo
VEHICLE_STEP_TYPES = [
    "technical_specs",       # Ficha técnica (dimensiones, motor, prestaciones)
    "real_consumption",      # Consumo real medido por fuentes especializadas
    "press_review",          # Reviews de prensa (km77, Motor1, CarWow…)
    "ncap",                  # Seguridad Euro NCAP
    "owner_opinions",        # Opiniones de propietarios (foros, Reddit)
    "market_price",          # Precio real de mercado (concesionarios, wallapop)
    "competitive_analysis",  # Posicionamiento vs. competidores
    "final_decision",        # Decisión final del skill (depende de todos)
]

STEP_DEPENDENCIES = {
    "technical_specs":      [],
    "real_consumption":     ["technical_specs"],
    "press_review":         [],
    "ncap":                 [],
    "owner_opinions":       [],
    "market_price":         ["technical_specs"],
    "competitive_analysis": ["technical_specs", "market_price"],
    "final_decision":       ["technical_specs", "real_consumption",
                             "press_review", "ncap", "owner_opinions",
                             "market_price", "competitive_analysis"],
}


@dataclass
class CacheEntry:
    """
    Versión inmutable de los datos obtenidos de una fuente externa.
    Nunca se sobreescribe — cada actualización crea una nueva versión.
    """
    data_source_id: UUID
    version: int                        # Autoincremental por fuente
    raw_content: Optional[str]          # Texto completo guardado (HTML, texto…)
    structured_data: Optional[dict]     # Datos extraídos en formato JSON
    is_current: bool = True             # Solo una versión por fuente es current
    notes: Optional[str] = None        # Notas sobre esta versión (ej. "actualizado tras cambio de precio")
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DataSource:
    """
    Fuente externa consultada en un paso del pipeline.
    Contiene el historial de todas las versiones de caché.
    """
    step_id: UUID
    source_name: str                    # "km77", "euroncap", "ultimatespecs"…
    source_url: str                     # URL exacta consultada
    fetched_at: datetime = field(default_factory=datetime.utcnow)
    cache_entries: list[CacheEntry] = field(default_factory=list)
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def current_cache(self) -> Optional[CacheEntry]:
        """Devuelve la versión actual de la caché."""
        return next((e for e in self.cache_entries if e.is_current), None)

    @property
    def latest_version(self) -> int:
        """Devuelve el número de versión más alto."""
        return max((e.version for e in self.cache_entries), default=0)


@dataclass
class PipelineStep:
    """
    Paso atómico de un pipeline. Unidad mínima de trabajo relanzable.
    """
    run_id: UUID
    step_type: str                      # "technical_specs", "press_review"…
    status: StepStatus = StepStatus.PENDING
    structured_result: Optional[dict] = None   # Resultado procesado del paso
    error_message: Optional[str] = None
    depends_on: list[str] = field(default_factory=list)  # step_types requeridos
    data_sources: list[DataSource] = field(default_factory=list)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def mark_stale(self):
        self.status = StepStatus.STALE
        self.completed_at = None

    def mark_running(self):
        self.status = StepStatus.RUNNING
        self.started_at = datetime.utcnow()

    def mark_completed(self, result: dict):
        self.status = StepStatus.COMPLETED
        self.structured_result = result
        self.completed_at = datetime.utcnow()

    def mark_failed(self, error: str):
        self.status = StepStatus.FAILED
        self.error_message = error
        self.completed_at = datetime.utcnow()


@dataclass
class PipelineRun:
    """
    Ejecución concreta de un pipeline sobre una entidad específica.
    Contiene todos los pasos y el estado global del proceso.
    """
    pipeline_type: str                  # "vehicle_analysis", "property_analysis"…
    subject_type: str                   # "vehicle", "property", "company"…
    subject_data: dict                  # Datos de la entidad analizada
    subject_hash: str                   # Hash de subject_data para deduplicación
    status: RunStatus = RunStatus.PENDING
    decision: Optional[dict] = None    # Decisión final generada
    steps: list[PipelineStep] = field(default_factory=list)
    skill_version: Optional[str] = None
    notes: Optional[str] = None
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def get_step(self, step_type: str) -> Optional[PipelineStep]:
        return next((s for s in self.steps if s.step_type == step_type), None)

    def completed_step_types(self) -> list[str]:
        return [s.step_type for s in self.steps if s.status == StepStatus.COMPLETED]

    def is_step_ready(self, step_type: str) -> bool:
        """Verifica si las dependencias de un paso están completadas."""
        deps = STEP_DEPENDENCIES.get(step_type, [])
        completed = self.completed_step_types()
        return all(d in completed for d in deps)

    def overall_status(self) -> RunStatus:
        """Calcula el estado global basado en los pasos."""
        statuses = {s.status for s in self.steps}
        if StepStatus.FAILED in statuses:
            return RunStatus.FAILED
        if StepStatus.RUNNING in statuses:
            return RunStatus.RUNNING
        if StepStatus.STALE in statuses:
            return RunStatus.STALE
        if all(s.status == StepStatus.COMPLETED for s in self.steps):
            return RunStatus.COMPLETED
        return RunStatus.PENDING
