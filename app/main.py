from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine
from app.db import entities  # noqa: F401 — importar para registrar modelos en Base

# Crear tablas al arrancar
from app.db.session import Base
Base.metadata.create_all(bind=engine)

# Servidor MCP (transporte HTTP streamable, compatible con Manus Custom MCP)
from mcp_server import get_mcp_app  # noqa: E402

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
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
