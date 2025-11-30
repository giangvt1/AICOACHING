from __future__ import annotations
from datetime import datetime
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str, expires_delta, user_type: str = "student") -> str:
    """
    Create JWT access token.
    
    Args:
        subject: User email
        expires_delta: Token expiration time
        user_type: Either "student" or "admin"
    """
    to_encode = {
        "sub": subject,
        "user_type": user_type,
        "exp": datetime.utcnow() + expires_delta,
        "scope": "access_token",
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[tuple[str, str]]:
    """
    Decode access token and return (email, user_type) tuple.
    
    Returns:
        (email, user_type) tuple or None if token is invalid
        user_type will be either "student" or "admin"
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        if payload.get("scope") != "access_token":
            return None
        email = payload.get("sub")
        user_type = payload.get("user_type", "student")
        return (email, user_type) if email else None
    except JWTError:
        return None
