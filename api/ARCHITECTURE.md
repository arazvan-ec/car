# Car Analytics — Arquitectura del Patrón Pipeline

## Visión

El sistema es un **motor genérico de enriquecimiento de datos** basado en pipelines. Cada pipeline representa un proceso de análisis de una entidad (un vehículo, un inmueble, una empresa…) compuesto por pasos atómicos e independientes. Cada paso consulta una fuente externa, guarda el resultado en caché versionada y produce datos estructurados que alimentan la decisión final.

---

## Modelo de Datos

### Jerarquía de entidades

```
Pipeline
  Definición reutilizable de un tipo de proceso.
  Ejemplo: "Análisis de vehículo", "Análisis de inmueble"
  
  └── PipelineRun
        Una ejecución concreta del pipeline sobre una entidad específica.
        Ejemplo: "Análisis del Ford Kuga 2025 Active X"
        
        ├── subject_type: "vehicle" | "property" | "company"
        ├── subject_data: JSON con los datos de la entidad analizada
        ├── status: pending | running | completed | failed | stale
        ├── decision: JSON con la decisión final generada
        └── PipelineStep (N pasos, uno por tipo de dato)
              
              ├── step_type: "technical_specs" | "real_consumption" |
              │             "press_review" | "ncap" | "owner_opinions" |
              │             "market_price" | "competitive_analysis" |
              │             "final_decision"
              ├── status: pending | running | completed | failed | stale
              ├── depends_on: [step_type, ...] (pasos previos requeridos)
              ├── structured_result: JSON con los datos procesados del paso
              └── DataSource (N fuentes por paso)
                    
                    ├── source_name: "km77" | "euroncap" | "ultimatespecs"
                    ├── source_url: URL consultada
                    ├── fetched_at: timestamp de la consulta
                    └── CacheEntry (N versiones, historial completo)
                          
                          ├── version: 1, 2, 3... (autoincremental por fuente)
                          ├── is_current: true/false
                          ├── raw_content: texto completo guardado
                          ├── structured_data: JSON con datos extraídos
                          └── created_at: timestamp
```

---

## Tipos de Pasos — Aplicación a Vehículos

| step_type | Fuentes típicas | structured_result contiene | depends_on |
|---|---|---|---|
| `technical_specs` | ultimatespecs, km77 fichas | CV, par, 0-100, dimensiones, maletero | — |
| `real_consumption` | km77 prueba, Motor1 | consumo real, fuente, desviación vs WLTP | technical_specs |
| `press_review` | km77, Motor1, CarWow, AutoBild | rating, pros, cons, veredicto por fuente | — |
| `ncap` | euroncap.com | estrellas, % adultos/niños/peatones/asistencia, año | — |
| `owner_opinions` | Forocoches, Reddit, foros | rating propietarios, quejas frecuentes, muestra | — |
| `market_price` | concesionarios, coches.net | precio real calle, descuento típico, renting | technical_specs |
| `competitive_analysis` | comparativa con otros PipelineRuns | competidores, ventaja/desventaja, posición precio | technical_specs, market_price |
| `final_decision` | skill car-configurator-preferences | recomendación, configuración óptima, veredicto | todos los anteriores |

---

## Flujos de Operación

### Crear un nuevo análisis (pipeline completo)

```
POST /api/v1/pipelines/runs/
{
  "pipeline_type": "vehicle_analysis",
  "subject_type": "vehicle",
  "subject_data": {"brand": "Ford", "model": "Kuga", "year": 2025, ...}
}
→ Crea PipelineRun con todos los PipelineStep en estado "pending"
→ Devuelve el run_id para ir completando los pasos
```

### Completar un paso (guardar datos de una fuente)

```
POST /api/v1/pipelines/runs/{run_id}/steps/{step_type}/sources/
{
  "source_name": "km77",
  "source_url": "https://www.km77.com/...",
  "raw_content": "texto completo de la página",
  "structured_data": {"real_consumption": 6.4, "source": "km77"}
}
→ Crea DataSource + CacheEntry (version=1, is_current=true)
→ Actualiza el structured_result del PipelineStep
→ Marca el step como "completed"
→ Si todos los pasos requeridos están completados, actualiza el PipelineRun
```

### Relanzar un paso (actualizar datos)

```
POST /api/v1/pipelines/runs/{run_id}/steps/{step_type}/rerun
→ Marca el step como "stale"
→ El agente (Manus) consulta las fuentes de nuevo
→ POST /sources/ crea nueva CacheEntry (version=N+1, is_current=true)
→ La versión anterior queda con is_current=false (historial preservado)
→ Recalcula los pasos dependientes (propagación hacia adelante)
```

### Relanzar el pipeline completo

```
POST /api/v1/pipelines/runs/{run_id}/rerun
→ Marca todos los steps como "stale"
→ El agente ejecuta cada paso en orden de dependencias
```

### Consultar el estado del pipeline

```
GET /api/v1/pipelines/runs/{run_id}
→ Devuelve el PipelineRun con todos sus steps, fuentes y versiones de caché
→ Incluye qué pasos están completados, pendientes o desactualizados
```

---

## Principios de Diseño

**Atomicidad:** Cada PipelineStep es independiente. Fallar en uno no bloquea los demás (salvo dependencias explícitas).

**Versionado de caché:** Nunca se sobreescribe una CacheEntry. Cada actualización crea una nueva versión. El historial completo es siempre accesible.

**Propagación de dependencias:** Cuando un step se marca como `stale`, todos los steps que dependen de él también se marcan como `stale` automáticamente.

**Genericidad:** `subject_type` y `step_type` son strings configurables. El sistema no asume que solo analiza vehículos.

**Idempotencia:** Crear el mismo PipelineRun dos veces devuelve el existente (deduplicación por subject_data hash).

---

## Relación con el modelo anterior

El modelo anterior (`vehicle_analyses`, `comparisons`, `press_reviews`) se mantiene como **vista desnormalizada** para compatibilidad y consultas rápidas. Los PipelineRun alimentan esas tablas como proyección del estado actual del pipeline.

```
PipelineRun (fuente de verdad)
    ↓ proyecta
VehicleAnalysis (vista desnormalizada, para consultas rápidas y frontend)
```
