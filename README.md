# Car Analytics API

API REST de análisis de vehículos generados con el skill `car-configurator-preferences`. Almacena pipelines de enriquecimiento de datos en PostgreSQL, desplegada en **Railway**.

## Stack

- **FastAPI** — API REST con Swagger automático en `/docs`
- **PostgreSQL** — Base de datos relacional (provisionada por Railway)
- **SQLAlchemy 2.0** — ORM
- **Pydantic v2** — Validación de schemas
- **Alembic** — Migraciones de esquema
- **Docker** — Contenedor listo para Railway

## Modelo unificado: Pipelines

A partir de la migración `c1a7f0d4e9b2_drop_legacy_entities` el modelo queda unificado bajo un único patrón: **PipelineRun**. Cada análisis o comparativa es un `PipelineRun` con `pipeline_type ∈ {vehicle_analysis, vehicle_comparison}`, con sus 8 pasos (technical_specs, real_consumption, press_review, ncap, owner_opinions, market_price, competitive_analysis, final_decision) y sus fuentes de datos versionadas (`DataSource` + `CacheEntry`).

Las entidades legacy (`VehicleAnalysis`, `Comparison`, `PressReview`) fueron eliminadas. Un script (`api/scripts/export_legacy.py`) y un export (`api/scripts/legacy_export_20260514/`) preservan los datos en JSON antes del drop.

## Arquitectura

```
api/app/
├── core/           # Configuración y seguridad (API Key)
├── domain/         # pipeline.py (estados, step types, dependencias)
├── db/             # pipeline_entities.py (ORM) + session
├── repositories/   # pipeline_repository.py
└── api/v1/         # Endpoints FastAPI
    ├── router.py
    └── endpoints/
        └── pipelines.py   # Pipeline runs, steps, sources, cache history
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/pipelines/runs/` | Crear pipeline run |
| `GET` | `/api/v1/pipelines/runs/` | Listar runs (filtros: pipeline_type, status) |
| `GET` | `/api/v1/pipelines/runs/{id}` | Detalle completo con pasos y fuentes |
| `POST` | `/api/v1/pipelines/runs/{id}/rerun` | Marcar todos los pasos como stale |
| `PATCH` | `/api/v1/pipelines/runs/{id}/steps/{step}` | Actualizar estado y resultado de un paso |
| `POST` | `/api/v1/pipelines/runs/{id}/steps/{step}/rerun` | Relanzar un paso (propaga stale a dependientes) |
| `POST` | `/api/v1/pipelines/runs/{id}/steps/{step}/sources/` | Añadir fuente con caché versionada |
| `GET` | `/api/v1/pipelines/runs/{id}/steps/{step}/sources/{name}/history` | Historial de versiones |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger interactivo |

Todos los endpoints requieren el header `X-API-Key`.

## Despliegue en Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → `arazvan-ec/car`.
2. **+ New** → **Database** → **Add PostgreSQL**.
3. En el servicio API → **Variables**:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   API_KEY=<python -c "import secrets; print(secrets.token_urlsafe(32))">
   ```
4. Las migraciones Alembic se aplican automáticamente en el CMD de `api/Dockerfile` (`alembic upgrade head && uvicorn …`).

## Skill

El skill `car-configurator-preferences` (en `skills/car-configurator-preferences/SKILL.md`) define los principios de configuración, los 8 step types con sus dependencias y los schemas JSON de cada `structured_result`.

## Desarrollo local

```bash
pip install -r requirements.txt
cp .env.example .env  # editar DATABASE_URL local

# Migraciones
alembic -c api/alembic.ini upgrade head

# Servidor
uvicorn app.main:app --reload --app-dir api
```

Swagger: `http://localhost:8000/docs`.

## Frontend

`frontend/` — Vite + React + Tailwind + shadcn/ui. Páginas:

| Ruta | Descripción |
|---|---|
| `/` | Dashboard con stats agregados de pipelines |
| `/analyses` | Lista de pipelines tipo `vehicle_analysis` |
| `/comparisons` | Lista de pipelines tipo `vehicle_comparison` |
| `/pipelines` | Todos los pipelines |
| `/analyses/:id` · `/comparisons/:id` · `/pipelines/:id` | Detalle del pipeline (pasos, fuentes, caché) |
