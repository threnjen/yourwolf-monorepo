"""GameSession model definition with GamePhase enum."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.types import UUID


class GamePhase(str, enum.Enum):
    """Phase of a game session."""

    SETUP = "setup"
    NIGHT = "night"
    DISCUSSION = "discussion"
    VOTING = "voting"
    RESOLUTION = "resolution"
    COMPLETE = "complete"


class GameSession(Base):
    """A single game session tracking state through phases.

    Attributes:
        id: Unique identifier (UUID).
        facilitator_id: Foreign key to User running the game (nullable).
        player_count: Number of players in the game.
        center_card_count: Number of center cards.
        discussion_timer_seconds: Discussion phase duration in seconds.
        phase: Current game phase.
        current_wake_order: Index into night wake sequence.
        created_at: Creation timestamp.
        started_at: When game started (entered night phase).
        ended_at: When game completed.
    """

    __tablename__ = "game_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    facilitator_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    player_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    center_card_count: Mapped[int] = mapped_column(
        Integer,
        default=3,
        nullable=False,
    )
    discussion_timer_seconds: Mapped[int] = mapped_column(
        Integer,
        default=300,
        nullable=False,
    )
    phase: Mapped[GamePhase] = mapped_column(
        Enum(GamePhase),
        default=GamePhase.SETUP,
        nullable=False,
        index=True,
    )
    current_wake_order: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    game_roles: Mapped[list["GameRole"]] = relationship(  # noqa: F821
        "GameRole",
        back_populates="game_session",
        cascade="all, delete-orphan",
    )
    facilitator: Mapped["User | None"] = relationship(  # noqa: F821
        "User",
    )

    def __repr__(self) -> str:
        """String representation of GameSession."""
        return (
            f"<GameSession(id={self.id}, phase={self.phase}, "
            f"players={self.player_count})>"
        )
