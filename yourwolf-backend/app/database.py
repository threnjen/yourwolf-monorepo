"""Database connection and session management."""

from collections.abc import Generator
from typing import Any

from app.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.ENVIRONMENT == "development",
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


def get_db() -> Generator[Session, Any, None]:
    """Dependency that provides a database session.

    Yields:
        Session: SQLAlchemy database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
