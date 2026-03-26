"""Tests for ScriptService."""

from sqlalchemy.orm import Session

from app.models.game_role import GameRole
from app.models.game_session import GamePhase, GameSession
from app.models.role import Role
from app.schemas.game import GameSessionCreate
from app.services.game_service import GameService
from app.services.script_service import ScriptService


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
        assert script.actions[-1].instruction == "Everyone, wake up!"

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
