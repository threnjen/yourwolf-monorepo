"""Ability business logic service."""

from app.models.ability import Ability
from app.schemas.ability import AbilityRead
from sqlalchemy.orm import Session


class AbilityService:
    """Service for ability-related business logic."""

    def __init__(self, db: Session) -> None:
        """Initialize the ability service.

        Args:
            db: Database session.
        """
        self.db = db

    def list_active_abilities(self) -> list[AbilityRead]:
        """List all active abilities.

        Returns:
            List of active abilities.
        """
        abilities = self.db.query(Ability).filter(Ability.is_active.is_(True)).all()
        return [AbilityRead.model_validate(a) for a in abilities]

    def get_ability_by_type(self, ability_type: str) -> AbilityRead | None:
        """Get an ability by its type string.

        Args:
            ability_type: The ability type identifier.

        Returns:
            Ability details or None if not found.
        """
        ability = self.db.query(Ability).filter(Ability.type == ability_type).first()
        if not ability:
            return None
        return AbilityRead.model_validate(ability)
