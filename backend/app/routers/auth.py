from __future__ import annotations
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student
from ..schemas import StudentCreate, StudentRead, Token
from ..security import hash_password, verify_password, create_access_token
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=StudentRead)
def register(payload: StudentCreate, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    existing: Optional[Student] = db.query(Student).filter(Student.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    student = Student(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Student login endpoint.
    For admin login, use /admin/auth/login
    """
    # OAuth2PasswordRequestForm uses 'username' field; we treat it as email
    email = form_data.username.lower().strip()
    student: Optional[Student] = db.query(Student).filter(Student.email == email).first()
    if not student or not verify_password(form_data.password, student.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token(student.email, settings.token_expire_delta, user_type="student")
    return Token(access_token=token, user_type="student")
