from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
import requests
import jwt as pyjwt

from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.crud.crud_user import get_user_by_email, create_user
from app.db.session import get_db
from app.schemas.token import Token
from app.schemas.user import UserCreate, User

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """Login endpoint - Legacy support for direct password login."""
    user = get_user_by_email(db, email=form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Please register first or use Supabase authentication.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Skip password verification for users created via Supabase
    if user.hashed_password == 'supabase-auth':
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses Supabase authentication. Please login through the app.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, str(user.hashed_password)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/validate-supabase", response_model=User)
async def validate_supabase_token(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Validate Supabase JWT token and return user info."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.split(" ")[1]
    
    try:
        # Decode without verification for now (in production, verify with Supabase public key)
        payload = pyjwt.decode(token, options={"verify_signature": False})
        email = payload.get("email")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Get or create user in our database
        user = get_user_by_email(db, email=email)
        if not user:
            # Create user with placeholder password
            user_data = UserCreate(
                email=email,
                first_name=payload.get("user_metadata", {}).get("first_name", ""),
                last_name=payload.get("user_metadata", {}).get("last_name", ""),
                phone_number=payload.get("user_metadata", {}).get("phone_number"),
                password="supabase-auth"  # Placeholder
            )
            user = create_user(db, user_data)
        
        return user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

@router.post("/register", response_model=User)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register new user."""
    # Check if user already exists
    existing_user = get_user_by_email(db, email=user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = create_user(db, user_data)
    return user