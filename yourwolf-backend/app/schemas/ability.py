"""Pydantic schemas for abilities and ability steps."""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AbilityBase(BaseModel):
    """Base schema for abilities."""

    type: str = Field(..., description="Unique ability type identifier")
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1)
    parameters_schema: dict[str, Any] = Field(
        default_factory=dict,
        description="JSON Schema for ability parameters",
    )


class AbilityCreate(AbilityBase):
    """Schema for creating an ability (admin only)."""

    is_active: bool = True


class AbilityRead(AbilityBase):
    """Schema for reading an ability."""

    id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AbilityStepBase(BaseModel):
    """Base schema for ability steps."""

    order: int = Field(..., ge=1, description="Execution order")
    modifier: str = Field(default="none", description="Step modifier (and/or/if)")
    is_required: bool = Field(default=True, description="Whether step is required")
    parameters: dict[str, Any] = Field(
        default_factory=dict,
        description="Parameters for this step",
    )
    condition_type: str | None = Field(
        default=None,
        description="Condition type for IF modifier",
    )
    condition_params: dict[str, Any] | None = Field(
        default=None,
        description="Condition parameters",
    )


class AbilityStepCreate(AbilityStepBase):
    """Schema for creating an ability step."""

    ability_id: UUID


class AbilityStepRead(AbilityStepBase):
    """Schema for reading an ability step."""

    id: UUID
    role_id: UUID
    ability_id: UUID

    model_config = ConfigDict(from_attributes=True)
