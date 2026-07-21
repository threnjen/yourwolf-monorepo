"""Pure night-script ordering and assembly.

Assembles narrator actions from :mod:`app.services.narration.inputs`
dataclasses using the frozen copy in :mod:`app.services.narration.templates`.
No DB or ORM access — ``ScriptService`` supplies already-adapted inputs.
"""

from app.models.ability_step import StepModifier
from app.schemas.game import NarratorAction
from app.schemas.role import NarratorPreviewAction
from app.services.narration.inputs import RoleScriptInput
from app.services.narration.templates import (
    build_step_instruction,
    build_wake_instruction,
    get_step_duration,
)

# Ability types that trigger a second wake at the copied role's wake time.
_SECOND_WAKE_ABILITY_TYPES = ("perform_immediately", "perform_as")

OPENING_INSTRUCTION = "Everyone, close your eyes."
OPENING_DURATION_SECONDS = 5
CLOSING_INSTRUCTION = "Everyone, open your eyes."
CLOSING_DURATION_SECONDS = 3
NARRATOR_ROLE_NAME = "Narrator"
WAKE_DURATION_SECONDS = 3
CLOSE_EYES_DURATION_SECONDS = 3


def build_role_script(role: RoleScriptInput, start_order: int) -> list[NarratorAction]:
    """Build the narration for a single role's turn.

    Every waking role produces a wake action and a close-eyes action even when
    it has no ability steps. Steps whose ability type has no template are
    silently skipped.

    Args:
        role: Role to narrate.
        start_order: Order number of this role's first action.

    Returns:
        Ordered narrator actions for this role's turn.
    """
    actions: list[NarratorAction] = []
    order = start_order

    actions.append(
        NarratorAction(
            order=order,
            role_name=role.name,
            instruction=build_wake_instruction(role),
            duration_seconds=WAKE_DURATION_SECONDS,
            requires_player_action=False,
        )
    )
    order += 1

    for step in sorted(role.ability_steps, key=lambda s: s.order):
        instruction = build_step_instruction(step)
        if instruction:
            actions.append(
                NarratorAction(
                    order=order,
                    role_name=role.name,
                    instruction=instruction,
                    duration_seconds=get_step_duration(step),
                    requires_player_action=(
                        step.is_required or step.modifier == StepModifier.OR
                    ),
                )
            )
            order += 1

    actions.append(
        NarratorAction(
            order=order,
            role_name=role.name,
            instruction=f"{role.name}, close your eyes.",
            duration_seconds=CLOSE_EYES_DURATION_SECONDS,
            requires_player_action=False,
        )
    )

    return actions


def build_night_script_actions(
    roles: list[RoleScriptInput],
) -> list[NarratorAction]:
    """Build the full ordered night script actions.

    Args:
        roles: Waking roles, already in the order they should be narrated.

    Returns:
        Opening action, each role's turn in order, then the closing action.
        An empty role list still yields the opening and closing actions.
    """
    actions: list[NarratorAction] = []
    order = 1

    actions.append(
        NarratorAction(
            order=order,
            role_name=NARRATOR_ROLE_NAME,
            instruction=OPENING_INSTRUCTION,
            duration_seconds=OPENING_DURATION_SECONDS,
            requires_player_action=False,
        )
    )
    order += 1

    for role in roles:
        for action in build_role_script(role, order):
            actions.append(action)
            order += 1

    actions.append(
        NarratorAction(
            order=order,
            role_name=NARRATOR_ROLE_NAME,
            instruction=CLOSING_INSTRUCTION,
            duration_seconds=CLOSING_DURATION_SECONDS,
            requires_player_action=False,
        )
    )

    return actions


def build_preview_actions(role: RoleScriptInput) -> list[NarratorPreviewAction]:
    """Build the narrator preview lines for a draft role.

    Mirrors :func:`build_role_script`, then appends a section header when the
    role performs a copied role's actions at a second wake time.

    Args:
        role: Draft role to preview.

    Returns:
        Ordered preview actions.
    """
    preview_actions = [
        NarratorPreviewAction(
            order=action.order,
            instruction=action.instruction,
            is_section_header=False,
        )
        for action in build_role_script(role, start_order=1)
    ]

    has_second_wake = any(
        step.ability_type in _SECOND_WAKE_ABILITY_TYPES for step in role.ability_steps
    )
    if has_second_wake:
        next_order = (preview_actions[-1].order + 1) if preview_actions else 1
        preview_actions.append(
            NarratorPreviewAction(
                order=next_order,
                instruction=(
                    "Then, at the copied role's wake time, "
                    f"{role.name} performs the copied role's night actions."
                ),
                is_section_header=True,
            )
        )

    return preview_actions


def total_duration_seconds(actions: list[NarratorAction]) -> int:
    """Sum the durations of narrator actions.

    Args:
        actions: Actions to sum.

    Returns:
        Total duration in seconds.
    """
    return sum(action.duration_seconds for action in actions)
