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
        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        result = service.preview_role_script(_seer_create())

        instructions = [a.instruction for a in result.actions]
        assert instructions[0] == "Seer, wake up."
        assert "You may look at one other player's card." in instructions
        assert any(i.startswith("OR ") for i in instructions)
        assert instructions[-1] == "Seer, close your eyes."

    def test_werewolf_preview_team_wake(self, db_session: Session) -> None:
        """AC2: Werewolf preview has team wake instruction."""
        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        result = service.preview_role_script(_werewolf_create())

        instructions = [a.instruction for a in result.actions]
        assert "Werewolves, wake up and look for other werewolves." in instructions
        assert instructions[-1] == "Werewolf, close your eyes."

    def test_non_waking_role_empty_actions(self, db_session: Session) -> None:
        """AC6: Non-waking role returns empty actions."""
        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = RoleCreate(
            name="Villager",
            description="No abilities",
            team="village",
            wake_order=None,
            votes=1,
            ability_steps=[],
            win_conditions=[],
        )
        result = service.preview_role_script(data)

        assert result.actions == []

    def test_doppelganger_multi_section(self, db_session: Session) -> None:
        """AC4: Doppelganger preview has multi-section output."""
        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        result = service.preview_role_script(_doppelganger_create())

        instructions = [a.instruction for a in result.actions]
        section_headers = [a for a in result.actions if a.is_section_header]
        # Should have at least one section header for the second wake
        assert len(section_headers) >= 1
        # First instruction should be the wake
        assert instructions[0] == "Doppelganger, wake up."
        # Should have close eyes
        assert any("close your eyes" in i for i in instructions)

    def test_no_abilities_returns_wake_and_close_only(
        self, db_session: Session
    ) -> None:
        """Waking role with no ability steps returns wake + close eyes."""
        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        data = RoleCreate(
            name="Observer",
            description="Just wakes up",
            team="village",
            wake_order=5,
            wake_target="player.self",
            votes=1,
            ability_steps=[],
            win_conditions=[],
        )
        result = service.preview_role_script(data)

        assert len(result.actions) == 2
        assert result.actions[0].instruction == "Observer, wake up."
        assert result.actions[1].instruction == "Observer, close your eyes."

    def test_or_modifier_prefixed(self, db_session: Session) -> None:
        """OR modifier steps are prefixed with 'OR' in the instruction."""
        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        result = service.preview_role_script(_seer_create())

        instructions = [a.instruction for a in result.actions]
        or_instructions = [i for i in instructions if i.startswith("OR ")]
        assert len(or_instructions) == 1
        assert "center" in or_instructions[0].lower()

    def test_actions_have_sequential_order(self, db_session: Session) -> None:
        """Actions should have sequential order numbers starting at 1."""
        _ensure_abilities(db_session)
        service = ScriptService(db_session)

        result = service.preview_role_script(_seer_create())

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
        data = RoleCreate(
            name="Mimic",
            description="Copies and performs as another role.",
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
                    ability_type="perform_as",
                    order=3,
                    modifier="and",
                    is_required=True,
                    parameters={},
                ),
            ],
            win_conditions=[],
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
            "description": "A test seer",
            "team": "village",
            "wake_order": 4,
            "wake_target": "player.self",
            "votes": 1,
            "ability_steps": [
                {
                    "ability_type": "view_card",
                    "order": 1,
                    "modifier": "none",
                    "is_required": True,
                    "parameters": {"target": "player.other"},
                }
            ],
            "win_conditions": [],
        }
        response = client.post("/api/roles/preview-script", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert "actions" in data
        assert len(data["actions"]) >= 3  # wake + step + close

    def test_preview_returns_422_with_invalid_payload(self, client) -> None:
        """AC5: Endpoint returns 422 for invalid payload."""
        payload = {"name": ""}  # Missing required fields
        response = client.post("/api/roles/preview-script", json=payload)

        assert response.status_code == 422
