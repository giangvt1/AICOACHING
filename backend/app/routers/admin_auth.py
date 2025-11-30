"""
Admin Authentication Router
Separate login endpoint for administrators
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Admin
from ..schemas import AdminToken, AdminRead
from ..security import verify_password, create_access_token
from ..dependencies import get_current_admin
from ..config import settings

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


@router.post("/login", response_model=AdminToken)
def admin_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Admin login endpoint.
    Separate from student login.
    """
    # Find admin by email
    admin = db.query(Admin).filter(Admin.email == form_data.username).first()
    
    if not admin or not verify_password(form_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    from datetime import datetime
    admin.last_login = datetime.utcnow()
    db.commit()
    
    # Create token with user_type="admin"
    access_token = create_access_token(
        subject=admin.email,
        expires_delta=timedelta(hours=24),
        user_type="admin"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_type": "admin"
    }


@router.get("/me", response_model=AdminRead)
def get_admin_profile(
    current_admin: Admin = Depends(get_current_admin),
):
    """Get current admin profile"""
    return current_admin

