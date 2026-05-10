from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/mxo_track"

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "MXO Track API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = (
        "API de persistencia para análisis de vehículos generados con el skill "
        "car-configurator-preferences. Almacena análisis, comparativas, fuentes "
        "de reviews y datos de negocio para su explotación futura."
    )

    # Security
    API_KEY: str = "change-me-in-production"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
