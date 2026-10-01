from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vision-Based Intelligent Parking Occupancy & Management System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecret-jwt-key-replace-in-production-smartparking2026"
    PHONEPE_WEBHOOK_SECRET: str = ""
    DEMO_MODE: bool = True
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/smart_parking_db"
    
    # Parking Configuration
    TOTAL_SLOTS: int = 20
    BASE_HOURLY_RATE: float = 20.0
    MINIMUM_FEE: float = 30.0
    GRACE_PERIOD_MINUTES: int = 15
    
    # AI Engine
    CONFIDENCE_THRESHOLD: float = 0.85
    OCR_ENGINE: str = "easyocr"  # or 'paddleocr', 'mock'
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "*"]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
