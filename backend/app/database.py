from __future__ import annotations
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# Engine setup supports SQLite (dev) and SQL Server via pyodbc when DATABASE_URL is provided.
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    future=True,
)

# Optional fast_executemany optimization for pyodbc on SQL Server
if settings.database_url.lower().startswith("mssql+pyodbc"):
    try:
        @event.listens_for(engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            if executemany:
                try:
                    cursor.fast_executemany = True
                except Exception:
                    pass
    except Exception:
        # Safe fallback if event registration fails
        pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
