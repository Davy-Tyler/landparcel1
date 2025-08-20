import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database - Updated for Supabase Transaction Pooler
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres.kziekhazhvszdfgrekre:Landhub101@aws-1-eu-north-1.pooler.supabase.com:6543/postgres"
    )
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Real Estate Platform"
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]
    ALLOWED_ORIGINS: Optional[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: Optional[str] = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Celery Configuration
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    
    # WebSocket Configuration
    WEBSOCKET_PORT: int = int(os.getenv("WEBSOCKET_PORT", "8001"))
    
    # Pooler-specific notes
    # Note: This pooler does not support PREPARE statements
    # Ideal for stateless applications like serverless functions
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"  # Ignore extra environment variables

settings = Settings()