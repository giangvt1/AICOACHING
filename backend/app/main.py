from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from .seed import ensure_seed

from .routers import auth, profile, catalog, diagnostic, analysis, learning_path, sessions, progress, questions, assistant
# Admin routers commented out (not in MVP scope)
# from .routers import admin, admin_auth
from .chat import router as chat_router
from .ai import router as ai_router

app = FastAPI(title="AI Learning Coach Backend", version="0.1.0")

# Allow all origins during development; tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Create tables (SQLite) and seed basic data for demo
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        ensure_seed(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "AI Learning Coach Backend is running"}


# Routers
app.include_router(auth.router)

# ====== Admin Routes (DISABLED - Not in MVP scope per KHKT report) ======
# Admin portal is disabled to focus on student-facing features only
# Uncomment below if admin features are needed in future
# app.include_router(admin_auth.router)
# app.include_router(admin.router)

app.include_router(profile.router)
app.include_router(catalog.router)
app.include_router(diagnostic.router)
app.include_router(analysis.router)
app.include_router(learning_path.router)
# app.include_router(schedule.router)  # ✅ Removed: No longer using schedule feature
app.include_router(sessions.router)
app.include_router(progress.router)
app.include_router(questions.router)
app.include_router(assistant.router)
app.include_router(admin.router)
app.include_router(chat_router)
app.include_router(ai_router)
