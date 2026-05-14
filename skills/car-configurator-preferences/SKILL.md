---
name: car-configurator-preferences
description: Motor de análisis de vehículos basado en pipelines de enriquecimiento de datos. Cada análisis es un PipelineRun con pasos atómicos (ficha técnica, consumo real, reviews, NCAP, propietarios, precio, competencia, decisión). Cada paso guarda sus fuentes con caché versionada. Los pasos pueden relanzarse de forma independiente. Usar cuando se analice, configure o compare un vehículo.
---

# Car Configurator — Motor de Análisis por Pipelines

Este skill gestiona análisis de vehículos como **pipelines de enriquecimiento de datos**. Cada análisis es reproducible, versionado y actualizable paso a paso.

---

## 1. Principios de Configuración

### 1.1 Compromiso

Cada `vehicle_analysis` se compromete a **configurar el mejor coche posible y más óptimo** dentro del modelo elegido. Esto **no** es una opinión: el skill mantiene una lista cerrada de **características de configuración** con su **beneficio objetivo** (sección 1.2). Toda decisión final debe evaluar y justificar el cumplimiento de cada característica (sección 1.3).

### 1.2 Catálogo de características

Cada característica tiene un `id` estable (usado en `final_decision.completeness_breakdown`), un **principio** (qué hay que cumplir), un **beneficio** (por qué importa) y un **criterio de cumplimiento** (cómo se mide sobre el `structured_result` de los pasos).

| id | Principio | Beneficio (por qué) | Criterio de cumplimiento |
|---|---|---|---|
| `max_power` | Elegir siempre la motorización con mayor CV y par del modelo. | **Mejor respuesta de conducción**: adelantamientos más cortos y seguros, mejor entrada en autopista, motor menos forzado en cargas altas → menos fatiga mecánica. Define el carácter del coche y es irreversible tras la compra. | `technical_specs.horsepower == technical_specs.max_horsepower_in_range` |
| `wheels_20` | Llantas de **20"** siempre que el modelo las ofrezca. | **Mejor seguridad**: mayor superficie de contacto, frenadas más cortas, comportamiento más estable a velocidad de autovía y en curva. Además mejor estética y suspensión/frenos suelen ser superiores. | `technical_specs.wheel_size_inches == max(technical_specs.available_wheel_sizes)` y `>= 20` si el catálogo lo permite |
| `awd` | Tracción total cuando el modelo la ofrece. | **Más seguridad activa**: adherencia en lluvia/nieve/firme sucio, mejor reparto de par en aceleración. Mejor valor residual en mercado de segunda mano. | `technical_specs.drivetrain == "AWD"` si AWD está disponible en la gama |
| `matrix_led` | Faros LED matriciales o full-LED adaptativos. | **Visión nocturna superior**: más alcance, sin deslumbrar a otros conductores, reacción más rápida ante peatones/obstáculos. Reduce el riesgo de accidente nocturno. | `technical_specs.headlights_type` contiene `"Matric"`, `"Adaptativ"` o `"Full-LED"` |
| `full_adas` | Pack ADAS completo de serie. | **Reduce siniestros**: el frenado de emergencia y el control de carril son los ADAS con mayor impacto demostrado en accidentes evitados. Mejora también la puntuación NCAP. | `technical_specs.adas_features` incluye: frenado emergencia automático, control crucero adaptativo, asistente carril, reconocimiento señales |
| `top_trim` | Acabado tope de gama (ST-Line X, Active X, R-Line, GR Sport, Black Edition…). | **Mejor equipamiento de serie y materiales**, mejor estética, mejor valor residual. Suele desbloquear opciones de seguridad/comfort no disponibles en acabados bajos. | `subject_data.trim` coincide con el acabado más alto del modelo |
| `hybrid_match` | Híbrido coherente con el patrón de uso del comprador. | **Maximiza el ahorro real**: sin carga diaria un PHEV pierde sentido económico (peso muerto de batería); con carga garantizada, un PHEV potente combina silencio eléctrico urbano y potencia en viaje. | Sin carga → `fuel_type ∈ {FHEV, MHEV, BEV}`. Con carga → `fuel_type ∈ {PHEV, BEV}` y `horsepower == max_horsepower_in_range` |

> Estas características son **la única fuente de verdad** para evaluar la configuración. Cualquier otra preferencia (color, llantas específicas, packs decorativos…) es *secundaria* y **no entra en el `completeness_score`**.

### 1.3 Aplicación sobre cada análisis

Cuando un `vehicle_analysis` cierra el paso `final_decision` debe, obligatoriamente:

1. **Evaluar** las 7 características anteriores contra los `structured_result` de los pasos previos.
2. **Rellenar** `completeness_breakdown` con `true | false` por cada `id` de la sección 1.2.
3. **Calcular** `completeness_score = (#true / #aplicables) * 10`. Una característica solo se considera **no aplicable** si el catálogo del fabricante no la ofrece para ese modelo (ej. modelo sin variante AWD); en ese caso se omite del denominador en lugar de penalizar.
4. **Justificar** en `reasoning` cada `false`, diferenciando:
   - **Imposible por catálogo** → no penaliza la recomendación (ej. el modelo no ofrece 20").
   - **Decisión consciente del comprador** → sí penaliza (ej. eligió 19" disponiendo de 20").
5. **Recomendar** (`recommended = true`) solo si:
   - `completeness_score >= 7.0`
   - `max_power` y `wheels_20` están en `true` cuando son aplicables.

> **Regla de decisión rápida:** "Más CV + ruedas de 20\" + AWD + acabado tope" = el coche más completo. Cualquier desviación queda registrada y razonada en el propio análisis.

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
  "wheel_size_inches": 20, "available_wheel_sizes": [18, 19, 20],
  "max_horsepower_in_range": 243, "engine_chosen_is_top": false,
  "headlights_type": "LED Matricial",
  "adas_features": ["Frenado emergencia", "Control crucero adaptativo"]
}
```

> Incluir siempre `max_horsepower_in_range` (la motorización más potente del modelo) y `available_wheel_sizes` para que la `final_decision` pueda razonar si se ha elegido la configuración más completa.

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
  "recommended_trim": "ST-Line X",
  "recommended_engine": "2.5 PHEV 243 CV AWD",
  "recommended_wheels_inches": 20,
  "completeness_score": 9.1,
  "completeness_breakdown": {
    "max_power":    { "ok": true,  "applicable": true,  "rationale": "243 CV = tope de la gama PHEV." },
    "wheels_20":    { "ok": true,  "applicable": true,  "rationale": "20\" disponibles en ST-Line X y montadas." },
    "awd":          { "ok": true,  "applicable": true,  "rationale": "AWD elegido sobre FWD." },
    "matrix_led":   { "ok": true,  "applicable": true,  "rationale": "Faros LED matriciales de serie en acabado X." },
    "full_adas":    { "ok": true,  "applicable": true,  "rationale": "Pack ADAS completo de serie." },
    "top_trim":     { "ok": true,  "applicable": true,  "rationale": "ST-Line X es el acabado más alto." },
    "hybrid_match": { "ok": true,  "applicable": true,  "rationale": "Usuario con punto de carga → PHEV potente coherente." }
  },
  "reasoning": "Cumple las 7 características del skill: motor tope de gama, 20\", AWD, matrix LED, ADAS completo, acabado X y PHEV coherente con carga diaria.",
  "score": 8.2,
  "verdict": "Mejor opción del segmento priorizando potencia y equipamiento"
}
```

> Cada entrada de `completeness_breakdown` debe usar uno de los `id` definidos en la sección 1.2 e incluir `ok` (booleano), `applicable` (booleano, ver regla 3 de la sección 1.3) y `rationale` (texto breve justificando el valor).

---

## 5. Pipeline de Comparativa entre Vehículos

Una comparativa **NO** sustituye al análisis: lo **reutiliza**. Cada coche que entra en la comparativa debe tener primero su propio `vehicle_analysis` completo. Esto garantiza:

- Cada coche se evalúa con los mismos 8 pasos y los mismos principios.
- Las fuentes quedan versionadas en su análisis (reutilizables).
- La comparativa pasa a ser una **agregación**, no una re-ejecución.

### 5.1 Pre-requisitos antes de comparar

Para cada vehículo `V` de la lista a comparar:

1. Buscar si ya existe un `PipelineRun` tipo `vehicle_analysis` para `V` (mismo brand/model/year/trim).
2. Si **no existe**, ejecutar el pipeline de análisis completo (sección 3) antes de crear la comparativa.
3. Si **existe pero tiene pasos `stale` o `failed`**, relanzarlos antes de proceder (sección 3.3).
4. Guardar los `run_id` de cada análisis individual.

> Regla estricta: **no se crea una comparativa si falta el análisis de alguno de los coches.**

### 5.2 Crear el PipelineRun de comparativa

```
POST /api/v1/pipelines/runs/
{
  "pipeline_type": "vehicle_comparison",
  "subject_type": "vehicle_set",
  "subject_data": {
    "vehicles": [
      {
        "analysis_run_id": "<uuid del análisis A>",
        "brand": "Ford", "model": "Kuga", "year": 2025, "trim": "ST-Line X"
      },
      {
        "analysis_run_id": "<uuid del análisis B>",
        "brand": "Toyota", "model": "RAV4", "year": 2025, "trim": "GR Sport"
      }
    ],
    "comparison_axis": ["potencia", "ruedas", "precio", "ncap", "consumo_real", "valoraciones"]
  },
  "skill_version": "car-configurator-preferences v2.1"
}
```

- `subject_data.vehicles[].analysis_run_id` es **obligatorio** y permite al frontal cargar el análisis completo de cada coche como vista independiente.
- `comparison_axis` lista los ejes en los que se va a posicionar cada coche.

### 5.3 Pasos del pipeline de comparativa

Los pasos del `vehicle_comparison` **no vuelven a fetchear** datos. Cada paso lee los `structured_result` de los análisis referenciados y produce un resultado agregado:

| step_type | Qué produce | Lee de |
|---|---|---|
| `technical_specs` | Tabla side-by-side de specs clave (CV, par, ruedas, AWD, gearbox) | `technical_specs.structured_result` de cada análisis |
| `real_consumption` | Comparativa de consumo real vs WLTP | `real_consumption` de cada análisis |
| `press_review` | Media de notas + pros/cons agregados por coche | `press_review` de cada análisis |
| `ncap` | Tabla de estrellas y % por categoría | `ncap` de cada análisis |
| `owner_opinions` | Rating medio + quejas comunes por coche | `owner_opinions` de cada análisis |
| `market_price` | Precio lista, descuento típico y precio calle por coche | `market_price` de cada análisis |
| `competitive_analysis` | Posicionamiento relativo entre los coches comparados | todos los anteriores |
| `final_decision` | Veredicto final de la comparativa | todos |

### 5.4 Schema de `final_decision` para comparativa

```json
{
  "winner_analysis_run_id": "<uuid del análisis ganador>",
  "winner_label": "Ford Kuga ST-Line X 2.5 PHEV 243 CV AWD",
  "ranking": [
    { "analysis_run_id": "<uuid A>", "score": 8.6, "completeness_score": 9.1 },
    { "analysis_run_id": "<uuid B>", "score": 8.1, "completeness_score": 8.4 }
  ],
  "axis_winners": {
    "potencia": "<uuid A>",
    "ruedas": "<uuid A>",
    "precio": "<uuid B>",
    "ncap": "<uuid A>",
    "consumo_real": "<uuid B>",
    "valoraciones": "<uuid A>"
  },
  "reasoning": "Kuga gana en potencia (243 vs 222 CV), ruedas (20 vs 19) y NCAP; RAV4 gana solo en precio y consumo. Aplicando los principios del skill el ganador es Kuga."
}
```

### 5.5 Oferta post-análisis

Al cerrar un `vehicle_analysis`, preguntar siempre:

> ¿Quieres que lo compare con otro modelo? Indícame cuál. Si todavía no está analizado, primero ejecutaré su pipeline de `vehicle_analysis` y después crearé la comparativa que reutilice ambos.

---

## 6. Configuración de la API

- **Base URL:** `https://carr-production.up.railway.app`
- **Auth:** header `X-API-Key: mi-clave-secreta-car-analytics-2026`
- **Docs:** `https://carr-production.up.railway.app/docs`

Si la API no está disponible, continuar el análisis sin persistir y notificar brevemente al usuario.
