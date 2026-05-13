from fastapi import APIRouter

from app.api.v1.endpoints import analyses, comparisons, stats

api_router = APIRouter()

api_router.include_router(analyses.router, prefix="/analyses", tags=["Análisis"])
api_router.include_router(comparisons.router, prefix="/comparisons", tags=["Comparativas"])
api_router.include_router(stats.router, prefix="/stats", tags=["Estadísticas"])
