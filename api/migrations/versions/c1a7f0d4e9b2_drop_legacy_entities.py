"""drop_legacy_entities

Elimina las tablas legacy (vehicle_analyses, press_reviews, comparisons) en
favor del modelo unificado basado en PipelineRun.

Antes de aplicar en producción, ejecutar `api/scripts/export_legacy.py` para
guardar un JSON de respaldo (ver api/scripts/legacy_export_*/).

Revision ID: c1a7f0d4e9b2
Revises: 8a408ee49f03
Create Date: 2026-05-14 01:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1a7f0d4e9b2'
down_revision: Union[str, Sequence[str], None] = '8a408ee49f03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop legacy tables. Press reviews y comparisons tienen FK CASCADE
    sobre vehicle_analyses, así que el orden DROP es seguro de todos modos."""
    op.drop_table('press_reviews')
    op.drop_table('comparisons')
    op.drop_table('vehicle_analyses')


def downgrade() -> None:
    """Restaurar las tablas legacy es imposible sin re-importar los datos
    exportados manualmente. Esta migración es de un solo sentido."""
    raise NotImplementedError(
        "Downgrade no soportado. Restaurar requiere reimportar el JSON "
        "exportado por api/scripts/export_legacy.py."
    )
