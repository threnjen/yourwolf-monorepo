"""Pure narrator instruction templates.

Every function here is a pure function of its inputs — no DB, session, or ORM
access. ``StepModifier`` is imported from ``app.models`` as a plain enum only;
no mapped class or session type is referenced.

The English copy in this module is frozen. ``tests/test_narration_templates.py``
pins every string exactly and is the parity contract for the Phase 04
TypeScript port.
"""

from typing import Any, Callable

from app.models.ability_step import StepModifier
from app.services.narration.inputs import AbilityStepInput, RoleScriptInput

# Duration in seconds for each ability type.
STEP_DURATIONS: dict[str, int] = {
    "view_card": 8,
    "swap_card": 6,
    "take_card": 6,
    "view_awake": 5,
    "thumbs_up": 5,
    "explicit_no_view": 2,
    "rotate_all": 8,
    "touch": 5,
    "flip_card": 5,
    "copy_role": 3,
    "change_to_team": 2,
    "perform_as": 2,
    "perform_immediately": 2,
    "stop": 0,
    "random_num_players": 5,
}

# Fallback duration for ability types with no entry in STEP_DURATIONS.
_DEFAULT_STEP_DURATION = 5


def _view_card_instruction(params: dict[str, Any]) -> str:
    """Generate view_card instruction."""
    target = params.get("target", "player.other")
    count = params.get("count", 1)

    if target == "player.self":
        return "You may look at your own card."
    elif target == "player.other":
        if count == 1:
            return "You may look at one other player's card."
        return f"You may look at up to {count} other players' cards."
    elif target == "center.main":
        if count == 1:
            return "You may look at one card from the center."
        return f"You may look at {count} cards from the center."
    return "You may look at a card."


def _swap_card_instruction(params: dict[str, Any]) -> str:
    """Generate swap_card instruction."""
    target_a = params.get("target_a", "")
    target_b = params.get("target_b", "")

    if "player.self" in [target_a, target_b]:
        other = target_b if target_a == "player.self" else target_a
        if "center" in other:
            return "Exchange your card with one from the center."
        return "Exchange your card with another player's card."
    elif "center" in target_a:
        return "You may swap that center card with any player's card."
    return "You may swap two other players' cards."


def _take_card_instruction(params: dict[str, Any]) -> str:
    """Generate take_card instruction."""
    target = params.get("target", "player.other")
    if "center" in target:
        return "Take a card from the center."
    return "Take another player's card."


def _view_awake_instruction(params: dict[str, Any]) -> str:
    """Generate view_awake instruction."""
    return "Look around and see who else is awake."


def _thumbs_up_instruction(params: dict[str, Any]) -> str:
    """Generate thumbs_up instruction."""
    target = params.get("target", "")

    if target == "player.self":
        return "Put your thumb out so others can see it."
    elif target.startswith("team."):
        team = target.replace("team.", "")
        # KNOWN COPY BUG — DO NOT "FIX" HERE. This naive pluralization renders
        # team.werewolf as "Werewolfs", while build_wake_instruction says
        # "Werewolves". The wrong spelling is the shipped, pre-refactor output;
        # narrator copy is frozen (feature 10, AC4), so it is preserved
        # verbatim and pinned in tests/test_narration_templates.py.
        # Phase 04 port note: transcribe this bug faithfully into TypeScript —
        # the port is correct only when it reproduces "Werewolfs". Correcting
        # the spelling is a copy change and belongs in a dedicated copy-fix
        # feature that updates the pinned test and the TS port together.
        return f"{team.title()}s, put your thumbs out."
    elif target.startswith("role."):
        target_role = target.replace("role.", "").replace("_", " ")
        return f"{target_role.title()}, put your thumb out."
    elif target == "players.actions":
        return "Everyone who viewed or moved a card tonight, put your thumb out."
    return "Put your thumb out."


def _no_view_instruction(params: dict[str, Any]) -> str:
    """Generate explicit_no_view instruction."""
    return "Do not look at your new card."


def _rotate_instruction(params: dict[str, Any]) -> str:
    """Generate rotate_all instruction."""
    direction = params.get("direction", "left")
    return f"You may move all player cards one position to the {direction}."


def _touch_instruction(params: dict[str, Any]) -> str:
    """Generate touch instruction."""
    return "Reach out and tap the player next to you."


def _flip_card_instruction(params: dict[str, Any]) -> str:
    """Generate flip_card instruction."""
    return "You may flip that player's card face up."


def _copy_role_instruction(params: dict[str, Any]) -> str:
    """Generate copy_role instruction."""
    return "You are now that role for the rest of the game."


def _change_to_team_instruction(params: dict[str, Any]) -> str:
    """Generate change_to_team instruction."""
    team = params.get("team")
    if team:
        return f"If you see a {team}, you are now on the {team} team."
    return "You change teams."


def _perform_as_instruction(params: dict[str, Any]) -> str:
    """Generate perform_as instruction."""
    return "At the copied role's normal wake time, perform their night actions."


def _perform_immediately_instruction(params: dict[str, Any]) -> str:
    """Generate perform_immediately instruction."""
    return "Now perform the copied role's night actions."


def _stop_instruction(params: dict[str, Any]) -> str:
    """Generate stop instruction."""
    return "Stop. Do not perform any further actions."


def _random_num_players_instruction(params: dict[str, Any]) -> str:
    """Generate random_num_players instruction."""
    options = params.get("options")
    if options and len(options) == 1:
        return f"{options[0]} adjacent players are now part of your group."
    if options and len(options) == 2:
        formatted = f"{options[0]} or {options[1]}"
        return (
            f"A random number of adjacent players ({formatted}) "
            "are now part of your group."
        )
    if options and len(options) > 2:
        formatted = ", ".join(str(o) for o in options[:-1])
        formatted += f", or {options[-1]}"
        return (
            f"A random number of adjacent players ({formatted}) "
            "are now part of your group."
        )
    return "A random number of players are selected."


# Dispatch table: ability type -> instruction generator.
_TEMPLATES: dict[str, Callable[[dict[str, Any]], str]] = {
    "view_card": _view_card_instruction,
    "swap_card": _swap_card_instruction,
    "take_card": _take_card_instruction,
    "view_awake": _view_awake_instruction,
    "thumbs_up": _thumbs_up_instruction,
    "explicit_no_view": _no_view_instruction,
    "rotate_all": _rotate_instruction,
    "touch": _touch_instruction,
    "flip_card": _flip_card_instruction,
    "copy_role": _copy_role_instruction,
    "change_to_team": _change_to_team_instruction,
    "perform_as": _perform_as_instruction,
    "perform_immediately": _perform_immediately_instruction,
    "stop": _stop_instruction,
    "random_num_players": _random_num_players_instruction,
}


def build_wake_instruction(role: RoleScriptInput) -> str:
    """Build the wake-up instruction for a role.

    Args:
        role: Role to generate the wake instruction for.

    Returns:
        Wake-up narration string.
    """
    wake_target = role.wake_target or "player.self"

    if wake_target == "player.self":
        return f"{role.name}, wake up."
    elif wake_target == "team.werewolf":
        return "Werewolves, wake up and look for other werewolves."
    elif wake_target == "team.alien":
        return "Aliens, wake up and look for other aliens."
    elif wake_target == "team.vampire":
        return "Vampires, wake up and look for other vampires."
    elif wake_target.startswith("role."):
        target_role = wake_target.replace("role.", "").replace("_", " ")
        return f"{role.name} and {target_role}, wake up."
    else:
        return f"{role.name}, wake up."


def build_step_instruction(step: AbilityStepInput) -> str | None:
    """Build the narrator instruction for an ability step.

    Args:
        step: Step to render.

    Returns:
        Instruction string, or None if the ability type has no template (the
        caller skips such steps).
    """
    generator = _TEMPLATES.get(step.ability_type)
    if generator is None:
        return None

    instruction = generator(step.parameters or {})

    if step.modifier == StepModifier.OR:
        instruction = f"OR {instruction}"

    return instruction


def get_step_duration(step: AbilityStepInput) -> int:
    """Get the narration duration for an ability step.

    Args:
        step: Step to look up.

    Returns:
        Duration in seconds; 5 for unknown ability types.
    """
    return STEP_DURATIONS.get(step.ability_type, _DEFAULT_STEP_DURATION)
