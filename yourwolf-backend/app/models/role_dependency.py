"""RoleDependency model for expressing inter-role relationships."""

import enum
import uuid

from app.database import Base
from app.models.types import UUID
from sqlalchemy import Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship


class DependencyType(str, enum.Enum):
    """Type of dependency between roles."""

    REQUIRES = "requires"
    RECOMMENDS = "recommends"


class RoleDependency(Base):
    """A dependency from one role to another.

    Expresses that a source role depends on a target role being present
    in the game. Dependencies can be hard requirements (the game cannot
    be created without the target) or soft recommendations (a warning is
    returned but the game is still allowed).

    Attributes:
        id: Unique identifier (UUID).
        role_id: The role that has the dependency.
        required_role_id: The role that is depended upon.
        dependency_type: requires (hard) or recommends (soft).
    """

    __tablename__ = "role_dependencies"
    __table_args__ = (
        UniqueConstraint(
            "role_id",
            "required_role_id",
            name="uq_role_dependency_pair",
        ),
    )

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
    required_role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False,
    )
    dependency_type: Mapped[DependencyType] = mapped_column(
        Enum(DependencyType),
        nullable=False,
    )

    # Relationships
    role: Mapped["Role"] = relationship(  # noqa: F821
        "Role",
        foreign_keys=[role_id],
        back_populates="dependencies",
    )
    required_role: Mapped["Role"] = relationship(  # noqa: F821
        "Role",
        foreign_keys=[required_role_id],
        back_populates="required_by",
    )

    def __repr__(self) -> str:
        """String representation of RoleDependency."""
        return (
            f"<RoleDependency(role_id={self.role_id}, "
            f"required_role_id={self.required_role_id}, "
            f"type={self.dependency_type})>"
        )
