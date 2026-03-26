"""Custom SQLAlchemy types for cross-database compatibility."""

from sqlalchemy import JSON, String, TypeDecorator
from sqlalchemy.dialects.postgresql import JSONB as PostgresJSONB
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
import uuid as uuid_module


class JSONB(TypeDecorator):
    """JSONB type that falls back to JSON for non-PostgreSQL databases.

    Uses PostgreSQL's native JSONB for production, but falls back to
    standard JSON for SQLite testing.
    """

    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        """Load the appropriate dialect implementation."""
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PostgresJSONB())
        return dialect.type_descriptor(JSON())


class UUID(TypeDecorator):
    """UUID type that works with both PostgreSQL and SQLite.

    Uses PostgreSQL's native UUID for production, but falls back to
    String(36) for SQLite testing.
    """

    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        """Load the appropriate dialect implementation."""
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PostgresUUID(as_uuid=True))
        return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        """Convert UUID to string for storage."""
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        if isinstance(value, uuid_module.UUID):
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        """Convert stored value back to UUID."""
        if value is None:
            return value
        if isinstance(value, uuid_module.UUID):
            return value
        return uuid_module.UUID(value)
