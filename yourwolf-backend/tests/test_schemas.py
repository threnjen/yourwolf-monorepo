"""Tests for Pydantic schemas."""

import uuid
from datetime import datetime

import pytest
from pydantic import ValidationError

from app.models.role import Team, Visibility
from app.models.role_dependency import DependencyType
from app.schemas.ability import AbilityRead
from app.schemas.role import (
    AbilityStepCreateInRole,
    RoleCreate,
    RoleDependencyResponse,
    RoleListItem,
    RoleListResponse,
    RoleRead,
    RoleUpdate,
    WinConditionCreate,
)


class TestRoleCreateSchema:
    """Tests for RoleCreate schema validation."""

    def test_valid_minimal(self) -> None:
        """Test creating with minimal required fields."""
        role = RoleCreate(
            name="Test Role",
            description="A test role",
            team=Team.VILLAGE,
        )
        assert role.name == "Test Role"
        assert role.team == Team.VILLAGE
        assert role.visibility == Visibility.PRIVATE  # default

    def test_valid_full(self) -> None:
        """Test creating with all fields."""
        role = RoleCreate(
            name="Full Role",
            description="All fields",
            team=Team.WEREWOLF,
            wake_order=5,
            wake_target="werewolves",
            votes=2,
            visibility=Visibility.PUBLIC,
            ability_steps=[],
            win_conditions=[],
        )
        assert role.wake_order == 5
        assert role.votes == 2

    def test_name_required(self) -> None:
        """Test that name is required."""
        with pytest.raises(ValidationError):
            RoleCreate(
                description="No name",
                team=Team.VILLAGE,
            )

    def test_name_min_length(self) -> None:
        """Test name minimum length."""
        with pytest.raises(ValidationError):
            RoleCreate(
                name="",
                description="Empty name",
                team=Team.VILLAGE,
            )

    def test_name_max_length(self) -> None:
        """Test name maximum length."""
        with pytest.raises(ValidationError):
            RoleCreate(
                name="x" * 101,
                description="Name too long",
                team=Team.VILLAGE,
            )

    def test_description_required(self) -> None:
        """Test that description is required."""
        with pytest.raises(ValidationError):
            RoleCreate(
                name="No description",
                team=Team.VILLAGE,
            )

    def test_team_required(self) -> None:
        """Test that team is required."""
        with pytest.raises(ValidationError):
            RoleCreate(
                name="No team",
                description="Missing team",
            )

    def test_wake_order_range(self) -> None:
        """Test wake_order must be 0-20."""
        with pytest.raises(ValidationError):
            RoleCreate(
                name="Bad Wake",
                description="Invalid wake order",
                team=Team.VILLAGE,
                wake_order=25,
            )

    def test_votes_range(self) -> None:
        """Test votes must be 0-10."""
        with pytest.raises(ValidationError):
            RoleCreate(
                name="Too Many Votes",
                description="Invalid votes",
                team=Team.VILLAGE,
                votes=15,
            )


class TestRoleUpdateSchema:
    """Tests for RoleUpdate schema validation."""

    def test_all_optional(self) -> None:
        """Test that all fields are optional."""
        update = RoleUpdate()
        assert update.name is None
        assert update.team is None

    def test_partial_update(self) -> None:
        """Test partial update with some fields."""
        update = RoleUpdate(name="New Name")
        assert update.name == "New Name"
        assert update.description is None

    def test_name_validation_on_update(self) -> None:
        """Test name validation applies to updates."""
        with pytest.raises(ValidationError):
            RoleUpdate(name="")


class TestRoleReadSchema:
    """Tests for RoleRead schema."""

    def test_from_dict(self) -> None:
        """Test creating from dictionary."""
        data = {
            "id": uuid.uuid4(),
            "name": "Test Role",
            "description": "Test",
            "team": Team.VILLAGE,
            "wake_order": None,
            "wake_target": None,
            "votes": 1,
            "visibility": Visibility.OFFICIAL,
            "is_locked": True,
            "vote_score": 0,
            "use_count": 0,
            "creator_id": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "published_at": None,
            "ability_steps": [],
            "win_conditions": [],
        }
        role = RoleRead(**data)
        assert role.name == "Test Role"


class TestRoleListItemSchema:
    """Tests for RoleListItem schema."""

    def test_from_dict(self) -> None:
        """Test creating from dictionary."""
        data = {
            "id": uuid.uuid4(),
            "name": "List Role",
            "description": "Listed",
            "team": Team.WEREWOLF,
            "wake_order": 3,
            "visibility": Visibility.PUBLIC,
            "vote_score": 5,
            "use_count": 10,
            "default_count": 1,
            "min_count": 1,
            "max_count": 1,
            "created_at": datetime.now(),
        }
        item = RoleListItem(**data)
        assert item.name == "List Role"
        assert item.vote_score == 5


class TestRoleListResponseSchema:
    """Tests for RoleListResponse schema."""

    def test_pagination_fields(self) -> None:
        """Test pagination fields are present."""
        response = RoleListResponse(
            items=[],
            total=0,
            page=1,
            limit=20,
            pages=1,
        )
        assert response.total == 0
        assert response.page == 1
        assert response.pages == 1


class TestWinConditionCreateSchema:
    """Tests for WinConditionCreate schema."""

    def test_minimal(self) -> None:
        """Test creating with minimal fields."""
        wc = WinConditionCreate(condition_type="team_wins")
        assert wc.condition_type == "team_wins"
        assert wc.is_primary is True  # default

    def test_full(self) -> None:
        """Test creating with all fields."""
        wc = WinConditionCreate(
            condition_type="self_dies",
            condition_params={"extra": "data"},
            is_primary=False,
            overrides_team=True,
        )
        assert wc.overrides_team is True


class TestAbilityStepCreateInRoleSchema:
    """Tests for AbilityStepCreateInRole schema."""

    def test_minimal(self) -> None:
        """Test creating with minimal fields."""
        step = AbilityStepCreateInRole(
            ability_type="view_card",
            order=1,
        )
        assert step.ability_type == "view_card"
        assert step.modifier == "none"  # default
        assert step.is_required is True  # default

    def test_full(self) -> None:
        """Test creating with all fields."""
        step = AbilityStepCreateInRole(
            ability_type="swap_card",
            order=2,
            modifier="and",
            is_required=False,
            parameters={"target": "center"},
            condition_type="if_alone",
            condition_params={"check": True},
        )
        assert step.modifier == "and"
        assert step.is_required is False


class TestAbilityReadSchema:
    """Tests for AbilityRead schema."""

    def test_from_dict(self) -> None:
        """Test creating from dictionary."""
        data = {
            "id": uuid.uuid4(),
            "type": "test_ability",
            "name": "Test Ability",
            "description": "A test",
            "parameters_schema": {},
            "is_active": True,
            "created_at": datetime.now(),
        }
        ability = AbilityRead(**data)
        assert ability.type == "test_ability"
        assert ability.is_active is True


class TestRoleCreateCardCounts:
    """Tests for card count validation on RoleCreate."""

    def test_default_card_counts(self) -> None:
        """Test that card counts default to 1."""
        role = RoleCreate(
            name="Test",
            description="Test role",
            team=Team.VILLAGE,
        )
        assert role.default_count == 1
        assert role.min_count == 1
        assert role.max_count == 1

    def test_valid_custom_card_counts(self) -> None:
        """Test creating a role with valid custom card counts."""
        role = RoleCreate(
            name="Mason",
            description="Mason",
            team=Team.VILLAGE,
            default_count=2,
            min_count=2,
            max_count=2,
        )
        assert role.default_count == 2
        assert role.min_count == 2
        assert role.max_count == 2

    def test_min_greater_than_max_rejected(self) -> None:
        """Test that min_count > max_count is rejected."""
        with pytest.raises(ValidationError, match="min_count.*max_count"):
            RoleCreate(
                name="Bad",
                description="Invalid counts",
                team=Team.VILLAGE,
                min_count=3,
                max_count=2,
            )

    def test_default_less_than_min_rejected(self) -> None:
        """Test that default_count < min_count is rejected."""
        with pytest.raises(ValidationError, match="default_count.*min_count"):
            RoleCreate(
                name="Bad",
                description="Invalid counts",
                team=Team.VILLAGE,
                default_count=1,
                min_count=2,
                max_count=3,
            )

    def test_default_greater_than_max_rejected(self) -> None:
        """Test that default_count > max_count is rejected."""
        with pytest.raises(ValidationError, match="default_count.*max_count"):
            RoleCreate(
                name="Bad",
                description="Invalid counts",
                team=Team.VILLAGE,
                default_count=5,
                min_count=1,
                max_count=3,
            )

    def test_werewolf_card_counts(self) -> None:
        """Test Werewolf-style card counts (default 2, min 1, max 2)."""
        role = RoleCreate(
            name="Werewolf",
            description="A werewolf",
            team=Team.WEREWOLF,
            default_count=2,
            min_count=1,
            max_count=2,
        )
        assert role.default_count == 2
        assert role.min_count == 1
        assert role.max_count == 2


class TestRoleDependencyResponseSchema:
    """Tests for RoleDependencyResponse schema."""

    def test_from_dict(self) -> None:
        """Test creating from dictionary."""
        data = {
            "id": uuid.uuid4(),
            "required_role_id": uuid.uuid4(),
            "required_role_name": "Tanner",
            "dependency_type": DependencyType.REQUIRES,
        }
        dep = RoleDependencyResponse(**data)
        assert dep.required_role_name == "Tanner"
        assert dep.dependency_type == DependencyType.REQUIRES

    def test_recommends_type(self) -> None:
        """Test creating a recommends dependency response."""
        data = {
            "id": uuid.uuid4(),
            "required_role_id": uuid.uuid4(),
            "required_role_name": "Werewolf",
            "dependency_type": DependencyType.RECOMMENDS,
        }
        dep = RoleDependencyResponse(**data)
        assert dep.dependency_type == DependencyType.RECOMMENDS
