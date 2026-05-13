from fastapi import APIRouter

from app.api.v1.endpoints import analyses, comparisons, stats, press_reviews

api_router = APIRouter()

api_router.include_router(analyses.router, prefix="/analyses", tags=["Análisis"])
api_router.include_router(comparisons.router, prefix="/comparisons", tags=["Comparativas"])
api_router.include_router(stats.router, prefix="/stats", tags=["Estadísticas"])

# Reviews de prensa anidadas bajo un análisis
# Rutas: /api/v1/analyses/{analysis_id}/reviews/
api_router.include_router(
    press_reviews.router,
    prefix="/analyses/{analysis_id}/reviews",
    tags=["Reviews de Prensa"],
)
