"""Role CRUD endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.role import Team, Visibility
from app.schemas.role import (
    RoleCreate,
    RoleListResponse,
    RoleRead,
    RoleUpdate,
)
from app.services.role_service import RoleService

router = APIRouter()


@router.get("/", response_model=RoleListResponse)
async def list_roles(
    team: Team | None = Query(default=None, description="Filter by team"),
    visibility: Visibility | None = Query(
        default=None,
        description="Filter by visibility",
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
    return service.create_role(role_data)


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
        )
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
