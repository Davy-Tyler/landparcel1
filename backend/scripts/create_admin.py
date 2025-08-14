#!/usr/bin/env python3
"""
Script to create initial admin users.
Run this after setting up the database.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import User, UserRole
from app.core.security import get_password_hash

def create_admin_user():
    """Create initial admin users."""
    db: Session = SessionLocal()
    
    try:
        # Check if master admin already exists
        existing_admin = db.query(User).filter(
            User.role == UserRole.MASTER_ADMIN
        ).first()
        
        if existing_admin:
            print("Master admin already exists!")
            return
        
        # Create master admin
        master_admin = User(
            first_name="Master",
            last_name="Admin",
            email="admin@realestate.com",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.MASTER_ADMIN,
            is_active=True
        )
        
        db.add(master_admin)
        db.commit()
        
        print("Master admin created successfully!")
        print("Email: admin@realestate.com")
        print("Password: admin123")
        print("Please change the password after first login!")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()