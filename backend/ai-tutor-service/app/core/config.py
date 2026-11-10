from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "AI Tutor Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # LLM Settings (Gemini)
    GEMINI_API_KEY: str = Field(..., validation_alias="GEMINI_API_KEY")
    GEMINI_MODEL: str = Field(default="gemini-3.5-flash-lite", validation_alias="GEMINI_MODEL")
    
    # External Services
    COURSE_SERVICE_URL: str = Field(default="http://course-service:8001", validation_alias="COURSE_SERVICE_URL")
    ANALYTICS_SERVICE_URL: str = Field(default="http://analytics-service:8003", validation_alias="ANALYTICS_SERVICE_URL")
    
    # JWT Settings
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    
    # Configuration for loading from .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding='utf-8',
        case_sensitive=True,
        extra='ignore'
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
