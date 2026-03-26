"""GameRole model definition for role assignments within a game."""

import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.role import Team
from app.models.types import UUID


class GameRole(Base):
    """Junction linking a GameSession to a Role with position and state.

    Attributes:
        id: Unique identifier (UUID).
        game_session_id: Foreign key to GameSession.
        role_id: Foreign key to Role.
        position: Player position (0-indexed) or center card index.
        is_center: Whether this card is in the center.
        current_team: Team affiliation (can change during game).
        is_flipped: Whether the card has been flipped face-up.
    """

    __tablename__ = "game_roles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    game_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        ForeignKey("game_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        ForeignKey("roles.id"),
        nullable=False,
    )
    position: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    is_center: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    current_team: Mapped[Team | None] = mapped_column(
        Enum(Team),
        nullable=True,
    )
    is_flipped: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Relationships
    game_session: Mapped["GameSession"] = relationship(  # noqa: F821
        "GameSession",
        back_populates="game_roles",
    )
    role: Mapped["Role"] = relationship(  # noqa: F821
        "Role",
    )

    def __repr__(self) -> str:
        """String representation of GameRole."""
        return (
            f"<GameRole(id={self.id}, role_id={self.role_id}, "
            f"position={self.position}, is_center={self.is_center})>"
        )
