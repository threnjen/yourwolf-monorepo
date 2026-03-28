"""Ability model definition for ability primitives."""

import uuid
from datetime import datetime
from typing import Any

from app.database import Base
from app.models.types import JSONB, UUID
from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Ability(Base):
    """Predefined ability primitive.

    Abilities are system-defined primitives that users compose into roles
    via AbilityStep. Users cannot create new abilities.

    Attributes:
        id: Unique identifier (UUID).
        type: Ability type string (unique, e.g., 'view_card').
        name: Human-readable name.
        description: What this ability does.
        parameters_schema: JSON Schema defining required/optional params.
        is_active: Whether ability is available for use.
        created_at: Creation timestamp.
    """

    __tablename__ = "abilities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    type: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    parameters_schema: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    ability_steps: Mapped[list["AbilityStep"]] = relationship(  # noqa: F821
        "AbilityStep",
        back_populates="ability",
    )

    def __repr__(self) -> str:
        """String representation of Ability."""
        return f"<Ability(id={self.id}, type={self.type})>"
