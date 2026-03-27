"""Role model definition with Team and Visibility enums."""

import enum
import uuid
from datetime import datetime

from app.database import Base
from app.models.types import UUID
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Team(str, enum.Enum):
    """Team affiliation for roles."""

    VILLAGE = "village"
    WEREWOLF = "werewolf"
    VAMPIRE = "vampire"
    ALIEN = "alien"
    NEUTRAL = "neutral"


class Visibility(str, enum.Enum):
    """Visibility level for roles."""

    PRIVATE = "private"
    PUBLIC = "public"
    OFFICIAL = "official"


class Role(Base):
    """Game role (character) with abilities.

    Attributes:
        id: Unique identifier (UUID).
        name: Role name.
        description: Flavor text / card description.
        team: Starting team affiliation.
        wake_order: When role wakes during night (null = doesn't wake).
        wake_target: Who wakes with this role.
        votes: Number of votes this role gets (default: 1).
        creator_id: Foreign key to User (null for official roles).
        visibility: private/public/official.
        is_locked: Cannot be edited (published).
        vote_score: Upvotes minus downvotes.
        use_count: Times used in games.
        default_count: Cards added when selecting this role (default 1).
        min_count: Minimum copies if included in a game (default 1).
        max_count: Maximum copies allowed in a game (default 1).
        created_at: Creation timestamp.
        updated_at: Last update timestamp.
        published_at: Publication timestamp.
    """

    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    team: Mapped[Team] = mapped_column(
        Enum(Team),
        nullable=False,
        index=True,
    )
    wake_order: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    wake_target: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    votes: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    creator_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    visibility: Mapped[Visibility] = mapped_column(
        Enum(Visibility),
        default=Visibility.PRIVATE,
        nullable=False,
        index=True,
    )
    is_locked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    vote_score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        index=True,
    )
    use_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    default_count: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    min_count: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    max_count: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    is_primary_team_role: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    creator: Mapped["User | None"] = relationship(  # noqa: F821
        "User",
        back_populates="roles",
    )
    ability_steps: Mapped[list["AbilityStep"]] = relationship(  # noqa: F821
        "AbilityStep",
        back_populates="role",
        cascade="all, delete-orphan",
        order_by="AbilityStep.order",
    )
    win_conditions: Mapped[list["WinCondition"]] = relationship(  # noqa: F821
        "WinCondition",
        back_populates="role",
        cascade="all, delete-orphan",
    )
    dependencies: Mapped[list["RoleDependency"]] = relationship(  # noqa: F821
        "RoleDependency",
        foreign_keys="RoleDependency.role_id",
        back_populates="role",
        cascade="all, delete-orphan",
    )
    required_by: Mapped[list["RoleDependency"]] = relationship(  # noqa: F821
        "RoleDependency",
        foreign_keys="RoleDependency.required_role_id",
        back_populates="required_role",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        """String representation of Role."""
        return f"<Role(id={self.id}, name={self.name}, team={self.team})>"
