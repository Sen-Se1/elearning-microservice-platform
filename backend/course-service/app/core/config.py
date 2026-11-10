from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings
from functools import lru_cache  # Add this import

class Settings(BaseSettings):
    # App
    app_name: str = Field(default="Learning Portal", validation_alias="APP_NAME")
    app_version: str = Field(default="1.0.0", validation_alias="APP_VERSION")
    debug: bool = Field(default=False, validation_alias="DEBUG")
    
    # Database
    database_url: str = Field(..., validation_alias="POSTGRES_URL")
    
    # JWT
    jwt_secret: str = Field(..., validation_alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    
    # Local Storage
    upload_dir: str = Field(default="./upload", validation_alias="UPLOAD_DIR")
    base_url: str = Field(default="http://localhost:8001", validation_alias="BASE_URL")
    
    # CORS
    cors_origins: list = ["*"]
    
    # Analytics Service
    analytics_service_url: str = Field(default="http://analytics-service:8003", validation_alias="ANALYTICS_SERVICE_URL")
    
    # n8n Automation
    n8n_webhook_url: str = Field(default="http://localhost:5678/webhook/feedback", validation_alias="N8N_FEEDBACK_WEBHOOK_URL")
    
    class Config:
        env_file = "../../.env"
        case_sensitive = False  # This allows case-insensitive matching
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()