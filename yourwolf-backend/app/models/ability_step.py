"""AbilityStep model definition with StepModifier enum."""

import enum
import uuid

from app.database import Base
from app.models.types import JSONB, UUID
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class StepModifier(str, enum.Enum):
    """Modifier for how an ability step relates to the previous step."""

    NONE = "none"  # First step or independent
    AND = "and"  # Must also do this
    OR = "or"  # Alternative option
    IF = "if"  # Conditional execution


class AbilityStep(Base):
    """One step in a role's ability sequence.

    AbilitySteps compose abilities into complex role behaviors.
    Each step references an Ability primitive and adds parameters.

    Attributes:
        id: Unique identifier (UUID).
        role_id: Foreign key to Role.
        ability_id: Foreign key to Ability.
        order: Execution order (1, 2, 3...).
        modifier: AND/OR/IF relationship to previous step.
        is_required: Whether step must execute vs optional.
        parameters: Parameters for this ability execution.
        condition_type: Type of condition (only_if_opponent, etc.).
        condition_params: Additional condition parameters.
    """

    __tablename__ = "ability_steps"

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
    ability_id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        ForeignKey("abilities.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    modifier: Mapped[StepModifier] = mapped_column(
        Enum(StepModifier),
        default=StepModifier.NONE,
        nullable=False,
    )
    is_required: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    parameters: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )
    condition_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    condition_params: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    # Relationships
    role: Mapped["Role"] = relationship(  # noqa: F821
        "Role",
        back_populates="ability_steps",
    )
    ability: Mapped["Ability"] = relationship(  # noqa: F821
        "Ability",
        back_populates="ability_steps",
    )

    def __repr__(self) -> str:
        """String representation of AbilityStep."""
        return f"<AbilityStep(id={self.id}, order={self.order})>"
