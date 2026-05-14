---
name: car-configurator-preferences
description: Motor de análisis de vehículos basado en pipelines de enriquecimiento de datos. Cada análisis es un PipelineRun con pasos atómicos (ficha técnica, consumo real, reviews, NCAP, propietarios, precio, competencia, decisión). Cada paso guarda sus fuentes con caché versionada. Los pasos pueden relanzarse de forma independiente. Usar cuando se analice, configure o compare un vehículo.
---

# Car Configurator — Motor de Análisis por Pipelines

Este skill gestiona análisis de vehículos como **pipelines de enriquecimiento de datos**. Cada análisis es reproducible, versionado y actualizable paso a paso.

---

## 1. Principios de Configuración

Al evaluar un vehículo, aplicar siempre:

1. **Prestaciones y Respuesta:** Priorizar CV, par motor y tracción total (AWD).
2. **Seguridad Activa:** Faros LED matriciales, llantas 19"/20", ADAS de serie.
3. **Estética Premium:** Acabados "X" o tope de gama (ST-Line X, Active X, R-Line, GR Sport).
4. **Híbridos:** Sin carga diaria → descartar PHEV, elegir FHEV AWD. Con carga → PHEV más potente.

---

## 2. Pasos del Pipeline — Análisis de Vehículo

Cada paso es una unidad atómica con sus propias fuentes y caché versionada.

| step_type | Qué hace | Fuentes | depends_on |
|---|---|---|---|
| `technical_specs` | Ficha técnica completa | ultimatespecs, km77 fichas | — |
| `real_consumption` | Consumo real medido | km77 prueba, Motor1 | technical_specs |
| `press_review` | Reviews de prensa | km77, Motor1, CarWow, AutoBild | — |
| `ncap` | Seguridad Euro NCAP | euroncap.com | — |
| `owner_opinions` | Opinión de propietarios | Forocoches, Reddit, foros | — |
| `market_price` | Precio real de mercado | concesionarios, coches.net | technical_specs |
| `competitive_analysis` | Posicionamiento vs. competidores | otros PipelineRuns | technical_specs, market_price |
| `final_decision` | Decisión final del skill | principios + todos los pasos | todos |

---

## 3. Flujo de Trabajo

### 3.1 Iniciar un nuevo análisis

```
1. Verificar si ya existe un PipelineRun para este vehículo:
   GET /api/v1/pipelines/runs/?pipeline_type=vehicle_analysis
   Buscar por subject_data.brand + subject_data.model + subject_data.year

2. Si no existe, crear el run:
   POST /api/v1/pipelines/runs/
   {
     "pipeline_type": "vehicle_analysis",
     "subject_type": "vehicle",
     "subject_data": {"brand": "Ford", "model": "Kuga", "year": 2025, "trim": "Active X"},
     "skill_version": "car-configurator-preferences v2.0"
   }
   → Guarda el run_id devuelto en memoria de sesión

3. Ejecutar los pasos en orden de dependencias (ver tabla sección 2)
```

### 3.2 Ejecutar un paso

Para cada paso:

```
1. Consultar la fuente externa (km77, euroncap, etc.)
2. Guardar la fuente con su caché:
   POST /api/v1/pipelines/runs/{run_id}/steps/{step_type}/sources/
   {
     "source_name": "km77",
     "source_url": "https://www.km77.com/...",
     "raw_content": "texto completo leído",
     "structured_data": { <datos extraídos en JSON> },
     "notes": "Prueba publicada 2025-02-18"
   }

3. Marcar el paso como completado con el resultado procesado:
   PATCH /api/v1/pipelines/runs/{run_id}/steps/{step_type}
   {
     "status": "completed",
     "structured_result": { <datos consolidados del paso> }
   }
```

### 3.3 Relanzar un paso específico

```
POST /api/v1/pipelines/runs/{run_id}/steps/{step_type}/rerun
→ Marca el paso como "stale"
→ Propaga "stale" a todos los pasos dependientes automáticamente
→ Ejecutar el paso de nuevo (sección 3.2)
→ Los pasos dependientes también deben re-ejecutarse
```

### 3.4 Relanzar el pipeline completo

```
POST /api/v1/pipelines/runs/{run_id}/rerun
→ Marca todos los pasos como "stale"
→ Ejecutar todos los pasos en orden
```

---

## 4. Structured Data por Paso

Datos JSON que debe contener `structured_result` de cada paso:

**technical_specs:**
```json
{
  "horsepower": 184, "torque_nm": 200, "drivetrain": "AWD",
  "fuel_type": "FHEV", "gearbox": "eCVT",
  "acceleration_0_100": 8.3, "top_speed_kmh": 196,
  "length_mm": 4645, "width_mm": 1882, "height_mm": 1683,
  "wheelbase_mm": 2711, "boot_liters": 412, "seats": 5,
  "co2_gkm": 132, "dgt_label": "ECO",
  "wheel_size_inches": 19, "headlights_type": "LED Matricial",
  "adas_features": ["Frenado emergencia", "Control crucero adaptativo"]
}
```

**real_consumption:**
```json
{
  "real_consumption": 6.4, "source": "km77",
  "wltp_consumption": 5.8, "deviation_pct": 10.3,
  "test_conditions": "uso mixto ciudad-carretera"
}
```

**press_review** (un objeto por fuente):
```json
{
  "source": "km77", "rating": 7.5,
  "pros": ["Tracción AWD", "Sistema híbrido silencioso"],
  "cons": ["Dirección asistida excesiva", "Pedal freno poco progresivo"],
  "verdict": "SUV equilibrado para uso familiar",
  "avg_rating": 7.8
}
```

**ncap:**
```json
{
  "stars": 5, "year": 2019,
  "adult_pct": 92, "child_pct": 86,
  "pedestrian_pct": 82, "safety_assist_pct": 73
}
```

**owner_opinions:**
```json
{
  "rating": 8.1, "sample_size": 45,
  "sources": ["Forocoches", "Reddit r/Ford"],
  "common_complaints": ["Lag SYNC 4", "Pedal freno"],
  "common_praises": ["Consumo real", "Confort viaje"]
}
```

**market_price:**
```json
{
  "list_price_eur": 47886, "typical_discount_pct": 8,
  "estimated_street_price_eur": 44055,
  "renting_monthly_eur": 520,
  "maintenance_annual_eur": 350
}
```

**competitive_analysis:**
```json
{
  "main_competitors": ["Toyota RAV4 FHEV AWD", "VW Tiguan eHybrid"],
  "price_vs_competitors": "precio_similar",
  "advantage": "Único FHEV AWD sin dependencia de carga en el segmento",
  "disadvantage": "Maletero más pequeño que RAV4 (412 vs 580 l)"
}
```

**final_decision:**
```json
{
  "recommended": true,
  "recommended_trim": "Active X",
  "recommended_engine": "2.5 FHEV 184 CV AWD",
  "reasoning": "Cumple todos los principios del skill...",
  "score": 8.2,
  "verdict": "Mejor opción del segmento sin carga diaria"
}
```

---

## 5. Flujo Post-Análisis: Oferta de Comparativa

Al finalizar el pipeline completo, preguntar siempre:

> ¿Quieres que compare este análisis con otro modelo? Indícame cuál y creo un nuevo pipeline para comparar ambos.

---

## 6. Configuración de la API

- **Base URL:** `https://carr-production.up.railway.app`
- **Auth:** header `X-API-Key: <API_KEY>` — el valor se configura como variable de entorno en el cliente. Nunca debe quedar versionado en este archivo. Si has rotado la key en Railway, sustitúyela sólo en tu entorno local o gestor de secretos.
- **Docs:** `https://carr-production.up.railway.app/docs`

Si la API no está disponible, continuar el análisis sin persistir y notificar brevemente al usuario.
