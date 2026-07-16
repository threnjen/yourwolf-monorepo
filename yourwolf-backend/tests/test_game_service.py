"""Tests for GameService."""

import uuid
from typing import Any

import pytest
from app.exceptions import DomainValidationError, NotFoundError
from app.models.game_session import GamePhase
from app.models.role import Role, Team
from app.schemas.game import GameSessionCreate
from app.services.game_service import GameService
from sqlalchemy.orm import Session


class TestCreateGame:
    """Tests for GameService.create_game."""

    def test_creates_game_in_setup_phase(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                discussion_timer_seconds=300,
                role_ids=role_ids,
            )
        )

        assert game.id is not None
        assert game.phase == GamePhase.SETUP
        assert game.player_count == 5
        assert game.center_card_count == 3
        assert game.discussion_timer_seconds == 300

    def test_creates_correct_number_of_game_roles(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        assert len(game.game_roles) == 8

    def test_game_roles_reference_correct_role_ids(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        returned_role_ids = sorted(str(gr.role_id) for gr in game.game_roles)
        expected_role_ids = sorted(str(rid) for rid in role_ids)
        assert returned_role_ids == expected_role_ids

    def test_timestamps_set_on_creation(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        assert game.created_at is not None
        assert game.started_at is None
        assert game.ended_at is None


class TestStartGame:
    """Tests for GameService.start_game."""

    def _create_game(
        self, service: GameService, seeded_roles: list[Role]
    ) -> "GameSessionResponse":
        role_ids = [r.id for r in seeded_roles[:8]]
        return service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

    def test_advances_to_night_phase(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_game(service, seeded_roles)

        started = service.start_game(game.id)

        assert started is not None
        assert started.phase == GamePhase.NIGHT

    def test_sets_started_at_timestamp(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_game(service, seeded_roles)

        started = service.start_game(game.id)

        assert started.started_at is not None

    def test_assigns_players_and_center(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_game(service, seeded_roles)

        started = service.start_game(game.id)

        player_roles = [gr for gr in started.game_roles if not gr.is_center]
        center_roles = [gr for gr in started.game_roles if gr.is_center]
        assert len(player_roles) == 5
        assert len(center_roles) == 3

    def test_all_positions_assigned(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_game(service, seeded_roles)

        started = service.start_game(game.id)

        assert all(gr.position is not None for gr in started.game_roles)

    def test_player_teams_initialized(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_game(service, seeded_roles)

        started = service.start_game(game.id)

        player_roles = [gr for gr in started.game_roles if not gr.is_center]
        assert all(gr.role_team is not None for gr in player_roles)

    def test_increments_role_use_count(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_game(service, seeded_roles)

        service.start_game(game.id)

        for role in seeded_roles[:8]:
            db_session.refresh(role)
            assert role.use_count == 1

    def test_raises_not_found_error_for_nonexistent_game(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)

        with pytest.raises(NotFoundError, match="Game not found"):
            service.start_game(uuid.uuid4())

    def test_raises_400_if_not_in_setup_phase(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_game(service, seeded_roles)
        service.start_game(game.id)

        with pytest.raises(DomainValidationError, match="not in setup phase"):
            service.start_game(game.id)


class TestAdvancePhase:
    """Tests for GameService.advance_phase."""

    def _create_and_start_game(
        self, service: GameService, seeded_roles: list[Role]
    ) -> "GameSessionResponse":
        role_ids = [r.id for r in seeded_roles[:8]]
        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )
        return service.start_game(game.id)

    def test_advances_through_all_phases(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_and_start_game(service, seeded_roles)

        game = service.advance_phase(game.id)
        assert game.phase == GamePhase.DISCUSSION

        game = service.advance_phase(game.id)
        assert game.phase == GamePhase.VOTING

        game = service.advance_phase(game.id)
        assert game.phase == GamePhase.RESOLUTION

        game = service.advance_phase(game.id)
        assert game.phase == GamePhase.COMPLETE

    def test_sets_ended_at_on_complete(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_and_start_game(service, seeded_roles)

        service.advance_phase(game.id)  # discussion
        service.advance_phase(game.id)  # voting
        service.advance_phase(game.id)  # resolution
        game = service.advance_phase(game.id)  # complete

        assert game.ended_at is not None

    def test_raises_400_when_already_complete(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_and_start_game(service, seeded_roles)

        for _ in range(4):
            game = service.advance_phase(game.id)

        with pytest.raises(DomainValidationError, match="already in complete phase"):
            service.advance_phase(game.id)

    def test_returns_none_for_nonexistent_game(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        import uuid

        service = GameService(db_session)

        result = service.advance_phase(uuid.uuid4())

        assert result is None


class TestGetGame:
    """Tests for GameService.get_game."""

    def test_returns_game_by_id(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]
        created = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        game = service.get_game(created.id)

        assert game is not None
        assert game.id == created.id

    def test_returns_none_for_nonexistent_id(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        import uuid

        service = GameService(db_session)

        result = service.get_game(uuid.uuid4())

        assert result is None


class TestListGames:
    """Tests for GameService.list_games."""

    def test_lists_all_games(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]
        for _ in range(3):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

        result = service.list_games()

        assert result.total == 3
        assert len(result.items) == 3
        assert result.page == 1
        assert result.pages == 1

    def test_filters_by_phase(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]

        game1 = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )
        service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )
        service.start_game(game1.id)

        setup_result = service.list_games(phase=GamePhase.SETUP)
        night_result = service.list_games(phase=GamePhase.NIGHT)

        assert setup_result.total == 1
        assert len(setup_result.items) == 1
        assert night_result.total == 1
        assert len(night_result.items) == 1

    def test_paginates_results(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]
        for _ in range(5):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

        page1 = service.list_games(page=1, limit=2)
        page2 = service.list_games(page=2, limit=2)

        assert len(page1.items) == 2
        assert page1.total == 5
        assert page1.page == 1
        assert page1.limit == 2
        assert page1.pages == 3
        assert len(page2.items) == 2
        assert page2.page == 2


class TestDeleteGame:
    """Tests for GameService.delete_game."""

    def test_deletes_existing_game(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]
        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        result = service.delete_game(game.id)

        assert result is True
        assert service.get_game(game.id) is None

    def test_returns_false_for_nonexistent_game(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        import uuid

        service = GameService(db_session)

        result = service.delete_game(uuid.uuid4())

        assert result is False
