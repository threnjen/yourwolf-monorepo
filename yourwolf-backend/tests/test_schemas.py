"""Tests for Pydantic schemas."""

import uuid
from datetime import datetime

import pytest
from app.models.role import Team, Visibility
from app.schemas.role import (
    RoleCreate,
    RoleListItem,
    RoleUpdate,
)
from pydantic import ValidationError


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


class TestRoleListItemSchema:
    """Tests for RoleListItem schema."""

    def test_includes_is_primary_team_role(self) -> None:
        """Test that is_primary_team_role appears in serialized output."""
        data = {
            "id": uuid.uuid4(),
            "name": "Werewolf",
            "description": "A werewolf",
            "team": Team.WEREWOLF,
            "wake_order": 1,
            "visibility": Visibility.OFFICIAL,
            "vote_score": 0,
            "use_count": 0,
            "default_count": 2,
            "min_count": 1,
            "max_count": 2,
            "is_primary_team_role": True,
            "created_at": datetime.now(),
        }
        item = RoleListItem(**data)
        dumped = item.model_dump()
        assert "is_primary_team_role" in dumped
        assert dumped["is_primary_team_role"] is True

    def test_is_primary_team_role_defaults_false(self) -> None:
        """Test that is_primary_team_role defaults to False when omitted."""
        data = {
            "id": uuid.uuid4(),
            "name": "Minion",
            "description": "A minion",
            "team": Team.WEREWOLF,
            "wake_order": 2,
            "visibility": Visibility.OFFICIAL,
            "vote_score": 0,
            "use_count": 0,
            "default_count": 1,
            "min_count": 1,
            "max_count": 1,
            "created_at": datetime.now(),
        }
        item = RoleListItem(**data)
        assert item.is_primary_team_role is False


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
