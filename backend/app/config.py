"""Settings, read from environment variables or backend/.env."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./data/fireflies.db"
    cors_origins: list[str] = ["http://localhost:3000"]

    # There is no login, so the signed-in user comes from configuration.
    demo_user_name: str = "Siddartha Nepal"
    demo_user_email: str = "siddartha.nepal@example.com"

    # Optional. Without a key, summaries and AskFred answers use simple built-in rules.
    google_api_key: str | None = None
    gemini_model: str = "gemini-flash-latest"


@lru_cache
def get_settings() -> Settings:
    return Settings()
