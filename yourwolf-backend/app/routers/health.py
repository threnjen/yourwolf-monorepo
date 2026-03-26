"""Health check endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Basic health check endpoint.

    Returns:
        Dictionary with health status.
    """
    return {"status": "healthy"}


@router.get("/health/db")
async def database_health_check(
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Database connectivity health check.

    Args:
        db: Database session dependency.

    Returns:
        Dictionary with database connection status.
    """
    try:
        db.execute(text("SELECT 1"))
        return {"status": "connected"}
    except Exception as e:
        return {"status": "disconnected", "error": str(e)}
