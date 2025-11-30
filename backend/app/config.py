from __future__ import annotations
import os
from datetime import timedelta
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env files (backend/.env then backend/app/.env)
APP_DIR = os.path.dirname(__file__)
BASE_DIR = os.path.abspath(os.path.join(APP_DIR, os.pardir))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(APP_DIR, ".env"))


class Settings(BaseModel):
    app_name: str = "AI Learning Coach Backend"
    secret_key: str = os.getenv("SECRET_KEY", "change-this-in-prod-very-secret")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))
    database_url_env: str | None = os.getenv("DATABASE_URL")
    # Example SQL Server URL (ODBC Driver 17/18):
    # mssql+pyodbc://USER:PASSWORD@SERVER\nINSTANCENAME/DATABASE?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes

    # Compute SQLite DB path inside backend folder by default
    @property
    def database_url(self) -> str:
        # If DATABASE_URL is provided, use it (e.g., SQL Server via pyodbc)
        if self.database_url_env:
            return self.database_url_env
        # Otherwise fallback to SQLite file next to backend/
        db_path = os.path.join(BASE_DIR, "ai_coach.db")
        return f"sqlite:///{db_path}"

    @property
    def token_expire_delta(self) -> timedelta:
        return timedelta(minutes=self.access_token_expire_minutes)


settings = Settings()
