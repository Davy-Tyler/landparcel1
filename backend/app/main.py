from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from dotenv import load_dotenv

from app.api.endpoints import users, plots, orders, auth
from app.core.config import settings
from app.db.session import engine
from app.db.models import Base

# Load environment variables
load_dotenv()

# Don't create tables automatically since we're using existing Supabase database
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Real Estate Platform API",
    description="A comprehensive real estate platform for Tanzania",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(plots.router, prefix="/api/plots", tags=["plots"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])

@app.get("/")
async def root():
    return {"message": "Real Estate Platform API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )