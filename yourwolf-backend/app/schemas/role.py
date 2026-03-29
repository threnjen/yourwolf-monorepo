"""Pydantic schemas for roles and win conditions."""

from datetime import datetime
from typing import Any
from uuid import UUID

from app.models.role import Team, Visibility
from app.models.role_dependency import DependencyType
from app.schemas.base import PaginatedResponse
from pydantic import BaseModel, ConfigDict, Field, model_validator


class WinConditionBase(BaseModel):
    """Base schema for win conditions."""

    condition_type: str = Field(..., description="Type of win condition")
    condition_params: dict[str, Any] | None = Field(
        default=None,
        description="Additional parameters for the condition",
    )
    is_primary: bool = Field(default=True, description="Main win condition")
    overrides_team: bool = Field(
        default=False,
        description="Wins independent of team",
    )


class WinConditionCreate(WinConditionBase):
    """Schema for creating a win condition."""

    pass


class WinConditionRead(WinConditionBase):
    """Schema for reading a win condition."""

    id: UUID

    model_config = ConfigDict(from_attributes=True)


class AbilityStepInRole(BaseModel):
    """Embedded ability step schema for role responses."""

    id: UUID
    ability_id: UUID
    ability_type: str | None = None
    order: int
    modifier: str
    is_required: bool
    parameters: dict[str, Any]
    condition_type: str | None = None
    condition_params: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)


class RoleBase(BaseModel):
    """Base schema for roles."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1)
    team: Team
    wake_order: int | None = Field(default=None, ge=0, le=40)
    wake_target: str | None = None
    votes: int = Field(default=1, ge=0, le=10)
    default_count: int = Field(default=1, ge=1, le=10)
    min_count: int = Field(default=1, ge=1, le=10)
    max_count: int = Field(default=1, ge=1, le=10)
    is_primary_team_role: bool = Field(default=False)

    @model_validator(mode="after")
    def validate_card_counts(self) -> "RoleBase":
        """Ensure min_count <= default_count <= max_count."""
        if self.min_count > self.max_count:
            msg = (
                f"min_count ({self.min_count}) must be <= max_count ({self.max_count})"
            )
            raise ValueError(msg)
        if self.default_count < self.min_count:
            msg = (
                f"default_count ({self.default_count}) must be "
                f">= min_count ({self.min_count})"
            )
            raise ValueError(msg)
        if self.default_count > self.max_count:
            msg = (
                f"default_count ({self.default_count}) must be "
                f"<= max_count ({self.max_count})"
            )
            raise ValueError(msg)
        return self


class RoleCreate(RoleBase):
    """Schema for creating a role."""

    visibility: Visibility = Visibility.PRIVATE
    creator_id: UUID | None = None
    ability_steps: list["AbilityStepCreateInRole"] = Field(default_factory=list)
    win_conditions: list[WinConditionCreate] = Field(default_factory=list)


class AbilityStepCreateInRole(BaseModel):
    """Schema for creating an ability step within a role."""

    ability_type: str = Field(..., description="The ability type string")
    order: int = Field(..., ge=1)
    modifier: str = Field(default="none")
    is_required: bool = Field(default=True)
    parameters: dict[str, Any] = Field(default_factory=dict)
    condition_type: str | None = None
    condition_params: dict[str, Any] | None = None


class RoleUpdate(BaseModel):
    """Schema for updating a role."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, min_length=1)
    team: Team | None = None
    wake_order: int | None = Field(default=None, ge=0, le=40)
    wake_target: str | None = None
    votes: int | None = Field(default=None, ge=0, le=10)
    visibility: Visibility | None = None
    default_count: int | None = Field(default=None, ge=1, le=10)
    min_count: int | None = Field(default=None, ge=1, le=10)
    max_count: int | None = Field(default=None, ge=1, le=10)
    is_primary_team_role: bool | None = None
    ability_steps: list["AbilityStepCreateInRole"] | None = Field(
        default=None,
        description=(
            "When provided, fully replaces all existing ability steps. "
            "None (field omitted) = no change; [] = delete all steps."
        ),
    )
    win_conditions: list[WinConditionCreate] | None = Field(
        default=None,
        description=(
            "When provided, fully replaces all existing win conditions. "
            "None (field omitted) = no change; [] = delete all conditions."
        ),
    )


class RoleDependencyResponse(BaseModel):
    """Schema for reading a role dependency."""

    id: UUID
    required_role_id: UUID
    required_role_name: str
    dependency_type: DependencyType

    model_config = ConfigDict(from_attributes=True)


class RoleRead(RoleBase):
    """Schema for reading a role with all details."""

    id: UUID
    visibility: Visibility
    is_locked: bool
    vote_score: int
    use_count: int
    creator_id: UUID | None
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None
    ability_steps: list[AbilityStepInRole] = Field(default_factory=list)
    win_conditions: list[WinConditionRead] = Field(default_factory=list)
    dependencies: list[RoleDependencyResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class RoleListItem(BaseModel):
    """Schema for role list items (without nested details)."""

    id: UUID
    name: str
    description: str
    team: Team
    wake_order: int | None
    visibility: Visibility
    vote_score: int
    use_count: int
    default_count: int
    min_count: int
    max_count: int
    is_primary_team_role: bool = False
    created_at: datetime
    dependencies: list[RoleDependencyResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class RoleListResponse(PaginatedResponse[RoleListItem]):
    """Paginated response for role list."""

    pass


class RoleValidationResponse(BaseModel):
    """Response schema for POST /validate dry-run endpoint."""

    is_valid: bool
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class RoleNameCheckResponse(BaseModel):
    """Response schema for GET /check-name duplicate check endpoint."""

    name: str
    is_available: bool
    message: str


class NarratorPreviewAction(BaseModel):
    """A single instruction line in the narrator preview."""

    order: int
    instruction: str
    is_section_header: bool = False


class NarratorPreviewResponse(BaseModel):
    """Response schema for POST /roles/preview-script."""

    actions: list[NarratorPreviewAction] = Field(default_factory=list)


class PreviewScriptRequest(BaseModel):
    """Lightweight schema for the preview endpoint.

    Does NOT inherit from RoleBase — the preview only needs fields relevant
    to narrator script generation, not the full role creation payload.
    """

    name: str = ""
    wake_order: int | None = Field(default=0, ge=0, le=40)
    wake_target: str | None = None
    ability_steps: list[AbilityStepCreateInRole] = Field(default_factory=list)


# Update forward references
RoleCreate.model_rebuild()
RoleUpdate.model_rebuild()
