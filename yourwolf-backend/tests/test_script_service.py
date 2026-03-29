"""Tests for ScriptService."""

from app.models.ability import Ability
from app.models.game_role import GameRole
from app.models.game_session import GamePhase, GameSession
from app.models.role import Role
from app.schemas.game import GameSessionCreate
from app.schemas.role import RoleCreate, AbilityStepCreateInRole
from app.services.game_service import GameService
from app.services.script_service import ScriptService
from sqlalchemy.orm import Session


def _create_and_start_game_deterministic(
    db: Session,
    seeded_roles: list[Role],
    role_indices: list[int] | None = None,
) -> GameSession:
    """Create and start a game with deterministic role assignment.

    Ensures waking roles are assigned to players (not center) by
    placing the first player_count roles as players.
    """
    if role_indices is None:
        role_indices = list(range(8))
    game_service = GameService(db)
    role_ids = [seeded_roles[i].id for i in role_indices]
    game = game_service.create_game(
        GameSessionCreate(
            player_count=5,
            center_card_count=3,
            role_ids=role_ids,
        )
    )
    # Instead of using start_game (which shuffles randomly),
    # manually assign positions so waking roles are always players
    game_orm = game_service.get_game_with_roles(game.id)
    game_roles = list(game_orm.game_roles)

    # Sort game_roles to match our role_ids order (waking roles first)
    role_id_order = {rid: i for i, rid in enumerate(role_ids)}
    game_roles.sort(key=lambda gr: role_id_order.get(gr.role_id, 999))

    for i in range(game_orm.player_count):
        game_roles[i].position = i
        game_roles[i].is_center = False
        role = db.query(Role).filter(Role.id == game_roles[i].role_id).first()
        if role:
            game_roles[i].current_team = role.team

    for i in range(game_orm.player_count, len(game_roles)):
        game_roles[i].position = i - game_orm.player_count
        game_roles[i].is_center = True

    game_orm.phase = GamePhase.NIGHT
    db.commit()
    db.refresh(game_orm)

    return game_service.get_game_with_roles(game_orm.id)


class TestGenerateNightScript:
    """Tests for ScriptService.generate_night_script."""

    def test_script_has_opening_and_closing(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        assert script.actions[0].instruction == "Everyone, close your eyes."
        assert script.actions[-1].instruction == "Everyone, open your eyes."

    def test_script_has_positive_total_duration(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        assert script.total_duration_seconds > 0

    def test_script_game_session_id_matches(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        assert script.game_session_id == game.id

    def test_script_actions_have_sequential_order(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        orders = [a.order for a in script.actions]
        assert orders == list(range(1, len(orders) + 1))

    def test_opening_and_closing_are_narrator(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        assert script.actions[0].role_name == "Narrator"
        assert script.actions[-1].role_name == "Narrator"


class TestScriptWakeOrder:
    """Tests for wake order correctness in generated scripts."""

    def test_roles_appear_in_wake_order(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """Werewolf (1) < Robber (3) < Seer (4) < Troublemaker (5) < Insomniac (9)."""
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        role_order = []
        for action in script.actions:
            if action.role_name != "Narrator" and action.role_name not in role_order:
                role_order.append(action.role_name)

        expected_order = ["Werewolf", "Robber", "Seer", "Troublemaker", "Insomniac"]
        assert role_order == expected_order

    def test_non_waking_roles_excluded(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """Villager has no wake_order so should not appear in script."""
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        role_names = {a.role_name for a in script.actions}
        assert "Villager" not in role_names


class TestScriptInstructions:
    """Tests for specific ability type instruction generation."""

    def test_werewolf_team_wake_instruction(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """Werewolf wake_target is team.werewolf."""
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        werewolf_actions = [a for a in script.actions if a.role_name == "Werewolf"]
        wake_action = werewolf_actions[0]
        assert "Werewolves, wake up" in wake_action.instruction

    def test_seer_has_or_modifier_step(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """Seer's second step has OR modifier."""
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        seer_actions = [a for a in script.actions if a.role_name == "Seer"]
        instructions = [a.instruction for a in seer_actions]
        or_instructions = [i for i in instructions if i.startswith("OR ")]
        assert len(or_instructions) == 1

    def test_each_waking_role_has_close_eyes(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        close_actions = [
            a
            for a in script.actions
            if "close your eyes" in a.instruction and a.role_name != "Narrator"
        ]
        # 5 waking roles all assigned to players
        assert len(close_actions) == 5

    def test_insomniac_view_own_card_instruction(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        game = _create_and_start_game_deterministic(db_session, seeded_roles)
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        insomniac_actions = [a for a in script.actions if a.role_name == "Insomniac"]
        instructions = [a.instruction for a in insomniac_actions]
        assert any("look at your own card" in i for i in instructions)


def _seer_create() -> RoleCreate:
    """Build a Seer-like RoleCreate payload."""
    return RoleCreate(
        name="Seer",
        description="View another player's card or two center cards.",
        team="village",
        wake_order=4,
        wake_target="player.self",
        votes=1,
        ability_steps=[
            AbilityStepCreateInRole(
                ability_type="view_card",
                order=1,
                modifier="none",
                is_required=True,
                parameters={"target": "player.other", "count": 1},
            ),
            AbilityStepCreateInRole(
                ability_type="view_card",
                order=2,
                modifier="or",
                is_required=True,
                parameters={"target": "center.main", "count": 2},
            ),
        ],
        win_conditions=[],
    )


def _werewolf_create() -> RoleCreate:
    """Build a Werewolf-like RoleCreate payload."""
    return RoleCreate(
        name="Werewolf",
        description="You wake with other werewolves.",
        team="werewolf",
        wake_order=1,
        wake_target="team.werewolf",
        votes=1,
        ability_steps=[
            AbilityStepCreateInRole(
                ability_type="view_awake",
                order=1,
                modifier="none",
                is_required=True,
                parameters={"target": "team.werewolf"},
            ),
            AbilityStepCreateInRole(
                ability_type="view_card",
                order=2,
                modifier="if",
                is_required=True,
                parameters={"target": "center.main"},
                condition_type="no_other_awake",
            ),
        ],
        win_conditions=[],
    )


def _doppelganger_create() -> RoleCreate:
    """Build a Doppelganger-like RoleCreate payload."""
    return RoleCreate(
        name="Doppelganger",
        description="Look at another player's card and become that role.",
        team="village",
        wake_order=0,
        wake_target="player.self",
        votes=1,
        ability_steps=[
            AbilityStepCreateInRole(
                ability_type="view_card",
                order=1,
                modifier="none",
                is_required=True,
                parameters={"target": "player.other"},
            ),
            AbilityStepCreateInRole(
                ability_type="copy_role",
                order=2,
                modifier="and",
                is_required=True,
                parameters={},
            ),
            AbilityStepCreateInRole(
                ability_type="perform_immediately",
                order=3,
                modifier="and",
                is_required=True,
                parameters={},
            ),
        ],
        win_conditions=[],
    )


def _ensure_abilities(db: Session) -> None:
    """Create ability records in DB if they don't exist yet."""
    needed = [
        ("view_card", "View Card", "View a card"),
        ("swap_card", "Swap Card", "Swap two cards"),
        ("view_awake", "View Awake", "See who else is awake"),
        ("copy_role", "Copy Role", "Copy another role"),
        ("perform_immediately", "Perform Immediately", "Perform copied role now"),
        ("take_card", "Take Card", "Take a card"),
        ("explicit_no_view", "Explicit No View", "Do not look"),
        ("change_to_team", "Change to Team", "Change team"),
        ("stop", "Stop", "Stop actions"),
        (
            "random_num_players",
            "Random Number of Players",
            "Select random number of players",
        ),
    ]
    import uuid

    existing = {a.type for a in db.query(Ability).all()}
    for atype, name, desc in needed:
        if atype not in existing:
            db.add(
                Ability(
                    id=uuid.uuid4(),
                    type=atype,
                    name=name,
                    description=desc,
                    parameters_schema={},
                    is_active=True,
                )
            )
    db.commit()


class TestPreviewRoleScript:
    """Tests for ScriptService.preview_role_script (AC2, AC4, AC5, AC6)."""

    def test_seer_preview_full_turn(self, db_session: Session) -> None:
        """AC2: Seer preview returns wake + view card + OR + close eyes."""
        from app.schemas.role import PreviewScriptRequest

        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = PreviewScriptRequest(
            name="Seer",
            wake_order=4,
            wake_target="player.self",
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"target": "player.other", "count": 1},
                ),
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=2,
                    modifier="or",
                    is_required=True,
                    parameters={"target": "center.main", "count": 2},
                ),
            ],
        )
        result = service.preview_role_script(data)

        instructions = [a.instruction for a in result.actions]
        assert instructions[0] == "Seer, wake up."
        assert "You may look at one other player's card." in instructions
        assert any(i.startswith("OR ") for i in instructions)
        assert instructions[-1] == "Seer, close your eyes."

    def test_werewolf_preview_team_wake(self, db_session: Session) -> None:
        """AC2: Werewolf preview has team wake instruction."""
        from app.schemas.role import PreviewScriptRequest

        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = PreviewScriptRequest(
            name="Werewolf",
            wake_order=1,
            wake_target="team.werewolf",
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="view_awake",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"target": "team.werewolf"},
                ),
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=2,
                    modifier="if",
                    is_required=True,
                    parameters={"target": "center.main"},
                    condition_type="no_other_awake",
                ),
            ],
        )
        result = service.preview_role_script(data)

        instructions = [a.instruction for a in result.actions]
        assert "Werewolves, wake up and look for other werewolves." in instructions
        assert instructions[-1] == "Werewolf, close your eyes."

    def test_non_waking_role_empty_actions(self, db_session: Session) -> None:
        """AC6: Non-waking role returns empty actions."""
        from app.schemas.role import PreviewScriptRequest

        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = PreviewScriptRequest(
            name="Villager",
            wake_order=None,
        )
        result = service.preview_role_script(data)

        assert result.actions == []

    def test_doppelganger_multi_section(self, db_session: Session) -> None:
        """AC4: Doppelganger-like preview has multi-section output.

        Uses a non-zero wake_order because wake_order==0 now correctly
        returns empty actions (AC3).
        """
        from app.schemas.role import PreviewScriptRequest

        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = PreviewScriptRequest(
            name="Doppelganger",
            wake_order=1,
            wake_target="player.self",
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"target": "player.other"},
                ),
                AbilityStepCreateInRole(
                    ability_type="copy_role",
                    order=2,
                    modifier="and",
                    is_required=True,
                    parameters={},
                ),
                AbilityStepCreateInRole(
                    ability_type="perform_immediately",
                    order=3,
                    modifier="and",
                    is_required=True,
                    parameters={},
                ),
            ],
        )

        result = service.preview_role_script(data)

        instructions = [a.instruction for a in result.actions]
        section_headers = [a for a in result.actions if a.is_section_header]
        assert len(section_headers) >= 1
        assert instructions[0] == "Doppelganger, wake up."
        assert any("close your eyes" in i for i in instructions)

    def test_no_abilities_returns_wake_and_close_only(
        self, db_session: Session
    ) -> None:
        """Waking role with no ability steps returns wake + close eyes."""
        from app.schemas.role import PreviewScriptRequest

        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = PreviewScriptRequest(
            name="Observer",
            wake_order=5,
            wake_target="player.self",
        )
        result = service.preview_role_script(data)

        assert len(result.actions) == 2
        assert result.actions[0].instruction == "Observer, wake up."
        assert result.actions[1].instruction == "Observer, close your eyes."

    def test_or_modifier_prefixed(self, db_session: Session) -> None:
        """OR modifier steps are prefixed with 'OR' in the instruction."""
        from app.schemas.role import PreviewScriptRequest

        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = PreviewScriptRequest(
            name="Seer",
            wake_order=4,
            wake_target="player.self",
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"target": "player.other", "count": 1},
                ),
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=2,
                    modifier="or",
                    is_required=True,
                    parameters={"target": "center.main", "count": 2},
                ),
            ],
        )
        result = service.preview_role_script(data)

        instructions = [a.instruction for a in result.actions]
        or_instructions = [i for i in instructions if i.startswith("OR ")]
        assert len(or_instructions) == 1
        assert "center" in or_instructions[0].lower()

    def test_actions_have_sequential_order(self, db_session: Session) -> None:
        """Actions should have sequential order numbers starting at 1."""
        from app.schemas.role import PreviewScriptRequest

        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = PreviewScriptRequest(
            name="Seer",
            wake_order=4,
            wake_target="player.self",
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"target": "player.other", "count": 1},
                ),
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=2,
                    modifier="or",
                    is_required=True,
                    parameters={"target": "center.main", "count": 2},
                ),
            ],
        )
        result = service.preview_role_script(data)

        orders = [a.order for a in result.actions]
        assert orders == list(range(1, len(orders) + 1))

    def test_perform_as_multi_section(self, db_session: Session) -> None:
        """AC4: perform_as step also triggers a section header."""
        _ensure_abilities(db_session)
        # Ensure perform_as ability exists
        import uuid
        from app.models.ability import Ability

        existing = {a.type for a in db_session.query(Ability).all()}
        if "perform_as" not in existing:
            db_session.add(
                Ability(
                    id=uuid.uuid4(),
                    type="perform_as",
                    name="Perform As",
                    description="Perform as copied role",
                    parameters_schema={},
                    is_active=True,
                )
            )
            db_session.commit()

        service = ScriptService(db_session)

        from app.schemas.role import PreviewScriptRequest

        data = PreviewScriptRequest(
            name="Mimic",
            wake_order=1,
            wake_target="player.self",
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"target": "player.other"},
                ),
                AbilityStepCreateInRole(
                    ability_type="copy_role",
                    order=2,
                    modifier="and",
                    is_required=True,
                    parameters={},
                ),
                AbilityStepCreateInRole(
                    ability_type="perform_as",
                    order=3,
                    modifier="and",
                    is_required=True,
                    parameters={},
                ),
            ],
        )

        result = service.preview_role_script(data)

        section_headers = [a for a in result.actions if a.is_section_header]
        assert len(section_headers) == 1
        assert "copied role" in section_headers[0].instruction.lower()


class TestPreviewEndpoint:
    """Integration tests for POST /roles/preview-script (AC5)."""

    def test_preview_returns_200_with_valid_payload(self, client) -> None:
        """AC5: Endpoint returns 200 with actions for valid payload."""
        payload = {
            "name": "Test Seer",
            "wake_order": 4,
            "wake_target": "player.self",
            "ability_steps": [
                {
                    "ability_type": "view_card",
                    "order": 1,
                    "modifier": "none",
                    "is_required": True,
                    "parameters": {"target": "player.other"},
                }
            ],
        }
        response = client.post("/api/roles/preview-script", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "actions" in data
        assert len(data["actions"]) >= 3  # wake + step + close

    def test_preview_returns_422_with_invalid_payload(self, client) -> None:
        """AC5: Endpoint returns 422 for truly invalid payload."""
        payload = {"wake_order": -1}  # Invalid: wake_order < 0
        response = client.post("/api/roles/preview-script", json=payload)

        assert response.status_code == 422


class TestPreviewScriptRequest:
    """Tests for PreviewScriptRequest schema (AC1)."""

    def test_preview_schema_accepts_minimal_fields(self) -> None:
        """AC1: Schema accepts only preview-relevant fields with defaults."""
        from app.schemas.role import PreviewScriptRequest

        data = PreviewScriptRequest()
        assert data.name == ""
        assert data.wake_order == 0
        assert data.wake_target is None
        assert data.ability_steps == []

    def test_preview_schema_accepts_all_fields(self) -> None:
        """AC1: Schema accepts all preview-relevant fields."""
        from app.schemas.role import PreviewScriptRequest

        data = PreviewScriptRequest(
            name="Seer",
            wake_order=4,
            wake_target="player.self",
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"target": "player.other"},
                ),
            ],
        )
        assert data.name == "Seer"
        assert data.wake_order == 4
        assert len(data.ability_steps) == 1

    def test_preview_schema_no_description_required(self) -> None:
        """AC1: Schema does NOT require description, team, votes, etc."""
        from app.schemas.role import PreviewScriptRequest

        # This should NOT raise — no description/team/votes needed
        data = PreviewScriptRequest(name="Test", wake_order=5)
        assert data.name == "Test"

    def test_preview_schema_empty_name_allowed(self) -> None:
        """AC1: Empty name does not trigger min_length validation."""
        from app.schemas.role import PreviewScriptRequest

        data = PreviewScriptRequest(name="", wake_order=5)
        assert data.name == ""

    def test_preview_schema_rejects_negative_wake_order(self) -> None:
        """AC1: wake_order must be >= 0 if set."""
        from app.schemas.role import PreviewScriptRequest
        import pydantic

        try:
            PreviewScriptRequest(wake_order=-1)
            assert False, "Should have raised validation error"
        except pydantic.ValidationError:
            pass


class TestPreviewEndpointMinimalPayload:
    """Integration tests for AC2: endpoint accepts minimal payload."""

    def test_preview_returns_200_minimal_payload(self, client) -> None:
        """AC2: Payload without description/team/votes returns 200."""
        payload = {
            "name": "Test Seer",
            "wake_order": 4,
            "wake_target": "player.self",
            "ability_steps": [
                {
                    "ability_type": "view_card",
                    "order": 1,
                    "modifier": "none",
                    "is_required": True,
                    "parameters": {"target": "player.other"},
                }
            ],
        }
        response = client.post("/api/roles/preview-script", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "actions" in data
        assert len(data["actions"]) >= 3  # wake + step + close

    def test_preview_no_description_returns_200(self, client) -> None:
        """AC2: Payload with no description/team/votes returns 200."""
        payload = {
            "name": "X",
            "wake_order": 5,
            "ability_steps": [],
        }
        response = client.post("/api/roles/preview-script", json=payload)

        assert response.status_code == 200

    def test_preview_empty_name_returns_200(self, client) -> None:
        """AC2: Empty name with wake_order > 0 returns 200, not 422."""
        payload = {
            "name": "",
            "wake_order": 5,
            "ability_steps": [],
        }
        response = client.post("/api/roles/preview-script", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert len(data["actions"]) == 2  # wake + close


class TestWakeOrderZero:
    """Tests for AC3: wake_order 0 returns empty actions."""

    def test_wake_order_zero_empty_actions(self, db_session: Session) -> None:
        """AC3: wake_order == 0 returns empty actions even with ability steps."""
        from app.schemas.role import PreviewScriptRequest

        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = PreviewScriptRequest(
            name="Doppelganger",
            wake_order=0,
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"target": "player.other"},
                ),
            ],
        )
        result = service.preview_role_script(data)

        assert result.actions == []

    def test_wake_order_none_empty_actions(self, db_session: Session) -> None:
        """AC3: wake_order == None returns empty actions."""
        from app.schemas.role import PreviewScriptRequest

        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = PreviewScriptRequest(
            name="Villager",
            wake_order=None,
        )
        result = service.preview_role_script(data)

        assert result.actions == []


class TestMissingInstructionTemplates:
    """Tests for the 5 missing ability instruction templates."""

    def test_change_to_team_with_param(self, db_session: Session) -> None:
        """AC1: change_to_team with team param produces team-specific text."""
        from app.services.script_service import (
            ScriptService,
            _StandInAbility,
            _StandInRole,
            _StandInStep,
        )
        from app.models.ability_step import StepModifier

        service = ScriptService(db_session)
        step = _StandInStep(
            ability=_StandInAbility(type="change_to_team"),
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={"team": "werewolf"},
        )
        role = _StandInRole(name="PI", wake_target="player.self")
        result = service._generate_step_instruction(role, step)

        assert result is not None
        assert "werewolf" in result.lower()

    def test_change_to_team_no_param(self, db_session: Session) -> None:
        """AC1: change_to_team without team param produces generic fallback."""
        from app.services.script_service import (
            ScriptService,
            _StandInAbility,
            _StandInRole,
            _StandInStep,
        )
        from app.models.ability_step import StepModifier

        service = ScriptService(db_session)
        step = _StandInStep(
            ability=_StandInAbility(type="change_to_team"),
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={},
        )
        role = _StandInRole(name="PI", wake_target="player.self")
        result = service._generate_step_instruction(role, step)

        assert result is not None
        assert isinstance(result, str)
        assert len(result) > 0

    def test_perform_as_instruction(self, db_session: Session) -> None:
        """AC2: perform_as produces instruction about copied role wake time."""
        from app.services.script_service import (
            ScriptService,
            _StandInAbility,
            _StandInRole,
            _StandInStep,
        )
        from app.models.ability_step import StepModifier

        service = ScriptService(db_session)
        step = _StandInStep(
            ability=_StandInAbility(type="perform_as"),
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={},
        )
        role = _StandInRole(name="Copycat", wake_target="player.self")
        result = service._generate_step_instruction(role, step)

        assert result is not None
        assert "copied role" in result.lower() or "wake" in result.lower()

    def test_perform_immediately_instruction(self, db_session: Session) -> None:
        """AC3: perform_immediately produces instruction about immediate action."""
        from app.services.script_service import (
            ScriptService,
            _StandInAbility,
            _StandInRole,
            _StandInStep,
        )
        from app.models.ability_step import StepModifier

        service = ScriptService(db_session)
        step = _StandInStep(
            ability=_StandInAbility(type="perform_immediately"),
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={},
        )
        role = _StandInRole(name="Doppelganger", wake_target="player.self")
        result = service._generate_step_instruction(role, step)

        assert result is not None
        assert "perform" in result.lower()

    def test_stop_instruction(self, db_session: Session) -> None:
        """AC4: stop produces instruction containing 'stop'."""
        from app.services.script_service import (
            ScriptService,
            _StandInAbility,
            _StandInRole,
            _StandInStep,
        )
        from app.models.ability_step import StepModifier

        service = ScriptService(db_session)
        step = _StandInStep(
            ability=_StandInAbility(type="stop"),
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={},
        )
        role = _StandInRole(name="PI", wake_target="player.self")
        result = service._generate_step_instruction(role, step)

        assert result is not None
        assert "stop" in result.lower()

    def test_random_num_players_with_options(self, db_session: Session) -> None:
        """AC5: random_num_players with options mentions the numbers."""
        from app.services.script_service import (
            ScriptService,
            _StandInAbility,
            _StandInRole,
            _StandInStep,
        )
        from app.models.ability_step import StepModifier

        service = ScriptService(db_session)
        step = _StandInStep(
            ability=_StandInAbility(type="random_num_players"),
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={"options": [2, 3, 4]},
        )
        role = _StandInRole(name="Blob", wake_target="player.self")
        result = service._generate_step_instruction(role, step)

        assert result is not None
        assert "2" in result
        assert "3" in result
        assert "4" in result

    def test_random_num_players_no_options(self, db_session: Session) -> None:
        """AC5: random_num_players without options produces generic fallback."""
        from app.services.script_service import (
            ScriptService,
            _StandInAbility,
            _StandInRole,
            _StandInStep,
        )
        from app.models.ability_step import StepModifier

        service = ScriptService(db_session)
        step = _StandInStep(
            ability=_StandInAbility(type="random_num_players"),
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={},
        )
        role = _StandInRole(name="Blob", wake_target="player.self")
        result = service._generate_step_instruction(role, step)

        assert result is not None
        assert isinstance(result, str)
        assert len(result) > 0

    def test_random_num_players_single_option(self, db_session: Session) -> None:
        """AC5: random_num_players with single option handles it correctly."""
        from app.services.script_service import (
            ScriptService,
            _StandInAbility,
            _StandInRole,
            _StandInStep,
        )
        from app.models.ability_step import StepModifier

        service = ScriptService(db_session)
        step = _StandInStep(
            ability=_StandInAbility(type="random_num_players"),
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={"options": [3]},
        )
        role = _StandInRole(name="Blob", wake_target="player.self")
        result = service._generate_step_instruction(role, step)

        assert result is not None
        assert "3" in result

    def test_all_15_types_produce_instructions(self, db_session: Session) -> None:
        """AC6/AC7: All 15 ability types return non-None from _generate_step_instruction."""
        from app.services.script_service import (
            ScriptService,
            _StandInAbility,
            _StandInRole,
            _StandInStep,
        )
        from app.models.ability_step import StepModifier

        all_types = [
            "view_card",
            "swap_card",
            "take_card",
            "view_awake",
            "thumbs_up",
            "explicit_no_view",
            "rotate_all",
            "touch",
            "flip_card",
            "copy_role",
            "change_to_team",
            "perform_as",
            "perform_immediately",
            "stop",
            "random_num_players",
        ]

        service = ScriptService(db_session)
        role = _StandInRole(name="TestRole", wake_target="player.self")

        for ability_type in all_types:
            step = _StandInStep(
                ability=_StandInAbility(type=ability_type),
                order=1,
                modifier=StepModifier.NONE,
                is_required=True,
                parameters={},
            )
            result = service._generate_step_instruction(role, step)
            assert result is not None, f"{ability_type} returned None"

    def test_pi_preview_has_change_to_team_and_stop(self, db_session: Session) -> None:
        """AC9: Paranormal Investigator preview includes change_to_team + stop text."""
        from app.schemas.role import PreviewScriptRequest, AbilityStepCreateInRole

        _ensure_abilities(db_session)

        service = ScriptService(db_session)
        data = PreviewScriptRequest(
            name="Paranormal Investigator",
            wake_order=4,
            wake_target="player.self",
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"target": "player.other", "count": 2},
                ),
                AbilityStepCreateInRole(
                    ability_type="change_to_team",
                    order=2,
                    modifier="if",
                    is_required=True,
                    parameters={"team": "werewolf"},
                    condition_type="only_if_team",
                    condition_params={"team": "werewolf"},
                ),
                AbilityStepCreateInRole(
                    ability_type="stop",
                    order=3,
                    modifier="and",
                    is_required=True,
                    parameters={},
                ),
            ],
        )
        result = service.preview_role_script(data)
        instructions = [a.instruction for a in result.actions]

        # Should have change_to_team instruction
        assert any("werewolf" in i.lower() for i in instructions), (
            f"No change_to_team instruction found in: {instructions}"
        )
        # Should have stop instruction
        assert any("stop" in i.lower() for i in instructions), (
            f"No stop instruction found in: {instructions}"
        )

    def test_blob_preview_has_random_num_players(self, db_session: Session) -> None:
        """AC10: Blob preview includes random_num_players text with options."""
        from app.schemas.role import PreviewScriptRequest, AbilityStepCreateInRole

        _ensure_abilities(db_session)

        service = ScriptService(db_session)
        data = PreviewScriptRequest(
            name="Blob",
            wake_order=10,
            wake_target="player.self",
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="random_num_players",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"options": [2, 3, 4]},
                ),
            ],
        )
        result = service.preview_role_script(data)
        instructions = [a.instruction for a in result.actions]

        # Should have random_num_players instruction with options
        assert any("2" in i and "3" in i and "4" in i for i in instructions), (
            f"No random_num_players instruction with options in: {instructions}"
        )

    def test_doppelganger_preview_has_perform_immediately(
        self, db_session: Session
    ) -> None:
        """AC8: Doppelganger preview (wake_order > 0) includes perform_immediately text."""
        from app.schemas.role import PreviewScriptRequest, AbilityStepCreateInRole

        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = PreviewScriptRequest(
            name="Doppelganger",
            wake_order=1,
            wake_target="player.self",
            ability_steps=[
                AbilityStepCreateInRole(
                    ability_type="view_card",
                    order=1,
                    modifier="none",
                    is_required=True,
                    parameters={"target": "player.other"},
                ),
                AbilityStepCreateInRole(
                    ability_type="copy_role",
                    order=2,
                    modifier="and",
                    is_required=True,
                    parameters={},
                ),
                AbilityStepCreateInRole(
                    ability_type="perform_immediately",
                    order=3,
                    modifier="and",
                    is_required=True,
                    parameters={},
                ),
            ],
        )
        result = service.preview_role_script(data)
        instructions = [a.instruction for a in result.actions]

        # Should have perform_immediately instruction
        assert any("perform" in i.lower() for i in instructions), (
            f"No perform_immediately instruction found in: {instructions}"
        )


class TestNightScriptExcludesWakeOrderZero:
    """Tests for AC4: generate_night_script excludes wake_order == 0."""

    def test_night_script_excludes_wake_order_zero(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """AC4: Roles with wake_order == 0 do not appear in the night script."""
        import uuid

        # Create a role with wake_order == 0 and add it to the game as a player
        zero_role = Role(
            id=uuid.uuid4(),
            name="TestZeroWake",
            description="Test role with wake_order 0",
            team="village",
            wake_order=0,
            votes=1,
        )
        db_session.add(zero_role)
        db_session.commit()
        db_session.refresh(zero_role)

        seeded_roles.append(zero_role)
        # Include zero_role (index 8) as a player by replacing a non-waking Villager
        role_indices = [0, 1, 8, 3, 4, 5, 6, 7]

        game = _create_and_start_game_deterministic(
            db_session, seeded_roles, role_indices
        )
        script_service = ScriptService(db_session)

        script = script_service.generate_night_script(game)

        role_names = {a.role_name for a in script.actions}
        assert "TestZeroWake" not in role_names
