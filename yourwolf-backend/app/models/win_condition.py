"""WinCondition model definition."""

import uuid

from app.database import Base
from app.models.types import JSONB, UUID
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class WinCondition(Base):
    """Win condition for a role.

    Defines how a role wins the game. A role can have multiple win conditions,
    with one being primary.

    Attributes:
        id: Unique identifier (UUID).
        role_id: Foreign key to Role.
        condition_type: Type of win condition (team_wins, special_win_dead, etc.).
        condition_params: Additional parameters for the condition.
        is_primary: Whether this is the main win condition.
        overrides_team: Whether this wins independent of team.
    """

    __tablename__ = "win_conditions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    condition_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    condition_params: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    overrides_team: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Relationships
    role: Mapped["Role"] = relationship(  # noqa: F821
        "Role",
        back_populates="win_conditions",
    )

    def __repr__(self) -> str:
        """String representation of WinCondition."""
        return f"<WinCondition(id={self.id}, type={self.condition_type})>"
