"""Tests for Pydantic schemas."""

import uuid
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.models.ability import Ability
from app.models.ability_step import StepModifier
from app.models.game_session import GamePhase
from app.models.role import Team, Visibility
from app.schemas.game import GameSessionCreate, GameSessionResponse
from app.schemas.role import (
    AbilityStepCreateInRole,
    AbilityStepInRole,
    RoleCreate,
    RoleListItem,
    RoleUpdate,
)


class TestSchemaBarrel:
    """Tests that app.schemas barrel matches the live schema surface."""

    def test_exports_narrator_preview_schemas(self) -> None:
        """AC1: narrator-preview schemas are importable from the barrel."""
        import app.schemas as barrel

        for name in (
            "NarratorPreviewAction",
            "NarratorPreviewResponse",
            "PreviewScriptRequest",
        ):
            assert name in barrel.__all__
            assert getattr(barrel, name) is not None

    def test_does_not_export_dead_ability_step_schemas(self) -> None:
        """AC2: deleted dead classes are gone from the barrel."""
        import app.schemas as barrel

        for name in ("AbilityStepBase", "AbilityStepCreate", "AbilityStepRead"):
            assert name not in barrel.__all__
            assert not hasattr(barrel, name)

    def test_dead_classes_removed_from_ability_module(self) -> None:
        """AC2: dead classes no longer exist in app.schemas.ability."""
        import app.schemas.ability as ability_schemas

        for name in ("AbilityStepBase", "AbilityStepCreate", "AbilityStepRead"):
            assert not hasattr(ability_schemas, name)


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
        """Test wake_order must be 0-40."""
        with pytest.raises(ValidationError):
            RoleCreate(
                name="Bad Wake",
                description="Invalid wake order",
                team=Team.VILLAGE,
                wake_order=45,
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


class TestAbilityStepModifierTyping:
    """AC3: `modifier` is typed as StepModifier at the schema boundary."""

    @staticmethod
    def _step(modifier: object) -> dict:
        return {"ability_type": "kill", "order": 1, "modifier": modifier}

    def test_invalid_modifier_rejected_on_role_create(self) -> None:
        """AC3: an invalid modifier fails validation instead of reaching the service."""
        with pytest.raises(ValidationError):
            RoleCreate(
                name="Bad Modifier",
                description="Invalid step modifier",
                team=Team.VILLAGE,
                ability_steps=[self._step("bogus")],
            )

    def test_invalid_modifier_rejected_on_role_update(self) -> None:
        """AC3: the same validation applies to updates."""
        with pytest.raises(ValidationError):
            RoleUpdate(ability_steps=[self._step("bogus")])

    @pytest.mark.parametrize("value", ["none", "and", "or", "if"])
    def test_valid_modifier_values_accepted(self, value: str) -> None:
        """AC3: every StepModifier value is still accepted as a bare string."""
        role = RoleCreate(
            name="Good Modifier",
            description="Valid step modifier",
            team=Team.VILLAGE,
            ability_steps=[self._step(value)],
        )
        assert role.ability_steps[0].modifier == StepModifier(value)

    def test_modifier_defaults_to_none_enum(self) -> None:
        """AC3: the default stays equivalent to 'none'."""
        role = RoleCreate(
            name="Default Modifier",
            description="Omitted step modifier",
            team=Team.VILLAGE,
            ability_steps=[{"ability_type": "kill", "order": 1}],
        )
        assert role.ability_steps[0].modifier is StepModifier.NONE

    def test_modifier_serializes_to_bare_string(self) -> None:
        """AC4: JSON serialization is unchanged (str-enum -> bare string)."""
        role = RoleCreate(
            name="Serialize",
            description="Check serialization",
            team=Team.VILLAGE,
            ability_steps=[self._step("and")],
        )
        dumped = role.model_dump(mode="json")
        assert dumped["ability_steps"][0]["modifier"] == "and"

    def test_ability_step_in_role_serializes_to_bare_string(self) -> None:
        """AC4: read-side schema also serializes modifier as a bare string."""
        step = AbilityStepInRole(
            id=uuid.uuid4(),
            ability_id=uuid.uuid4(),
            order=1,
            modifier="or",
            is_required=True,
            parameters={},
        )
        assert step.model_dump(mode="json")["modifier"] == "or"

    def test_ability_step_in_role_rejects_invalid_modifier(self) -> None:
        """AC3: read-side schema rejects values outside the enum."""
        with pytest.raises(ValidationError):
            AbilityStepInRole(
                id=uuid.uuid4(),
                ability_id=uuid.uuid4(),
                order=1,
                modifier="bogus",
                is_required=True,
                parameters={},
            )

    def test_openapi_exposes_modifier_enum_values(self) -> None:
        """AC3: the valid value set appears in the OpenAPI/JSON schema contract."""
        schema = AbilityStepCreateInRole.model_json_schema()
        defs = schema.get("$defs", {})
        assert "StepModifier" in defs
        assert set(defs["StepModifier"]["enum"]) == {"none", "and", "or", "if"}

    def test_invalid_modifier_returns_422_at_api_boundary(
        self, client: TestClient, sample_abilities: list[Ability]
    ) -> None:
        """AC3: invalid modifier is rejected with 422, not an unwrapped 500."""
        response = client.post(
            "/api/v1/roles/",
            json={
                "name": "Boundary Role",
                "description": "Invalid step modifier",
                "team": Team.VILLAGE.value,
                "ability_steps": [
                    {
                        "ability_type": sample_abilities[0].type,
                        "order": 1,
                        "modifier": "bogus",
                    }
                ],
            },
        )
        assert response.status_code == 422


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


class TestGameSessionCreateWakeOrderSequence:
    """Tests for wake_order_sequence on GameSessionCreate schema."""

    def test_accepts_valid_wake_order_sequence(self) -> None:
        """AC3: GameSessionCreate accepts an optional wake_order_sequence."""
        ids = [uuid.uuid4(), uuid.uuid4()]
        schema = GameSessionCreate(
            player_count=5,
            center_card_count=3,
            role_ids=[uuid.uuid4() for _ in range(8)],
            wake_order_sequence=ids,
        )
        assert schema.wake_order_sequence == ids

    def test_accepts_none_wake_order_sequence(self) -> None:
        """AC3: GameSessionCreate accepts None / missing wake_order_sequence."""
        schema = GameSessionCreate(
            player_count=5,
            center_card_count=3,
            role_ids=[uuid.uuid4() for _ in range(8)],
        )
        assert schema.wake_order_sequence is None

    def test_response_includes_wake_order_sequence(self) -> None:
        """AC4: GameSessionResponse includes wake_order_sequence."""
        ids = [uuid.uuid4(), uuid.uuid4()]
        resp = GameSessionResponse(
            id=uuid.uuid4(),
            player_count=5,
            center_card_count=3,
            discussion_timer_seconds=300,
            phase=GamePhase.SETUP,
            current_wake_order=None,
            created_at=datetime.now(),
            started_at=None,
            ended_at=None,
            game_roles=[],
            wake_order_sequence=ids,
        )
        assert resp.wake_order_sequence == ids

    def test_response_wake_order_sequence_defaults_none(self) -> None:
        """AC4: GameSessionResponse defaults wake_order_sequence to None."""
        resp = GameSessionResponse(
            id=uuid.uuid4(),
            player_count=5,
            center_card_count=3,
            discussion_timer_seconds=300,
            phase=GamePhase.SETUP,
            current_wake_order=None,
            created_at=datetime.now(),
            started_at=None,
            ended_at=None,
            game_roles=[],
        )
        assert resp.wake_order_sequence is None
