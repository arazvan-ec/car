from fastapi import APIRouter

from app.api.v1.endpoints import analyses, comparisons, stats, press_reviews, pipelines

api_router = APIRouter()

# ── Endpoints del patrón Pipeline (nuevo sistema genérico) ────────────────────
api_router.include_router(pipelines.router, prefix="/pipelines", tags=["Pipelines"])

# ── Endpoints del modelo anterior (compatibilidad) ────────────────────────────
api_router.include_router(analyses.router, prefix="/analyses", tags=["Análisis"])
api_router.include_router(comparisons.router, prefix="/comparisons", tags=["Comparativas"])
api_router.include_router(stats.router, prefix="/stats", tags=["Estadísticas"])
api_router.include_router(
    press_reviews.router,
    prefix="/analyses/{analysis_id}/reviews",
    tags=["Reviews de Prensa"],
)
