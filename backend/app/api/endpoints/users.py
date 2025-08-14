from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_master_admin_user
from app.crud.crud_user import get_users, get_user, update_user
from app.db.session import get_db
from app.schemas.user import User, UserUpdate
from app.db.models import User as UserModel

router = APIRouter()

@router.get("/me", response_model=User)
async def read_current_user(
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get current user profile."""
    return current_user

@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """Update current user profile."""
    return update_user(db, current_user.id, user_update)

@router.get("/", response_model=List[User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_master_admin_user)
):
    """Get all users (master admin only)."""
    return get_users(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_master_admin_user)
):
    """Get user by ID (master admin only)."""
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user