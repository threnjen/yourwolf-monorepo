"""Tests for GameService."""

import uuid
from typing import Any

import pytest
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

    def test_returns_none_for_nonexistent_game(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        import uuid

        service = GameService(db_session)

        result = service.start_game(uuid.uuid4())

        assert result is None

    def test_raises_400_if_not_in_setup_phase(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        game = self._create_game(service, seeded_roles)
        service.start_game(game.id)

        with pytest.raises(ValueError, match="not in setup phase"):
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

        with pytest.raises(ValueError, match="already in complete phase"):
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


class TestCardCountValidation:
    """Tests for card count enforcement in game creation."""

    def test_rejects_exceeding_max_count(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Game creation fails when a role exceeds its max_count."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        # Werewolf max_count=2, include 3
        ww = role_map["Werewolf"]
        seer = role_map["Seer"]
        villager = role_map["Villager"]
        role_ids = [
            ww.id,
            ww.id,
            ww.id,
            seer.id,
            villager.id,
            villager.id,
            villager.id,
            role_map["Robber"].id,
        ]

        with pytest.raises(ValueError, match="at most 2"):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

    def test_rejects_below_min_count(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Game creation fails when a role is below its min_count."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        # Mason min_count=2, include only 1
        mason = role_map["Mason"]
        roles = seeded_roles_with_deps["roles"]
        # Build 8 cards: 1 Mason + 7 others
        other_ids = [
            r.id for r in roles if r.name not in ("Mason", "Apprentice Tanner")
        ][:7]
        role_ids = [mason.id] + other_ids

        with pytest.raises(ValueError, match="at least 2"):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

    def test_accepts_valid_card_counts(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Game creation succeeds with valid card counts."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        # 2 Werewolves (within 1-2), 1 Seer, 1 Robber, 1 Troublemaker,
        # 1 Insomniac, 2 Villagers (within 1-3) = 8 total
        role_ids = [
            role_map["Werewolf"].id,
            role_map["Werewolf"].id,
            role_map["Seer"].id,
            role_map["Robber"].id,
            role_map["Troublemaker"].id,
            role_map["Insomniac"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
        ]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        assert game.id is not None
        assert len(game.game_roles) == 8


class TestDependencyValidation:
    """Tests for role dependency enforcement in game creation."""

    def test_rejects_missing_required_dependency(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Game creation fails when a 'requires' dependency is missing."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        # Apprentice Tanner requires Tanner, but Tanner not included
        app_tanner = role_map["Apprentice Tanner"]
        role_ids = [
            role_map["Werewolf"].id,
            role_map["Werewolf"].id,
            role_map["Seer"].id,
            role_map["Robber"].id,
            app_tanner.id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
        ]

        with pytest.raises(ValueError, match="requires.*Tanner"):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

    def test_accepts_satisfied_required_dependency(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Game creation succeeds when required dependency is present."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        # Apprentice Tanner with Tanner — both present
        role_ids = [
            role_map["Werewolf"].id,
            role_map["Werewolf"].id,
            role_map["Seer"].id,
            role_map["Apprentice Tanner"].id,
            role_map["Tanner"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
        ]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        assert game.id is not None

    def test_warns_on_missing_recommends_dependency(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Game creation succeeds but returns warnings for recommends deps."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        # Beholder recommends Seer, but no Seer included
        role_ids = [
            role_map["Beholder"].id,
            role_map["Werewolf"].id,
            role_map["Robber"].id,
            role_map["Troublemaker"].id,
            role_map["Insomniac"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
        ]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        assert game.id is not None
        assert len(game.warnings) == 1
        assert "Beholder" in game.warnings[0]
        assert "Seer" in game.warnings[0]

    def test_no_warnings_when_recommends_satisfied(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """No warnings when recommended dependencies are present."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        # Beholder + Seer both present
        role_ids = [
            role_map["Beholder"].id,
            role_map["Werewolf"].id,
            role_map["Seer"].id,
            role_map["Robber"].id,
            role_map["Troublemaker"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
        ]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        assert game.warnings == []


class TestPrimaryTeamRoleValidation:
    """Tests for primary team role enforcement in game creation."""

    def test_rejects_game_with_only_minion_no_primary_wolf(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Game creation fails when Minion is selected without any primary wolf."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        role_ids = [
            role_map["Minion"].id,
            role_map["Seer"].id,
            role_map["Robber"].id,
            role_map["Troublemaker"].id,
            role_map["Insomniac"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
        ]

        with pytest.raises(ValueError, match="(?i)werewolf"):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

    def test_accepts_game_with_werewolf_and_minion(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Game creation succeeds when Werewolf (primary) + Minion are present."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        role_ids = [
            role_map["Werewolf"].id,
            role_map["Minion"].id,
            role_map["Seer"].id,
            role_map["Robber"].id,
            role_map["Troublemaker"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
        ]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        assert game.id is not None

    def test_rejects_game_with_only_squire_no_primary_wolf(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Game creation fails when Squire is selected without any primary wolf."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        role_ids = [
            role_map["Squire"].id,
            role_map["Seer"].id,
            role_map["Robber"].id,
            role_map["Troublemaker"].id,
            role_map["Insomniac"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
        ]

        with pytest.raises(ValueError, match="(?i)werewolf"):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

    def test_rejects_multiple_teams_each_missing_primary(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Error names all teams missing a primary role."""
        role_map = seeded_roles_with_deps["role_map"]
        service = GameService(db_session)

        # Create a non-primary vampire role for a second bad team
        from app.models.role import Visibility

        vampire_minion = Role(
            name="Vampire Minion",
            description="A vampire supporter",
            team=Team("vampire"),
            visibility=Visibility.OFFICIAL,
            is_locked=True,
            is_primary_team_role=False,
        )
        db_session.add(vampire_minion)
        db_session.commit()
        db_session.refresh(vampire_minion)

        # Squire (werewolf, non-primary) + Vampire Minion (vampire, non-primary)
        role_ids = [
            role_map["Squire"].id,
            vampire_minion.id,
            role_map["Seer"].id,
            role_map["Robber"].id,
            role_map["Troublemaker"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
        ]

        with pytest.raises(ValueError) as exc_info:
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

        error_msg = str(exc_info.value).lower()
        assert "werewolf" in error_msg
        assert "vampire" in error_msg
