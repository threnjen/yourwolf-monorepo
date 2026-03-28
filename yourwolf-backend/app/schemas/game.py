"""Pydantic schemas for game sessions and night scripts."""

from datetime import datetime
from uuid import UUID

from app.models.game_session import GamePhase
from app.schemas.base import PaginatedResponse
from pydantic import BaseModel, ConfigDict, Field


class GameSessionCreate(BaseModel):
    """Schema for creating a game session."""

    player_count: int = Field(..., ge=3, le=20)
    center_card_count: int = Field(default=3, ge=0, le=5)
    discussion_timer_seconds: int = Field(default=300, ge=60, le=1800)
    role_ids: list[UUID]


class GameRoleResponse(BaseModel):
    """Schema for reading a game role with denormalized role info."""

    id: UUID
    role_id: UUID
    role_name: str
    role_team: str
    position: int | None
    is_center: bool
    is_flipped: bool

    model_config = ConfigDict(from_attributes=True)


class GameSessionResponse(BaseModel):
    """Schema for reading a game session with all roles."""

    id: UUID
    player_count: int
    center_card_count: int
    discussion_timer_seconds: int
    phase: GamePhase
    current_wake_order: int | None
    created_at: datetime
    started_at: datetime | None
    ended_at: datetime | None
    game_roles: list[GameRoleResponse]
    warnings: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class GameSessionListResponse(BaseModel):
    """Schema for game session list items."""

    id: UUID
    player_count: int
    phase: GamePhase
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GameSessionPaginatedResponse(PaginatedResponse[GameSessionListResponse]):
    """Paginated response for game session list."""

    pass


class NarratorAction(BaseModel):
    """A single narration step in the night script."""

    order: int
    role_name: str
    instruction: str
    duration_seconds: int = 10
    requires_player_action: bool = True


class NightScript(BaseModel):
    """Full night narration script for a game session."""

    game_session_id: UUID
    actions: list[NarratorAction]
    total_duration_seconds: int
