"""Tests for AbilityService."""

import uuid

from app.models.ability import Ability
from app.services.ability_service import AbilityService
from sqlalchemy.orm import Session


class TestListActiveAbilities:
    """Tests for AbilityService.list_active_abilities."""

    def test_returns_seeded_abilities(
        self, db_session: Session, sample_abilities: list[Ability]
    ) -> None:
        """Active abilities are returned after seeding."""
        service = AbilityService(db_session)

        result = service.list_active_abilities()

        assert len(result) == len(sample_abilities)
        returned_types = {a.type for a in result}
        expected_types = {a.type for a in sample_abilities}
        assert returned_types == expected_types

    def test_excludes_inactive_abilities(self, db_session: Session) -> None:
        """Inactive abilities are not returned."""
        active = Ability(
            id=uuid.uuid4(),
            type="view_card",
            name="View Card",
            description="View a card",
            parameters_schema={},
            is_active=True,
        )
        inactive = Ability(
            id=uuid.uuid4(),
            type="hidden_ability",
            name="Hidden",
            description="Not active",
            parameters_schema={},
            is_active=False,
        )
        db_session.add_all([active, inactive])
        db_session.commit()

        service = AbilityService(db_session)
        result = service.list_active_abilities()

        assert len(result) == 1
        assert result[0].type == "view_card"

    def test_returns_empty_when_no_abilities(self, db_session: Session) -> None:
        """Empty list returned when no abilities exist."""
        service = AbilityService(db_session)

        result = service.list_active_abilities()

        assert result == []


class TestGetAbilityByType:
    """Tests for AbilityService.get_ability_by_type."""

    def test_returns_ability_when_found(
        self, db_session: Session, sample_ability: Ability
    ) -> None:
        """Returns the ability matching the given type."""
        service = AbilityService(db_session)

        result = service.get_ability_by_type("view_card")

        assert result is not None
        assert result.type == "view_card"
        assert result.id == sample_ability.id

    def test_returns_none_when_not_found(self, db_session: Session) -> None:
        """Returns None when no ability matches the type."""
        service = AbilityService(db_session)

        result = service.get_ability_by_type("nonexistent")

        assert result is None
