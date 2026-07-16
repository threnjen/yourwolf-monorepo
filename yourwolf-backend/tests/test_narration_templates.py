"""Parity oracle for narration instruction templates.

These tables pin the EXACT narrator copy produced for every template branch.
The English copy is frozen (feature 10, AC4): any diff in these strings is a
behavior change, not a refactor.

The expectation tables below were captured from the pre-refactor
``ScriptService`` implementation and are intentionally verbatim. They are also
the parity contract for the Phase 04 TypeScript engine port — a TS
implementation is correct exactly when it reproduces these strings.

Only the thin adapter at the top of this file may change when the narration
package moves; the tables must not.
"""

from typing import Any

import pytest

from app.models.ability_step import StepModifier
from app.services.narration.inputs import AbilityStepInput, RoleScriptInput
from app.services.narration.templates import (
    STEP_DURATIONS,
    build_step_instruction,
    build_wake_instruction,
    get_step_duration,
)


def _instruction(
    ability_type: str,
    params: dict[str, Any] | None = None,
    modifier: StepModifier = StepModifier.NONE,
) -> str | None:
    """Adapter: render one step's instruction."""
    return build_step_instruction(
        AbilityStepInput(
            ability_type=ability_type,
            order=1,
            modifier=modifier,
            is_required=True,
            parameters=params or {},
        )
    )


def _wake(wake_target: str | None, name: str = "Alice") -> str:
    """Adapter: render a role's wake instruction."""
    return build_wake_instruction(
        RoleScriptInput(name=name, wake_target=wake_target, ability_steps=[])
    )


# --------------------------------------------------------------------------
# Wake instructions (5 wake-target branches + fallbacks)
# --------------------------------------------------------------------------

WAKE_CASES = [
    (None, "Alice, wake up."),
    ("player.self", "Alice, wake up."),
    ("team.werewolf", "Werewolves, wake up and look for other werewolves."),
    ("team.alien", "Aliens, wake up and look for other aliens."),
    ("team.vampire", "Vampires, wake up and look for other vampires."),
    ("role.doppelganger", "Alice and doppelganger, wake up."),
    ("role.the_thing", "Alice and the thing, wake up."),
    ("team.unknown", "Alice, wake up."),
    ("garbage", "Alice, wake up."),
    ("", "Alice, wake up."),
]


class TestWakeInstruction:
    """Exact wake copy for every wake_target branch."""

    @pytest.mark.parametrize("wake_target,expected", WAKE_CASES)
    def test_wake_instruction(self, wake_target: str | None, expected: str) -> None:
        assert _wake(wake_target) == expected

    def test_role_prefix_underscores_become_spaces(self) -> None:
        assert _wake("role.the_thing", name="Bob") == "Bob and the thing, wake up."

    def test_empty_wake_target_falls_back_to_player_self(self) -> None:
        """Empty string is falsy, so it takes the player.self path, not the fallback."""
        assert _wake("") == _wake("player.self")


# --------------------------------------------------------------------------
# Instruction matrix — exact copy for every template branch
# --------------------------------------------------------------------------

INSTRUCTION_CASES: list[tuple[str, dict[str, Any], str | None]] = [
    # view_card
    ("view_card", {"target": "player.self"}, "You may look at your own card."),
    (
        "view_card",
        {"target": "player.other", "count": 1},
        "You may look at one other player's card.",
    ),
    (
        "view_card",
        {"target": "player.other", "count": 3},
        "You may look at up to 3 other players' cards.",
    ),
    (
        "view_card",
        {"target": "center.main", "count": 1},
        "You may look at one card from the center.",
    ),
    (
        "view_card",
        {"target": "center.main", "count": 2},
        "You may look at 2 cards from the center.",
    ),
    ("view_card", {"target": "bogus"}, "You may look at a card."),
    ("view_card", {}, "You may look at one other player's card."),
    # swap_card
    (
        "swap_card",
        {"target_a": "player.self", "target_b": "center.main"},
        "Exchange your card with one from the center.",
    ),
    (
        "swap_card",
        {"target_a": "player.self", "target_b": "player.other"},
        "Exchange your card with another player's card.",
    ),
    (
        "swap_card",
        {"target_a": "center.main", "target_b": "player.self"},
        "Exchange your card with one from the center.",
    ),
    (
        "swap_card",
        {"target_a": "center.main", "target_b": "player.other"},
        "You may swap that center card with any player's card.",
    ),
    (
        "swap_card",
        {"target_a": "player.other", "target_b": "player.other"},
        "You may swap two other players' cards.",
    ),
    ("swap_card", {}, "You may swap two other players' cards."),
    # take_card
    ("take_card", {"target": "center.main"}, "Take a card from the center."),
    ("take_card", {"target": "player.other"}, "Take another player's card."),
    ("take_card", {}, "Take another player's card."),
    # view_awake
    ("view_awake", {}, "Look around and see who else is awake."),
    # thumbs_up
    (
        "thumbs_up",
        {"target": "player.self"},
        "Put your thumb out so others can see it.",
    ),
    # NOTE: "Werewolfs" (not "Werewolves") is the pre-refactor output of the
    # naive f"{team.title()}s" pluralization. Copy is frozen for this feature,
    # so the bug is pinned here deliberately rather than silently fixed.
    ("thumbs_up", {"target": "team.werewolf"}, "Werewolfs, put your thumbs out."),
    ("thumbs_up", {"target": "team.alien"}, "Aliens, put your thumbs out."),
    ("thumbs_up", {"target": "role.the_thing"}, "The Thing, put your thumb out."),
    (
        "thumbs_up",
        {"target": "players.actions"},
        "Everyone who viewed or moved a card tonight, put your thumb out.",
    ),
    ("thumbs_up", {"target": "bogus"}, "Put your thumb out."),
    ("thumbs_up", {}, "Put your thumb out."),
    # explicit_no_view
    ("explicit_no_view", {}, "Do not look at your new card."),
    # rotate_all
    ("rotate_all", {}, "You may move all player cards one position to the left."),
    (
        "rotate_all",
        {"direction": "right"},
        "You may move all player cards one position to the right.",
    ),
    # touch
    ("touch", {}, "Reach out and tap the player next to you."),
    # flip_card
    ("flip_card", {}, "You may flip that player's card face up."),
    # copy_role
    ("copy_role", {}, "You are now that role for the rest of the game."),
    # change_to_team
    (
        "change_to_team",
        {"team": "werewolf"},
        "If you see a werewolf, you are now on the werewolf team.",
    ),
    ("change_to_team", {}, "You change teams."),
    # perform_as / perform_immediately
    (
        "perform_as",
        {},
        "At the copied role's normal wake time, perform their night actions.",
    ),
    ("perform_immediately", {}, "Now perform the copied role's night actions."),
    # stop
    ("stop", {}, "Stop. Do not perform any further actions."),
    # random_num_players
    (
        "random_num_players",
        {"options": [3]},
        "3 adjacent players are now part of your group.",
    ),
    (
        "random_num_players",
        {"options": [2, 3]},
        "A random number of adjacent players (2 or 3) are now part of your group.",
    ),
    (
        "random_num_players",
        {"options": [2, 3, 4]},
        "A random number of adjacent players (2, 3, or 4) are now part of your group.",
    ),
    ("random_num_players", {"options": []}, "A random number of players are selected."),
    ("random_num_players", {}, "A random number of players are selected."),
    # unknown ability type -> None -> step silently skipped
    ("unknown_type", {}, None),
]


class TestInstructionTemplates:
    """Exact instruction copy for every ability type and parameter branch."""

    @pytest.mark.parametrize("ability_type,params,expected", INSTRUCTION_CASES)
    def test_instruction_matrix(
        self, ability_type: str, params: dict[str, Any], expected: str | None
    ) -> None:
        assert _instruction(ability_type, params) == expected

    def test_unknown_ability_type_returns_none(self) -> None:
        """Unknown types return None so the builder silently skips the step."""
        assert _instruction("no_such_ability", {}) is None

    def test_all_dispatched_types_produce_instructions(self) -> None:
        """Every type with a duration entry must also have a template."""
        for ability_type in STEP_DURATIONS:
            assert _instruction(ability_type, {}) is not None, ability_type


class TestOrModifier:
    """StepModifier.OR prefixes the rendered instruction."""

    def test_or_modifier_prefixes_instruction(self) -> None:
        assert (
            _instruction("view_card", {"target": "player.self"}, StepModifier.OR)
            == "OR You may look at your own card."
        )

    def test_or_modifier_on_unknown_type_still_returns_none(self) -> None:
        """The OR prefix is applied after dispatch, so unknown types stay None."""
        assert _instruction("unknown_type", {}, StepModifier.OR) is None

    @pytest.mark.parametrize(
        "modifier", [StepModifier.NONE, StepModifier.AND, StepModifier.IF]
    )
    def test_non_or_modifiers_do_not_prefix(self, modifier: StepModifier) -> None:
        assert (
            _instruction("view_card", {"target": "player.self"}, modifier)
            == "You may look at your own card."
        )


# --------------------------------------------------------------------------
# Step durations
# --------------------------------------------------------------------------

DURATION_CASES = [
    ("view_card", 8),
    ("swap_card", 6),
    ("take_card", 6),
    ("view_awake", 5),
    ("thumbs_up", 5),
    ("explicit_no_view", 2),
    ("rotate_all", 8),
    ("touch", 5),
    ("flip_card", 5),
    ("copy_role", 3),
    ("change_to_team", 2),
    ("perform_as", 2),
    ("perform_immediately", 2),
    ("stop", 0),
    ("random_num_players", 5),
]


class TestStepDurations:
    """Exact duration for every ability type, plus the unknown-type default."""

    @pytest.mark.parametrize("ability_type,expected", DURATION_CASES)
    def test_duration(self, ability_type: str, expected: int) -> None:
        step = AbilityStepInput(
            ability_type=ability_type,
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={},
        )
        assert get_step_duration(step) == expected

    def test_unknown_type_defaults_to_five_seconds(self) -> None:
        step = AbilityStepInput(
            ability_type="unknown_type",
            order=1,
            modifier=StepModifier.NONE,
            is_required=True,
            parameters={},
        )
        assert get_step_duration(step) == 5

    def test_duration_table_covers_exactly_the_known_types(self) -> None:
        assert set(STEP_DURATIONS) == {t for t, _ in DURATION_CASES}
