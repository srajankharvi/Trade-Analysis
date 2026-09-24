from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "tradejournal"

    JWT_SECRET: str = "change-me-to-a-secure-random-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    MAX_UPLOAD_SIZE: int = 5242880  # 5 MB

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
