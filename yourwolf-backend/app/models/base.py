"""Declarative base for all SQLAlchemy models.

Defined here rather than in ``app.database`` so that importing a model does
not trigger database engine creation.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass
