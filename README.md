# Car Analytics API

API REST de persistencia para análisis de vehículos generados con el skill `car-configurator-preferences` de Manus. Almacena análisis, comparativas y estadísticas de negocio en PostgreSQL, desplegada en **Railway**.

## Stack

- **FastAPI** — API REST con Swagger automático en `/docs`
- **PostgreSQL** — Base de datos relacional (provisionada por Railway)
- **SQLAlchemy 2.0** — ORM con separación Domain → Repository → Entity
- **Pydantic v2** — Validación de schemas
- **Docker** — Contenedor listo para Railway

## Arquitectura

```
app/
├── core/           # Configuración y seguridad (API Key)
├── domain/         # Modelos de negocio puros (sin ORM)
├── db/             # Entidades ORM, traductores Domain↔Entity, sesión
├── repositories/   # Acceso a datos (patrón Repository)
└── api/v1/         # Endpoints FastAPI + schemas Pydantic
    └── endpoints/
        ├── analyses.py     # CRUD de análisis de vehículos
        ├── comparisons.py  # CRUD de comparativas
        └── stats.py        # Estadísticas de negocio
```

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/analyses/` | Guardar un análisis de vehículo |
| `GET` | `/api/v1/analyses/` | Listar análisis (filtros: brand, model, fuel_type) |
| `GET` | `/api/v1/analyses/{id}` | Obtener análisis por ID |
| `DELETE` | `/api/v1/analyses/{id}` | Eliminar un análisis |
| `POST` | `/api/v1/comparisons/` | Guardar una comparativa entre dos modelos |
| `GET` | `/api/v1/comparisons/` | Listar comparativas |
| `GET` | `/api/v1/stats/` | Estadísticas de negocio (marcas, precios, ratings) |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Documentación Swagger interactiva |

Todos los endpoints requieren el header `X-API-Key`.

## Despliegue en Railway

### 1. Crear el servicio desde GitHub

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Seleccionar `arazvan-ec/car`
3. Railway detecta el `Dockerfile` y `railway.toml` automáticamente

### 2. Añadir PostgreSQL

En el mismo proyecto Railway → **+ New** → **Database** → **Add PostgreSQL**

### 3. Variables de entorno

En el servicio de la API → **Variables**, añadir:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
API_KEY=<generar: python -c "import secrets; print(secrets.token_urlsafe(32))">
```

`DATABASE_URL` se referencia directamente desde el servicio PostgreSQL de Railway.

### 4. Deploy

Railway despliega automáticamente en cada push a `main`. La URL pública aparece en el dashboard del servicio.

## Desarrollo local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL local

# Arrancar
uvicorn app.main:app --reload
```

La documentación interactiva estará en `http://localhost:8000/docs`.

## Evolución prevista

| Entidad | Propósito |
|---|---|
| `Customer` | Perfiles de clientes interesados en un vehículo |
| `Lead` | Solicitudes de prueba/compra vinculadas a un análisis |
| `PriceAlert` | Alertas cuando el PVP baja de un umbral definido |
| `ReviewSnapshot` | Histórico de puntuaciones de prensa por modelo y fecha |
