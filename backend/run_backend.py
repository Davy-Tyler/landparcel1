"""Convenience launcher for the FastAPI backend with diagnostics.

Run from repo root:
    python -m backend.run_backend
Or:
    python backend/run_backend.py

Environment variables:
  DATABASE_URL         Postgres connection string (Supabase DB)
  BACKEND_LOG_LEVEL    Logging level (INFO/DEBUG/WARNING...)
  SKIP_DB_CHECK=1      Skip the startup DB connectivity test
"""

from __future__ import annotations
import os
import logging
import uvicorn

LOG_LEVEL = os.getenv("BACKEND_LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
)

from app.main import app  # noqa: E402


def main():
    logger = logging.getLogger("run_backend")
    db_url = os.getenv("DATABASE_URL", "<missing>")
    if db_url != "<missing>":
        safe = db_url
        if "@" in db_url:
            left, right = db_url.split("@", 1)
            if "//" in left:
                scheme, auth = left.split("//", 1)
                user_part = auth.split(":")[0]
                safe = f"{scheme}//{user_part}:***@{right}"
        logger.info("Using DATABASE_URL=%s", safe)
    else:
        logger.warning("DATABASE_URL not set; DB endpoints will fail")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
        log_level=LOG_LEVEL.lower(),
    )


if __name__ == "__main__":  # pragma: no cover
    main()
