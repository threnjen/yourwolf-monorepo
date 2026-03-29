"""Role CRUD endpoints."""

from uuid import UUID

from app.database import get_db
from app.models.role import Team, Visibility
from app.schemas.role import (
    RoleCreate,
    RoleListResponse,
    RoleNameCheckResponse,
    RoleRead,
    RoleUpdate,
    RoleValidationResponse,
    NarratorPreviewResponse,
    PreviewScriptRequest,
)
from app.services.role_service import RoleService
from app.services.script_service import ScriptService
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=RoleListResponse)
async def list_roles(
    team: Team | None = Query(default=None, description="Filter by team"),
    visibility: list[Visibility] | None = Query(
        default=None,
        description="Filter by visibility (supports multiple values)",
    ),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> RoleListResponse:
    """List roles with optional filters and pagination.

    Args:
        team: Optional team filter.
        visibility: Optional visibility filter.
        page: Page number (1-indexed).
        limit: Number of items per page.
        db: Database session.

    Returns:
        Paginated list of roles.
    """
    service = RoleService(db)
    return service.list_roles(
        team=team,
        visibility=visibility,
        page=page,
        limit=limit,
    )


@router.get("/official", response_model=RoleListResponse)
async def list_official_roles(
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> RoleListResponse:
    """List official roles only.

    Args:
        page: Page number (1-indexed).
        limit: Number of items per page.
        db: Database session.

    Returns:
        Paginated list of official roles.
    """
    service = RoleService(db)
    return service.list_roles(
        visibility=Visibility.OFFICIAL,
        page=page,
        limit=limit,
    )


@router.post("/validate", response_model=RoleValidationResponse)
async def validate_role(
    role_data: RoleCreate,
    exclude_role_id: UUID | None = Query(
        default=None,
        description="Role UUID to exclude from duplicate name check (for edits)",
    ),
    db: Session = Depends(get_db),
) -> RoleValidationResponse:
    """Dry-run validate a role without persisting it.

    Args:
        role_data: Role creation data to validate.
        exclude_role_id: Optional role UUID to exclude from duplicate name check.
        db: Database session.

    Returns:
        Validation result with errors and warnings.
    """
    service = RoleService(db)
    errors = service.validate_role(role_data, exclude_role_id)
    warnings = service.get_warnings(role_data)
    return RoleValidationResponse(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
    )


@router.post("/preview-script", response_model=NarratorPreviewResponse)
async def preview_script(
    role_data: PreviewScriptRequest,
    db: Session = Depends(get_db),
) -> NarratorPreviewResponse:
    """Generate a narrator script preview for a draft role without persisting.

    Args:
        role_data: Preview request with only script-relevant fields.
        db: Database session.

    Returns:
        Narrator preview with ordered instruction actions.
    """
    service = ScriptService(db)
    return service.preview_role_script(role_data)


@router.get("/check-name", response_model=RoleNameCheckResponse)
async def check_role_name(
    name: str = Query(
        ..., min_length=1, description="Role name to check for availability"
    ),
    db: Session = Depends(get_db),
) -> RoleNameCheckResponse:
    """Check whether a role name is available (not used by a public or official role).

    Args:
        name: Role name to check.
        db: Database session.

    Returns:
        Name availability result with message.
    """
    name = name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role name must not be empty or whitespace only.",
        )
    service = RoleService(db)
    is_duplicate = service.check_duplicate_name(name)
    if is_duplicate:
        message = f"'{name}' is already taken by a public or official role."
    else:
        message = f"'{name}' is available."
    return RoleNameCheckResponse(
        name=name,
        is_available=not is_duplicate,
        message=message,
    )


@router.get("/{role_id}", response_model=RoleRead)
async def get_role(
    role_id: UUID,
    db: Session = Depends(get_db),
) -> RoleRead:
    """Get a role by ID with ability steps and win conditions.

    Args:
        role_id: Role UUID.
        db: Database session.

    Returns:
        Role with full details.

    Raises:
        HTTPException: If role not found.
    """
    service = RoleService(db)
    role = service.get_role(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found",
        )
    return role


@router.post("/", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
) -> RoleRead:
    """Create a new role.

    Args:
        role_data: Role creation data.
        db: Database session.

    Returns:
        Created role with full details.
    """
    service = RoleService(db)
    try:
        return service.create_role(role_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.put("/{role_id}", response_model=RoleRead)
async def update_role(
    role_id: UUID,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
) -> RoleRead:
    """Update an existing role.

    Args:
        role_id: Role UUID.
        role_data: Role update data.
        db: Database session.

    Returns:
        Updated role with full details.

    Raises:
        HTTPException: If role not found or is locked.
    """
    service = RoleService(db)
    try:
        role = service.update_role(role_id, role_data)
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found",
        )
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    """Delete a role.

    Args:
        role_id: Role UUID.
        db: Database session.

    Raises:
        HTTPException: If role not found or is locked.
    """
    service = RoleService(db)
    try:
        deleted = service.delete_role(role_id)
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found",
        )
