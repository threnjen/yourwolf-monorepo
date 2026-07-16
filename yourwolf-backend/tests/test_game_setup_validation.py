"""Tests for the game-setup rule module.

Two layers live here:

* ``TestValidateGameSetup`` — direct unit tests of the extracted seam,
  including the rule precedence order, which is an observable contract.
* The remaining classes — game-setup rule tests relocated from
  ``test_game_service.py``. They drive rules through ``GameService.create_game``
  and therefore double as delegation coverage.
"""

import uuid
from typing import Any

import pytest
from sqlalchemy.orm import Session

from app.exceptions import DomainValidationError
from app.models.role import Role, Team
from app.schemas.game import GameSessionCreate
from app.services.game_service import GameService
from app.services.game_setup_validation import validate_game_setup


def _valid_role_ids(role_map: dict[str, Role]) -> list[uuid.UUID]:
    """Build an 8-card role_ids list that satisfies every setup rule."""
    return [
        role_map["Werewolf"].id,
        role_map["Werewolf"].id,
        role_map["Seer"].id,
        role_map["Robber"].id,
        role_map["Villager"].id,
        role_map["Villager"].id,
        role_map["Villager"].id,
        role_map["Insomniac"].id,
    ]


class TestValidateGameSetup:
    """Direct unit tests for the extracted validate_game_setup seam."""

    def test_returns_no_warnings_for_a_valid_setup(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """A fully valid setup validates cleanly and yields no warnings."""
        role_map = seeded_roles_with_deps["role_map"]

        result = validate_game_setup(
            db_session,
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=_valid_role_ids(role_map),
            ),
        )

        assert result.warnings == []
        assert result.wake_order_sequence is None

    def test_normalizes_wake_order_sequence_to_strings(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """A valid wake_order_sequence is normalized to storable strings."""
        role_map = seeded_roles_with_deps["role_map"]
        role_ids = _valid_role_ids(role_map)
        sequence = [
            role_map["Werewolf"].id,
            role_map["Robber"].id,
            role_map["Seer"].id,
            role_map["Insomniac"].id,
        ]

        result = validate_game_setup(
            db_session,
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
                wake_order_sequence=sequence,
            ),
        )

        assert result.wake_order_sequence == [str(uid) for uid in sequence]

    def test_raises_domain_validation_error_for_a_broken_setup(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """A rule violation raises rather than returning an error list."""
        role_map = seeded_roles_with_deps["role_map"]

        with pytest.raises(DomainValidationError):
            validate_game_setup(
                db_session,
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=[role_map["Villager"].id],
                ),
            )


class TestGameSetupRulePrecedence:
    """The order rules fire in is observable and must not drift.

    A payload that violates several rules at once must surface the *first*
    rule in evaluation order. These tests pin that order at the seam.
    """

    def test_count_rule_precedes_unknown_role_id_check(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Wrong card total is reported before an unknown role ID."""
        role_map = seeded_roles_with_deps["role_map"]

        with pytest.raises(DomainValidationError, match="Must select exactly"):
            validate_game_setup(
                db_session,
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=[role_map["Werewolf"].id, uuid.uuid4()],
                ),
            )

    def test_unknown_role_id_precedes_card_count_rule(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """An unknown role ID is reported before min/max card counts."""
        role_map = seeded_roles_with_deps["role_map"]
        role_ids = _valid_role_ids(role_map)
        # Werewolf max_count=2; a third would trip the card-count rule, but the
        # unknown ID must win.
        role_ids[2] = role_map["Werewolf"].id
        role_ids[3] = uuid.uuid4()

        with pytest.raises(DomainValidationError, match="Unknown role IDs"):
            validate_game_setup(
                db_session,
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                ),
            )

    def test_card_count_rule_precedes_primary_team_rule(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """Card counts are reported before a missing primary team role."""
        role_map = seeded_roles_with_deps["role_map"]
        # Minion is a WEREWOLF-team role that is not primary, so the primary
        # team rule would also fire. Three Werewolves would exceed max_count=2,
        # so use four Minions to trip min/max without adding a primary.
        role_ids = [
            role_map["Minion"].id,
            role_map["Minion"].id,
            role_map["Seer"].id,
            role_map["Robber"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Insomniac"].id,
        ]

        with pytest.raises(DomainValidationError, match="at most 1"):
            validate_game_setup(
                db_session,
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                ),
            )

    def test_primary_team_rule_precedes_dependency_rule(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """A missing primary team role is reported before a missing dependency.

        Squire is a non-primary werewolf-team role, so omitting Werewolf leaves
        that team without a primary. Apprentice Tanner REQUIRES Tanner, which is
        also absent. Both rules fire; the primary team rule must win.
        """
        role_map = seeded_roles_with_deps["role_map"]
        role_ids = [
            role_map["Squire"].id,
            role_map["Apprentice Tanner"].id,
            role_map["Seer"].id,
            role_map["Robber"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Insomniac"].id,
        ]

        with pytest.raises(
            DomainValidationError, match="requires at least one primary"
        ):
            validate_game_setup(
                db_session,
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                ),
            )

    def test_dependency_rule_precedes_wake_sequence_rule(
        self, db_session: Session, seeded_roles_with_deps: dict[str, Any]
    ) -> None:
        """A missing dependency is reported before a bad wake_order_sequence.

        Apprentice Tanner REQUIRES Tanner, which is absent. The empty sequence
        would also trip the wake-sequence rule; the dependency rule must win.
        """
        role_map = seeded_roles_with_deps["role_map"]
        role_ids = [
            role_map["Werewolf"].id,
            role_map["Werewolf"].id,
            role_map["Apprentice Tanner"].id,
            role_map["Seer"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Villager"].id,
            role_map["Insomniac"].id,
        ]

        with pytest.raises(DomainValidationError, match="requires 'Tanner'"):
            validate_game_setup(
                db_session,
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                    wake_order_sequence=[],
                ),
            )


class TestCreateGameUnknownRoleIds:
    """Tests for rejecting unknown role IDs in game creation."""

    def test_create_game_unknown_role_ids(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """Game creation raises DomainValidationError for unknown role UUIDs."""
        service = GameService(db_session)
        valid_ids = [r.id for r in seeded_roles[:7]]
        unknown_id = uuid.uuid4()
        role_ids = valid_ids + [unknown_id]

        with pytest.raises(DomainValidationError, match=str(unknown_id)):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

    def test_create_game_multiple_unknown_role_ids(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """DomainValidationError lists all unknown IDs when multiple are unknown."""
        service = GameService(db_session)
        valid_ids = [r.id for r in seeded_roles[:6]]
        unknown1 = uuid.uuid4()
        unknown2 = uuid.uuid4()
        role_ids = valid_ids + [unknown1, unknown2]

        with pytest.raises(DomainValidationError, match="Unknown role IDs"):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )


class TestRoleCountMatchesPlayersAndCenter:
    """Role count must equal player_count + center_card_count.

    Relocated from the games router guard (AC1): calling ``create_game``
    directly now enforces this rule, so the service is authoritative.
    """

    def test_rejects_too_few_roles(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:5]]

        with pytest.raises(
            DomainValidationError,
            match=r"Must select exactly 8 roles \(5 players \+ 3 center\)",
        ):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

    def test_rejects_too_many_roles(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]

        with pytest.raises(
            DomainValidationError,
            match=r"Must select exactly 7 roles \(4 players \+ 3 center\)",
        ):
            service.create_game(
                GameSessionCreate(
                    player_count=4,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

    def test_accepts_exact_role_count(
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

    def test_count_rule_precedes_unknown_role_id_check(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """AC1: the count rule reports first when a payload also has unknown IDs.

        The deleted router guard ran before any service rule, so a payload
        violating both reported the count error. Placement inside
        ``create_game`` preserves that precedence; this pins it.
        """
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:4]] + [uuid.uuid4()]

        with pytest.raises(DomainValidationError) as exc_info:
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                )
            )

        message = str(exc_info.value)
        assert "Must select exactly 8 roles (5 players + 3 center)" in message
        assert "Unknown role IDs" not in message


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

        with pytest.raises(DomainValidationError, match="at most 2"):
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

        with pytest.raises(DomainValidationError, match="at least 2"):
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

        with pytest.raises(DomainValidationError, match="requires.*Tanner"):
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

        with pytest.raises(DomainValidationError, match="(?i)werewolf"):
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

        with pytest.raises(DomainValidationError, match="(?i)werewolf"):
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

        with pytest.raises(DomainValidationError) as exc_info:
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


class TestWakeOrderSequenceValidation:
    """Tests for wake_order_sequence validation in create_game (AC5-AC9)."""

    def test_stores_valid_wake_order_sequence(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """AC5: Valid sequence is stored and returned."""
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]
        # Waking roles: Werewolf(1), Seer(4), Insomniac(9), Robber(3), Troublemaker(5)
        waking_ids = [r.id for r in seeded_roles[:5]]
        # Custom order: reverse of default
        sequence = list(reversed(waking_ids))

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
                wake_order_sequence=sequence,
            )
        )

        assert game.wake_order_sequence == sequence

    def test_rejects_extra_role_in_sequence(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """AC6: Sequence with role ID not in role_ids is rejected."""
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]
        waking_ids = [r.id for r in seeded_roles[:5]]
        # Add an extra random ID
        sequence = waking_ids + [uuid.uuid4()]

        with pytest.raises(DomainValidationError, match="not in.*role_ids"):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                    wake_order_sequence=sequence,
                )
            )

    def test_rejects_missing_waking_role_in_sequence(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """AC7: Sequence missing a waking role from role_ids is rejected."""
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]
        # Only include 4 of 5 waking roles
        sequence = [r.id for r in seeded_roles[:4]]

        with pytest.raises(DomainValidationError, match="[Mm]issing.*waking"):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                    wake_order_sequence=sequence,
                )
            )

    def test_rejects_duplicate_ids_in_sequence(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """AC8: Sequence with duplicate IDs is rejected."""
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]
        waking_ids = [r.id for r in seeded_roles[:5]]
        # Duplicate the first one
        sequence = waking_ids + [waking_ids[0]]

        with pytest.raises(DomainValidationError, match="[Dd]uplicate"):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                    wake_order_sequence=sequence,
                )
            )

    def test_accepts_null_sequence(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """AC9: Null/omitted wake_order_sequence is accepted."""
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
            )
        )

        assert game.wake_order_sequence is None

    def test_accepts_empty_sequence_no_waking_roles(self, db_session: Session) -> None:
        """Empty sequence is valid when no waking roles are selected."""
        from app.models.role import Visibility

        # Create 8 non-waking roles
        roles = []
        for i in range(8):
            role = Role(
                id=uuid.uuid4(),
                name=f"Villager{i}",
                description="A villager",
                team=Team.VILLAGE,
                wake_order=None,
                visibility=Visibility.OFFICIAL,
            )
            db_session.add(role)
            roles.append(role)
        db_session.commit()

        service = GameService(db_session)
        role_ids = [r.id for r in roles]

        game = service.create_game(
            GameSessionCreate(
                player_count=5,
                center_card_count=3,
                role_ids=role_ids,
                wake_order_sequence=[],
            )
        )

        assert game.wake_order_sequence == []

    def test_rejects_non_waking_role_in_sequence(
        self, db_session: Session, seeded_roles: list[Role]
    ) -> None:
        """Sequence containing a non-waking role is rejected."""
        service = GameService(db_session)
        role_ids = [r.id for r in seeded_roles[:8]]
        waking_ids = [r.id for r in seeded_roles[:5]]
        # Replace one waking role with a non-waking one (Villager at index 5)
        non_waking_id = seeded_roles[5].id
        sequence = waking_ids + [non_waking_id]

        with pytest.raises(DomainValidationError, match="not.*waking"):
            service.create_game(
                GameSessionCreate(
                    player_count=5,
                    center_card_count=3,
                    role_ids=role_ids,
                    wake_order_sequence=sequence,
                )
            )
