import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AXD Backend"
    API_V1_STR: str = "/api/v1"
    
    # DATABASE_URL이 환경 변수에 없으면 로컬 SQLite 파일(axd_app.db)을 사용합니다.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./axd_app.db"
    )

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
