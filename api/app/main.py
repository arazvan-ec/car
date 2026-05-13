from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router
from app.db import entities  # noqa: F401 — registrar modelos


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    El esquema de la base de datos es gestionado por Alembic.
    Las migraciones se ejecutan en el CMD del Dockerfile antes de arrancar la API.
    """
    yield


# Servidor MCP
from mcp_server import get_mcp_app  # noqa: E402

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.mount("/mcp", get_mcp_app())


@app.get("/", tags=["Health"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ok",
        "docs": "/docs",
        "mcp_endpoint": "/mcp",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
