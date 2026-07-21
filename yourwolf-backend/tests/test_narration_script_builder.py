"""Tests for pure night-script ordering and assembly.

These exercise the builder directly on input dataclasses — no DB. DB-facing
generation and preview behavior lives in tests/test_script_service.py; exact
instruction copy lives in tests/test_narration_templates.py.
"""

from typing import Any

from app.models.ability_step import StepModifier
from app.services.narration.inputs import AbilityStepInput, RoleScriptInput
from app.services.narration.script_builder import (
    build_night_script_actions,
    build_preview_actions,
    build_role_script,
    total_duration_seconds,
)


def _step(
    ability_type: str,
    order: int = 1,
    modifier: StepModifier = StepModifier.NONE,
    is_required: bool = True,
    parameters: dict[str, Any] | None = None,
) -> AbilityStepInput:
    return AbilityStepInput(
        ability_type=ability_type,
        order=order,
        modifier=modifier,
        is_required=is_required,
        parameters=parameters or {},
    )


def _role(
    name: str = "Seer",
    wake_target: str | None = "player.self",
    steps: list[AbilityStepInput] | None = None,
) -> RoleScriptInput:
    return RoleScriptInput(
        name=name, wake_target=wake_target, ability_steps=steps or []
    )


class TestBuildRoleScript:
    """Tests for build_role_script."""

    def test_role_with_no_steps_gets_wake_and_close_only(self) -> None:
        """Edge case: a waking role with no ability steps still narrates."""
        actions = build_role_script(_role(name="Observer"), start_order=1)

        assert len(actions) == 2
        assert actions[0].instruction == "Observer, wake up."
        assert actions[1].instruction == "Observer, close your eyes."

    def test_wake_and_close_are_not_player_actions(self) -> None:
        actions = build_role_script(_role(name="Observer"), start_order=1)

        assert actions[0].requires_player_action is False
        assert actions[-1].requires_player_action is False

    def test_wake_and_close_durations(self) -> None:
        actions = build_role_script(_role(name="Observer"), start_order=1)

        assert actions[0].duration_seconds == 3
        assert actions[-1].duration_seconds == 3

    def test_all_actions_carry_the_role_name(self) -> None:
        actions = build_role_script(
            _role(name="Seer", steps=[_step("view_card")]), start_order=1
        )

        assert {a.role_name for a in actions} == {"Seer"}

    def test_start_order_is_honored(self) -> None:
        actions = build_role_script(_role(steps=[_step("view_card")]), start_order=7)

        assert [a.order for a in actions] == [7, 8, 9]

    def test_steps_are_sorted_by_order(self) -> None:
        """Steps are narrated by their order field, not list position."""
        actions = build_role_script(
            _role(
                steps=[
                    _step("stop", order=2),
                    _step("touch", order=1),
                ]
            ),
            start_order=1,
        )

        instructions = [a.instruction for a in actions]
        assert instructions[1] == "Reach out and tap the player next to you."
        assert instructions[2] == "Stop. Do not perform any further actions."

    def test_unknown_ability_type_is_silently_skipped(self) -> None:
        """Edge case: no template -> None -> step omitted, ordering stays dense."""
        actions = build_role_script(
            _role(
                steps=[
                    _step("view_card", order=1),
                    _step("no_such_ability", order=2),
                    _step("touch", order=3),
                ]
            ),
            start_order=1,
        )

        assert len(actions) == 4  # wake + view_card + touch + close
        assert [a.order for a in actions] == [1, 2, 3, 4]
        assert not any("no_such" in a.instruction for a in actions)

    def test_or_modifier_sets_requires_player_action(self) -> None:
        """Edge case: OR steps require a player action even when not required."""
        actions = build_role_script(
            _role(
                steps=[_step("view_card", modifier=StepModifier.OR, is_required=False)]
            ),
            start_order=1,
        )

        step_action = actions[1]
        assert step_action.instruction.startswith("OR ")
        assert step_action.requires_player_action is True

    def test_required_step_requires_player_action(self) -> None:
        actions = build_role_script(
            _role(steps=[_step("view_card", is_required=True)]), start_order=1
        )

        assert actions[1].requires_player_action is True

    def test_optional_non_or_step_does_not_require_player_action(self) -> None:
        actions = build_role_script(
            _role(steps=[_step("view_card", is_required=False)]), start_order=1
        )

        assert actions[1].requires_player_action is False

    def test_step_duration_comes_from_the_duration_table(self) -> None:
        actions = build_role_script(_role(steps=[_step("view_card")]), start_order=1)

        assert actions[1].duration_seconds == 8

    def test_team_wake_target_uses_team_copy(self) -> None:
        actions = build_role_script(
            _role(name="Werewolf", wake_target="team.werewolf"), start_order=1
        )

        assert (
            actions[0].instruction
            == "Werewolves, wake up and look for other werewolves."
        )


class TestBuildNightScriptActions:
    """Tests for build_night_script_actions."""

    def test_empty_role_list_still_gets_opening_and_closing(self) -> None:
        """Edge case: a night with no waking roles still narrates both ends."""
        actions = build_night_script_actions([])

        assert len(actions) == 2
        assert actions[0].instruction == "Everyone, close your eyes."
        assert actions[1].instruction == "Everyone, open your eyes."

    def test_opening_and_closing_are_narrator(self) -> None:
        actions = build_night_script_actions([_role()])

        assert actions[0].role_name == "Narrator"
        assert actions[-1].role_name == "Narrator"

    def test_opening_and_closing_durations(self) -> None:
        actions = build_night_script_actions([])

        assert actions[0].duration_seconds == 5
        assert actions[1].duration_seconds == 3

    def test_orders_are_sequential_from_one(self) -> None:
        actions = build_night_script_actions(
            [
                _role(name="Werewolf", steps=[_step("view_awake")]),
                _role(name="Seer", steps=[_step("view_card")]),
            ]
        )

        assert [a.order for a in actions] == list(range(1, len(actions) + 1))

    def test_roles_narrate_in_the_given_order(self) -> None:
        """The builder does not reorder — the service supplies wake order."""
        actions = build_night_script_actions(
            [_role(name="Werewolf"), _role(name="Seer"), _role(name="Insomniac")]
        )

        seen: list[str] = []
        for action in actions:
            if action.role_name != "Narrator" and action.role_name not in seen:
                seen.append(action.role_name)
        assert seen == ["Werewolf", "Seer", "Insomniac"]

    def test_every_role_gets_a_close_eyes_action(self) -> None:
        actions = build_night_script_actions(
            [_role(name="Werewolf"), _role(name="Seer")]
        )

        closes = [
            a
            for a in actions
            if a.role_name != "Narrator" and "close your eyes" in a.instruction
        ]
        assert len(closes) == 2


class TestTotalDurationSeconds:
    """Tests for total_duration_seconds."""

    def test_sums_action_durations(self) -> None:
        actions = build_night_script_actions([])

        assert total_duration_seconds(actions) == 8  # 5 opening + 3 closing

    def test_empty_actions_sum_to_zero(self) -> None:
        assert total_duration_seconds([]) == 0

    def test_includes_step_durations(self) -> None:
        actions = build_night_script_actions(
            [_role(name="Seer", steps=[_step("view_card")])]
        )

        # 5 opening + 3 wake + 8 view_card + 3 close + 3 closing
        assert total_duration_seconds(actions) == 22


class TestBuildPreviewActions:
    """Tests for build_preview_actions."""

    def test_preview_mirrors_role_script_instructions(self) -> None:
        role = _role(name="Seer", steps=[_step("view_card")])

        preview = build_preview_actions(role)
        script = build_role_script(role, start_order=1)

        assert [a.instruction for a in preview] == [a.instruction for a in script]

    def test_preview_orders_start_at_one(self) -> None:
        preview = build_preview_actions(_role(steps=[_step("view_card")]))

        assert [a.order for a in preview] == list(range(1, len(preview) + 1))

    def test_no_section_header_without_second_wake(self) -> None:
        preview = build_preview_actions(_role(steps=[_step("view_card")]))

        assert not any(a.is_section_header for a in preview)

    def test_perform_immediately_appends_section_header(self) -> None:
        preview = build_preview_actions(
            _role(
                name="Doppelganger",
                steps=[
                    _step("view_card", order=1),
                    _step("perform_immediately", order=2),
                ],
            )
        )

        headers = [a for a in preview if a.is_section_header]
        assert len(headers) == 1
        assert headers[0].instruction == (
            "Then, at the copied role's wake time, "
            "Doppelganger performs the copied role's night actions."
        )

    def test_perform_as_appends_section_header(self) -> None:
        preview = build_preview_actions(
            _role(name="Mimic", steps=[_step("perform_as")])
        )

        headers = [a for a in preview if a.is_section_header]
        assert len(headers) == 1
        assert "Mimic performs the copied role's night actions." in (
            headers[0].instruction
        )

    def test_section_header_is_last_and_continues_ordering(self) -> None:
        preview = build_preview_actions(
            _role(name="Mimic", steps=[_step("perform_as")])
        )

        assert preview[-1].is_section_header is True
        assert preview[-1].order == len(preview)

    def test_only_one_section_header_for_multiple_second_wake_steps(self) -> None:
        preview = build_preview_actions(
            _role(
                name="Mimic",
                steps=[
                    _step("perform_immediately", order=1),
                    _step("perform_as", order=2),
                ],
            )
        )

        assert len([a for a in preview if a.is_section_header]) == 1
