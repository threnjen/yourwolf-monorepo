"""Tests for RoleService business logic."""

import uuid

from sqlalchemy.orm import Session

from app.models.ability import Ability
from app.models.role import Role, Team, Visibility
from app.schemas.role import (
    AbilityStepCreateInRole,
    RoleCreate,
    RoleUpdate,
    WinConditionCreate,
)
from app.services.role_service import RoleService


class TestRoleServiceListRoles:
    """Tests for RoleService.list_roles method."""

    def test_list_roles_empty(self, db_session: Session) -> None:
        """Test listing roles when database is empty."""
        service = RoleService(db_session)
        result = service.list_roles()
        assert result.items == []
        assert result.total == 0
        assert result.pages == 1

    def test_list_roles_with_data(
        self,
        db_session: Session,
        sample_roles: list[Role],
    ) -> None:
        """Test listing roles returns all roles."""
        service = RoleService(db_session)
        result = service.list_roles()
        assert result.total == len(sample_roles)

    def test_list_roles_filter_team(
        self,
        db_session: Session,
        sample_roles: list[Role],
    ) -> None:
        """Test filtering by team."""
        service = RoleService(db_session)
        result = service.list_roles(team=Team.VILLAGE)
        for item in result.items:
            assert item.team == Team.VILLAGE

    def test_list_roles_filter_visibility(
        self,
        db_session: Session,
        sample_roles: list[Role],
    ) -> None:
        """Test filtering by visibility."""
        service = RoleService(db_session)
        result = service.list_roles(visibility=Visibility.OFFICIAL)
        for item in result.items:
            assert item.visibility == Visibility.OFFICIAL

    def test_list_roles_pagination_first_page(
        self,
        db_session: Session,
        sample_roles: list[Role],
    ) -> None:
        """Test pagination returns correct number of items."""
        service = RoleService(db_session)
        result = service.list_roles(page=1, limit=3)
        assert len(result.items) == 3
        assert result.page == 1
        assert result.limit == 3

    def test_list_roles_pagination_second_page(
        self,
        db_session: Session,
        sample_roles: list[Role],
    ) -> None:
        """Test second page returns remaining items."""
        service = RoleService(db_session)
        result = service.list_roles(page=2, limit=5)
        assert result.page == 2
        assert len(result.items) <= 5

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


class TestRoleServiceGetRole:
    """Tests for RoleService.get_role method."""

    def test_get_role_found(
        self,
        db_session: Session,
        sample_role: Role,
    ) -> None:
        """Test getting an existing role."""
        service = RoleService(db_session)
        result = service.get_role(sample_role.id)
        assert result is not None
        assert result.name == sample_role.name

    def test_get_role_not_found(self, db_session: Session) -> None:
        """Test getting a nonexistent role returns None."""
        service = RoleService(db_session)
        fake_id = uuid.uuid4()
        result = service.get_role(fake_id)
        assert result is None

    def test_get_role_includes_ability_steps(
        self,
        db_session: Session,
        sample_role_with_steps: Role,
    ) -> None:
        """Test that returned role includes ability steps."""
        service = RoleService(db_session)
        result = service.get_role(sample_role_with_steps.id)
        assert result is not None
        assert len(result.ability_steps) > 0

    def test_get_role_includes_win_conditions(
        self,
        db_session: Session,
        sample_role_with_steps: Role,
    ) -> None:
        """Test that returned role includes win conditions."""
        service = RoleService(db_session)
        result = service.get_role(sample_role_with_steps.id)
        assert result is not None
        assert len(result.win_conditions) > 0


class TestRoleServiceCreateRole:
    """Tests for RoleService.create_role method."""

    def test_create_role_minimal(self, db_session: Session) -> None:
        """Test creating a role with minimal data."""
        service = RoleService(db_session)
        role_data = RoleCreate(
            name="Test Role",
            description="Test description",
            team=Team.VILLAGE,
        )
        result = service.create_role(role_data)
        assert result.name == "Test Role"
        assert result.team == Team.VILLAGE
        assert result.visibility == Visibility.PRIVATE

    def test_create_role_with_optional_fields(self, db_session: Session) -> None:
        """Test creating a role with optional fields."""
        service = RoleService(db_session)
        role_data = RoleCreate(
            name="Full Role",
            description="Full description",
            team=Team.WEREWOLF,
            wake_order=3,
            wake_target="werewolves",
            votes=2,
            visibility=Visibility.PUBLIC,
        )
        result = service.create_role(role_data)
        assert result.wake_order == 3
        assert result.votes == 2

    def test_create_role_with_ability_steps(
        self,
        db_session: Session,
        sample_ability: Ability,
    ) -> None:
        """Test creating a role with ability steps."""
        service = RoleService(db_session)
        role_data = RoleCreate(
            name="Role With Steps",
            description="Has steps",
            team=Team.VILLAGE,
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type=sample_ability.type,
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={},
                )
            ],
        )
        result = service.create_role(role_data)
        assert len(result.ability_steps) == 1

    def test_create_role_with_win_conditions(self, db_session: Session) -> None:
        """Test creating a role with win conditions."""
        service = RoleService(db_session)
        role_data = RoleCreate(
            name="Role With Win",
            description="Has win conditions",
            team=Team.NEUTRAL,
            win_conditions=[
                WinConditionCreate(
                    condition_type="self_dies",
                    is_primary=True,
                    overrides_team=True,
                )
            ],
        )
        result = service.create_role(role_data)
        assert len(result.win_conditions) == 1

    def test_create_role_generates_uuid(self, db_session: Session) -> None:
        """Test that created role has a UUID."""
        service = RoleService(db_session)
        role_data = RoleCreate(
            name="UUID Role",
            description="Has UUID",
            team=Team.VILLAGE,
        )
        result = service.create_role(role_data)
        assert result.id is not None


class TestRoleServiceUpdateRole:
    """Tests for RoleService.update_role method."""

    def test_update_role_success(
        self,
        db_session: Session,
        sample_unlocked_role: Role,
    ) -> None:
        """Test updating an unlocked role."""
        service = RoleService(db_session)
        update_data = RoleUpdate(name="Updated Name")
        result = service.update_role(sample_unlocked_role.id, update_data)
        assert result is not None
        assert result.name == "Updated Name"

    def test_update_role_locked_raises_permission_error(
        self,
        db_session: Session,
        sample_role: Role,
    ) -> None:
        """Test updating a locked role raises PermissionError."""
        import pytest

        service = RoleService(db_session)
        update_data = RoleUpdate(name="Try Update")
        with pytest.raises(PermissionError):
            service.update_role(sample_role.id, update_data)

    def test_update_role_not_found(self, db_session: Session) -> None:
        """Test updating a nonexistent role returns None."""
        service = RoleService(db_session)
        fake_id = uuid.uuid4()
        update_data = RoleUpdate(name="New Name")
        result = service.update_role(fake_id, update_data)
        assert result is None

    def test_update_role_partial(
        self,
        db_session: Session,
        sample_unlocked_role: Role,
    ) -> None:
        """Test partial update only modifies specified fields."""
        service = RoleService(db_session)
        original_desc = sample_unlocked_role.description
        update_data = RoleUpdate(name="Only Name")
        result = service.update_role(sample_unlocked_role.id, update_data)
        assert result is not None
        assert result.name == "Only Name"
        assert result.description == original_desc


class TestRoleServiceDeleteRole:
    """Tests for RoleService.delete_role method."""

    def test_delete_role_success(
        self,
        db_session: Session,
        sample_unlocked_role: Role,
    ) -> None:
        """Test deleting an unlocked role."""
        service = RoleService(db_session)
        role_id = sample_unlocked_role.id
        result = service.delete_role(role_id)
        assert result is True
        # Verify deleted
        assert service.get_role(role_id) is None

    def test_delete_role_locked_raises_permission_error(
        self,
        db_session: Session,
        sample_role: Role,
    ) -> None:
        """Test deleting a locked role raises PermissionError."""
        import pytest

        service = RoleService(db_session)
        with pytest.raises(PermissionError):
            service.delete_role(sample_role.id)
        # Verify still exists
        assert service.get_role(sample_role.id) is not None

    def test_delete_role_not_found(self, db_session: Session) -> None:
        """Test deleting a nonexistent role returns False."""
        service = RoleService(db_session)
        fake_id = uuid.uuid4()
        result = service.delete_role(fake_id)
        assert result is False
