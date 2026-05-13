# Gestión de Migraciones — Car Analytics API

Las migraciones de base de datos se gestionan con **Alembic**. Cada deploy en Railway ejecuta automáticamente `alembic upgrade head` antes de arrancar la API.

## Flujo para añadir nuevos campos

### 1. Modificar los modelos

Editar los archivos en este orden:
1. `app/domain/models.py` — añadir el campo al dataclass
2. `app/db/entities.py` — añadir la columna SQLAlchemy
3. `app/db/translators.py` — el mapeo genérico lo recoge automáticamente
4. `app/api/v1/schemas.py` — añadir el campo al schema Pydantic

### 2. Generar la migración automáticamente

```bash
# Desde el directorio api/
DATABASE_URL="postgresql://..." alembic revision --autogenerate -m "descripcion_del_cambio"
```

Alembic compara los modelos con el esquema actual de la BD y genera el SQL necesario.

### 3. Revisar la migración generada

```bash
cat migrations/versions/<revision_id>_descripcion.py
```

Verificar que el `upgrade()` y `downgrade()` son correctos antes de hacer commit.

### 4. Hacer commit y push

```bash
git add migrations/
git commit -m "feat: add migration for <descripcion>"
git push origin main
```

Railway detecta el push, construye la imagen Docker y ejecuta `alembic upgrade head` automáticamente antes de arrancar la API.

## Comandos útiles

```bash
# Ver el estado actual de las migraciones
DATABASE_URL="..." alembic current

# Ver el historial de migraciones
DATABASE_URL="..." alembic history

# Aplicar todas las migraciones pendientes
DATABASE_URL="..." alembic upgrade head

# Revertir la última migración
DATABASE_URL="..." alembic downgrade -1

# Generar migración vacía (para SQL manual)
DATABASE_URL="..." alembic revision -m "descripcion"
```

## Importante

- **Nunca** modificar migraciones ya aplicadas en producción.
- **Siempre** generar una nueva migración para cada cambio de esquema.
- El archivo `alembic_version` en la BD registra qué migraciones están aplicadas.
