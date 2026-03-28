"""Tests for RoleService business logic."""

import uuid

import pytest
from app.models.ability import Ability
from app.models.role import Role, Team, Visibility
from app.schemas.role import (
    AbilityStepCreateInRole,
    RoleCreate,
    RoleUpdate,
    WinConditionCreate,
)
from app.services.role_service import RoleService
from sqlalchemy.orm import Session


class TestRoleServiceListRoles:
    """Tests for RoleService.list_roles edge cases."""

    def test_list_roles_pagination_beyond_data(
        self,
        db_session: Session,
        sample_roles: list[Role],
    ) -> None:
        """Test page beyond data returns empty list."""
        service = RoleService(db_session)
        result = service.list_roles(page=100, limit=10)
        assert result.items == []

    def test_list_roles_calculates_pages(
        self,
        db_session: Session,
        sample_roles: list[Role],
    ) -> None:
        """Test pages calculation is correct."""
        service = RoleService(db_session)
        result = service.list_roles(limit=3)
        expected_pages = (len(sample_roles) + 2) // 3  # ceiling division
        assert result.pages == expected_pages

    def test_list_roles_returns_is_primary_team_role(
        self,
        db_session: Session,
    ) -> None:
        """Test that list_roles returns correct is_primary_team_role values."""
        service = RoleService(db_session)
        role = Role(
            id=uuid.uuid4(),
            name="Primary WW",
            description="Primary werewolf",
            team=Team.WEREWOLF,
            visibility=Visibility.OFFICIAL,
            is_locked=True,
            is_primary_team_role=True,
        )
        db_session.add(role)
        db_session.commit()

        result = service.list_roles()
        assert result.total == 1
        assert result.items[0].is_primary_team_role is True


class TestRoleServiceCreateRole:
    """Tests for RoleService.create_role — unique field tests."""

    def test_create_role_persists_is_primary_team_role(
        self, db_session: Session
    ) -> None:
        """Test that is_primary_team_role=True roundtrips through create → get."""
        service = RoleService(db_session)
        role_data = RoleCreate(
            name="Primary Werewolf",
            description="The main werewolf",
            team=Team.WEREWOLF,
            is_primary_team_role=True,
        )
        created = service.create_role(role_data)
        assert created.is_primary_team_role is True

        # Verify via separate get
        fetched = service.get_role(created.id)
        assert fetched is not None
        assert fetched.is_primary_team_role is True


class TestRoleServiceUpdateRoleStepsAndConditions:
    """Tests for step/condition replacement in RoleService.update_role."""

    def test_update_role_replaces_ability_steps(
        self,
        db_session: Session,
        sample_unlocked_role: Role,
        sample_abilities: list,
    ) -> None:
        """When ability_steps provided, all existing steps are deleted and replaced."""
        import pytest
        from app.models.ability_step import AbilityStep

        service = RoleService(db_session)

        # Seed two steps on the role
        ability = sample_abilities[0]
        for order in (1, 2):
            db_session.add(
                AbilityStep(
                    id=uuid.uuid4(),
                    role_id=sample_unlocked_role.id,
                    ability_id=ability.id,
                    order=order,
                    modifier="none",
                    is_required=True,
                    parameters={},
                )
            )
        db_session.commit()
        original = service.get_role(sample_unlocked_role.id)
        assert original is not None
        assert len(original.ability_steps) == 2
        original_ids = {s.id for s in original.ability_steps}

        # Replace with a single new step using a different ability type
        new_ability = sample_abilities[1]
        update_data = RoleUpdate(
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type=new_ability.type,
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={},
                )
            ]
        )
        result = service.update_role(sample_unlocked_role.id, update_data)
        assert result is not None
        assert len(result.ability_steps) == 1
        assert result.ability_steps[0].ability_type == new_ability.type
        # New step has a different ID — old steps are gone
        new_ids = {s.id for s in result.ability_steps}
        assert new_ids.isdisjoint(original_ids)

    def test_update_role_replaces_win_conditions(
        self,
        db_session: Session,
        sample_unlocked_role: Role,
    ) -> None:
        """When win_conditions provided, all existing conditions are deleted and replaced."""
        from app.models.win_condition import WinCondition

        service = RoleService(db_session)

        # Seed one condition
        db_session.add(
            WinCondition(
                id=uuid.uuid4(),
                role_id=sample_unlocked_role.id,
                condition_type="team_wins",
                is_primary=True,
                overrides_team=False,
            )
        )
        db_session.commit()
        original = service.get_role(sample_unlocked_role.id)
        assert original is not None
        assert len(original.win_conditions) == 1

        # Replace with two new conditions
        update_data = RoleUpdate(
            win_conditions=[
                WinConditionCreate(
                    condition_type="self_dies", is_primary=True, overrides_team=True
                ),
                WinConditionCreate(
                    condition_type="team_wins", is_primary=False, overrides_team=False
                ),
            ]
        )
        result = service.update_role(sample_unlocked_role.id, update_data)
        assert result is not None
        assert len(result.win_conditions) == 2
        types = {wc.condition_type for wc in result.win_conditions}
        assert types == {"self_dies", "team_wins"}

    def test_update_role_clears_ability_steps_with_empty_list(
        self,
        db_session: Session,
        sample_unlocked_role: Role,
        sample_ability,
    ) -> None:
        """ability_steps=[] deletes all existing steps (empty list != omitted)."""
        from app.models.ability_step import AbilityStep

        service = RoleService(db_session)

        db_session.add(
            AbilityStep(
                id=uuid.uuid4(),
                role_id=sample_unlocked_role.id,
                ability_id=sample_ability.id,
                order=1,
                modifier="none",
                is_required=True,
                parameters={},
            )
        )
        db_session.commit()

        result = service.update_role(
            sample_unlocked_role.id, RoleUpdate(ability_steps=[])
        )
        assert result is not None
        assert result.ability_steps == []

    def test_update_role_clears_win_conditions_with_empty_list(
        self,
        db_session: Session,
        sample_unlocked_role: Role,
    ) -> None:
        """win_conditions=[] deletes all existing conditions (empty list != omitted)."""
        from app.models.win_condition import WinCondition

        service = RoleService(db_session)

        db_session.add(
            WinCondition(
                id=uuid.uuid4(),
                role_id=sample_unlocked_role.id,
                condition_type="team_wins",
                is_primary=True,
                overrides_team=False,
            )
        )
        db_session.commit()

        result = service.update_role(
            sample_unlocked_role.id, RoleUpdate(win_conditions=[])
        )
        assert result is not None
        assert result.win_conditions == []

    def test_update_role_omitting_steps_leaves_them_unchanged(
        self,
        db_session: Session,
        sample_unlocked_role: Role,
        sample_ability,
    ) -> None:
        """Omitting ability_steps from the update payload leaves existing steps intact."""
        from app.models.ability_step import AbilityStep

        service = RoleService(db_session)

        step = AbilityStep(
            id=uuid.uuid4(),
            role_id=sample_unlocked_role.id,
            ability_id=sample_ability.id,
            order=1,
            modifier="none",
            is_required=True,
            parameters={},
        )
        db_session.add(step)
        db_session.commit()
        original_step_id = step.id

        # Update only the name — no ability_steps field
        result = service.update_role(
            sample_unlocked_role.id, RoleUpdate(name="Name Only Update")
        )
        assert result is not None
        assert result.name == "Name Only Update"
        assert len(result.ability_steps) == 1
        assert result.ability_steps[0].id == original_step_id

    def test_update_role_raises_on_unknown_ability_type(
        self,
        db_session: Session,
        sample_unlocked_role: Role,
        sample_ability,
    ) -> None:
        """Steps with an unknown ability_type raise ValueError."""
        from app.models.ability_step import AbilityStep

        service = RoleService(db_session)

        # Seed one step
        db_session.add(
            AbilityStep(
                id=uuid.uuid4(),
                role_id=sample_unlocked_role.id,
                ability_id=sample_ability.id,
                order=1,
                modifier="none",
                is_required=True,
                parameters={},
            )
        )
        db_session.commit()

        # Replace with two steps — one valid, one with a nonexistent ability_type
        update_data = RoleUpdate(
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type=sample_ability.type,
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={},
                ),
                AbilityStepCreateInRole(
                    ability_type="nonexistent_ability",
                    order=2,
                    modifier="none",
                    is_required=True,
                    parameters={},
                ),
            ]
        )
        with pytest.raises(ValueError, match="Unknown ability type"):
            service.update_role(sample_unlocked_role.id, update_data)

    def test_update_role_omitting_win_conditions_leaves_them_unchanged(
        self,
        db_session: Session,
        sample_unlocked_role: Role,
    ) -> None:
        """Omitting win_conditions from the update payload leaves existing conditions intact."""
        from app.models.win_condition import WinCondition

        service = RoleService(db_session)

        wc = WinCondition(
            id=uuid.uuid4(),
            role_id=sample_unlocked_role.id,
            condition_type="team_wins",
            is_primary=True,
            overrides_team=False,
        )
        db_session.add(wc)
        db_session.commit()
        original_wc_id = wc.id

        result = service.update_role(
            sample_unlocked_role.id, RoleUpdate(name="Name Only Update")
        )
        assert result is not None
        assert len(result.win_conditions) == 1
        assert result.win_conditions[0].id == original_wc_id


class TestRoleServiceCreateRoleCreatorId:
    """Tests for creator_id support in RoleService.create_role."""

    def test_create_role_stores_creator_id(self, db_session: Session) -> None:
        """creator_id passed in RoleCreate is stored on the role."""
        service = RoleService(db_session)
        creator_id = uuid.uuid4()
        role_data = RoleCreate(
            name="Owned Role",
            description="Role with owner",
            team=Team.VILLAGE,
            creator_id=creator_id,
        )
        result = service.create_role(role_data)
        assert result.creator_id == creator_id

    def test_create_role_without_creator_id_is_null(self, db_session: Session) -> None:
        """Omitting creator_id results in null on the created role."""
        service = RoleService(db_session)
        role_data = RoleCreate(
            name="Anonymous Role",
            description="Role without owner",
            team=Team.VILLAGE,
        )
        result = service.create_role(role_data)
        assert result.creator_id is None
