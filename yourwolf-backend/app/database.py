"""Database connection and session management."""

from collections.abc import Generator
from functools import cache
from typing import Any

from app.config import get_settings
from app.models.base import Base
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

__all__ = ["Base", "get_db", "get_engine", "get_session_factory"]


@cache
def get_engine() -> Engine:
    """Return the database engine, creating it once on first use.

    Returns:
        Engine: The cached SQLAlchemy engine.
    """
    settings = get_settings()
    return create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=settings.ENVIRONMENT == "development",
    )


@cache
def get_session_factory() -> sessionmaker[Session]:
    """Return the session factory, creating it once on first use.

    Returns:
        sessionmaker[Session]: The cached session factory bound to the engine.
    """
    return sessionmaker(autocommit=False, autoflush=False, bind=get_engine())


def get_db() -> Generator[Session, Any, None]:
    """Dependency that provides a database session.

    Yields:
        Session: SQLAlchemy database session.
    """
    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()
