"""Ability endpoints."""

from app.database import get_db
from app.models.ability import Ability
from app.schemas.ability import AbilityRead
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=list[AbilityRead])
async def list_abilities(
    db: Session = Depends(get_db),
) -> list[AbilityRead]:
    """List all ability primitives.

    Args:
        db: Database session.

    Returns:
        List of all available abilities.
    """
    abilities = db.query(Ability).filter(Ability.is_active.is_(True)).all()
    return [AbilityRead.model_validate(a) for a in abilities]


@router.get("/{ability_type}", response_model=AbilityRead)
async def get_ability_by_type(
    ability_type: str,
    db: Session = Depends(get_db),
) -> AbilityRead:
    """Get an ability by its type string.

    Args:
        ability_type: The ability type identifier (e.g., 'view_card').
        db: Database session.

    Returns:
        Ability details.

    Raises:
        HTTPException: If ability not found.
    """
    ability = db.query(Ability).filter(Ability.type == ability_type).first()
    if not ability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ability with type '{ability_type}' not found",
        )
    return AbilityRead.model_validate(ability)
