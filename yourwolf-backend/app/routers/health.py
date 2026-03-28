"""Health check endpoints."""

from app.database import get_db
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Basic health check endpoint.

    Returns:
        Dictionary with health status.
    """
    return {"status": "healthy"}


@router.get("/health/db", response_model=None)
async def database_health_check(
    db: Session = Depends(get_db),
) -> dict[str, str] | JSONResponse:
    """Database connectivity health check.

    Args:
        db: Database session dependency.

    Returns:
        Dictionary with database connection status.
        Returns 503 if the database is unreachable.
    """
    try:
        db.execute(text("SELECT 1"))
        return {"status": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "disconnected"},
        )
