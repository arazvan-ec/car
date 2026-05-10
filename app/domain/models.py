"""
Modelos de dominio puros (sin dependencia de ORM ni frameworks).
Representan las entidades de negocio del sistema MXO Track.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4


@dataclass
class VehicleAnalysis:
    """
    Resultado de un análisis completo de un vehículo generado por el skill
    car-configurator-preferences. Incluye datos de catálogo y datos reales
    obtenidos de fuentes especializadas.
    """
    brand: str                          # Marca (ej. "Ford")
    model: str                          # Modelo (ej. "Kuga")
    year: int                           # Año del modelo analizado
    trim: str                           # Acabado recomendado (ej. "Active X")
    engine: str                         # Motorización (ej. "2.5 FHEV 183 CV AWD")
    drivetrain: str                     # Tracción (ej. "AWD", "FWD")
    fuel_type: str                      # Tipo de propulsión (ej. "FHEV", "PHEV", "BEV")
    horsepower: int                     # CV totales
    wheel_size_inches: int              # Diámetro de llantas (ej. 19)
    headlights_type: str                # Tipo de faros (ej. "LED Matricial")
    wltp_consumption: Optional[float]   # Consumo homologado WLTP (l/100km)
    real_consumption: Optional[float]   # Consumo real medido (km77 u otra fuente)
    dgt_label: str                      # Etiqueta DGT (ECO, CERO, C, B)
    list_price_eur: float               # PVP de tarifa en euros
    euro_ncap_stars: Optional[int]      # Estrellas Euro NCAP (0-5)
    euro_ncap_adult_pct: Optional[int]  # % protección adultos Euro NCAP
    press_rating: Optional[float]       # Nota media de prensa (0-10)
    press_sources: list[str] = field(default_factory=list)  # Fuentes consultadas
    pros: list[str] = field(default_factory=list)           # Puntos fuertes
    cons: list[str] = field(default_factory=list)           # Puntos débiles
    reliability_notes: Optional[str] = None  # Notas de fiabilidad / problemas conocidos
    has_daily_charging: Optional[bool] = None  # ¿El usuario tiene carga diaria?
    raw_notes: Optional[str] = None     # Notas libres del análisis
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Comparison:
    """
    Comparativa entre dos análisis de vehículos.
    Almacena el veredicto razonado y el modelo ganador por criterio.
    """
    analysis_a_id: UUID
    analysis_b_id: UUID
    verdict: str                        # Texto del veredicto razonado
    winner_brand: str                   # Marca del modelo ganador global
    winner_model: str                   # Modelo ganador global
    criteria_winners: dict              # {criterio: marca_ganadora}
    raw_notes: Optional[str] = None
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
