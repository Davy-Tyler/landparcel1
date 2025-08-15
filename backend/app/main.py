from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from dotenv import load_dotenv
import logging
from sqlalchemy import text, inspect
from sqlalchemy.exc import SQLAlchemyError

from app.api.endpoints import users, plots, orders, auth
from app.core.config import settings
from app.db.session import engine
from app.db.models import Base

logger = logging.getLogger("app.main")

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

@app.on_event("startup")
async def startup_diagnostics():
    """Log DB connectivity & schema presence (non-intrusive)."""
    if os.getenv("SKIP_DB_CHECK") == "1":
        logger.info("Startup DB diagnostics skipped (SKIP_DB_CHECK=1)")
        return
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        logger.warning("DATABASE_URL not set; skipping DB diagnostics")
        return
    safe = db_url
    if "@" in db_url:
        left, right = db_url.split("@", 1)
        if "//" in left:
            scheme, auth = left.split("//", 1)
            user_part = auth.split(":")[0]
            safe = f"{scheme}//{user_part}:***@{right}"
    logger.info("DB diagnostics: attempting connect (%s)", safe)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            logger.info("DB ping OK")
            insp = inspect(conn)
            existing = insp.get_table_names()
            expected = [t.name for t in Base.metadata.sorted_tables]
            missing = [t for t in expected if t not in existing]
            logger.info("Existing tables (%d): %s", len(existing), ", ".join(existing) or "<none>")
            if missing:
                logger.warning("Missing expected tables: %s", ", ".join(missing))
                if any('pooler' in seg for seg in db_url.split('/')):
                    logger.warning("Pooler host in use; create schema via migrations / Supabase SQL (CREATE TABLE may be blocked).")
            else:
                logger.info("All expected tables present")
    except SQLAlchemyError as e:
        logger.error("DB diagnostics FAILED: %s", e)
    except Exception as e:  # noqa: BLE001
        logger.exception("Unexpected error in diagnostics: %s", e)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )