"""Pydantic schemas package."""

from app.schemas.ability import AbilityCreate, AbilityRead
from app.schemas.base import PaginatedResponse
from app.schemas.game import (
    GameRoleResponse,
    GameSessionCreate,
    GameSessionListResponse,
    GameSessionPaginatedResponse,
    GameSessionResponse,
    NarratorAction,
    NightScript,
)
from app.schemas.role import (
    AbilityStepCreateInRole,
    AbilityStepInRole,
    NarratorPreviewAction,
    NarratorPreviewResponse,
    PreviewScriptRequest,
    RoleCreate,
    RoleDependencyResponse,
    RoleListItem,
    RoleListResponse,
    RoleNameCheckResponse,
    RoleRead,
    RoleUpdate,
    RoleValidationResponse,
    WinConditionCreate,
    WinConditionRead,
)

__all__ = [
    "AbilityCreate",
    "AbilityRead",
    "AbilityStepCreateInRole",
    "AbilityStepInRole",
    "GameRoleResponse",
    "GameSessionCreate",
    "GameSessionListResponse",
    "GameSessionPaginatedResponse",
    "GameSessionResponse",
    "NarratorAction",
    "NarratorPreviewAction",
    "NarratorPreviewResponse",
    "NightScript",
    "PaginatedResponse",
    "PreviewScriptRequest",
    "RoleCreate",
    "RoleDependencyResponse",
    "RoleListItem",
    "RoleListResponse",
    "RoleNameCheckResponse",
    "RoleRead",
    "RoleUpdate",
    "RoleValidationResponse",
    "WinConditionCreate",
    "WinConditionRead",
]
