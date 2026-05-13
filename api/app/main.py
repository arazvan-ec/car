from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine
from app.db import entities  # noqa: F401 — registrar modelos en Base
from app.db.session import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Crea las tablas en PostgreSQL al arrancar la app.
    Usando lifespan en lugar de import-time para que Railway
    haya inyectado DATABASE_URL antes de intentar conectar.
    """
    Base.metadata.create_all(bind=engine)
    yield
    # (aquí iría el teardown si fuera necesario)


# Servidor MCP — importar después del lifespan para evitar create_all prematuro
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

# REST API
app.include_router(api_router, prefix=settings.API_V1_STR)

# MCP Server — Manus lo conecta apuntando a: https://<dominio>/mcp
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
