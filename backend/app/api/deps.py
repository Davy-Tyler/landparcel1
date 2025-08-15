from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.supabase_jwt import verify_supabase_token, extract_user_email, extract_user_id
from app.crud.crud_user import get_user_by_email, get_user
from app.db.models import User, UserRole
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Placeholder for hashed_password when using Supabase auth
SUPABASE_AUTH_PLACEHOLDER = 'supabase-auth'

def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user via Supabase JWT."""
    try:
        # Verify Supabase JWT token
        payload = verify_supabase_token(credentials.credentials)
        user_id = extract_user_id(payload)
        email = extract_user_email(payload)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    # Try to get user by ID first (primary key), then by email
    user = get_user(db, user_id=user_id)
    if not user:
        user = get_user_by_email(db, email=email)
    
    # Self-heal: create user row if it doesn't exist
    if not user:
        try:
            from app.crud.crud_user import create_user_from_auth
            from app.schemas.user import UserCreateFromAuth
            
            user_data = UserCreateFromAuth(
                id=user_id,
                email=email,
                first_name=payload.get("user_metadata", {}).get("first_name"),
                last_name=payload.get("user_metadata", {}).get("last_name"),
                phone_number=payload.get("user_metadata", {}).get("phone_number"),
            )
            user = create_user_from_auth(db, user_data)
            logger.info(f"Created user record for {email}")
        except Exception as e:
            logger.error(f"Failed to create user record for {email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user record"
            )
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def get_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current admin user."""
    if current_user.role.value not in [UserRole.ADMIN.value, UserRole.MASTER_ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

def get_master_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """Get current master admin user."""
    if current_user.role.value != UserRole.MASTER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user