"""Night script generation service."""

import logging
from dataclasses import dataclass, field
from typing import Any, Protocol

from app.models.ability import Ability
from app.models.ability_step import AbilityStep, StepModifier
from app.models.game_role import GameRole
from app.models.game_session import GameSession
from app.models.role import Role
from app.schemas.game import NarratorAction, NightScript
from app.schemas.role import (
    NarratorPreviewAction,
    NarratorPreviewResponse,
    PreviewScriptRequest,
)
from sqlalchemy.orm import Session, joinedload

logger = logging.getLogger(__name__)


class _RoleLike(Protocol):
    """Structural interface satisfied by both Role ORM and _StandInRole."""

    name: str
    wake_target: str | None
    ability_steps: Any  # list of step-like objects


class _StepLike(Protocol):
    """Structural interface satisfied by both AbilityStep ORM and _StandInStep."""

    ability: Any
    order: int
    modifier: StepModifier
    is_required: bool
    parameters: dict[str, Any]


@dataclass
class _StandInAbility:
    """Lightweight stand-in for Ability ORM object."""

    type: str


@dataclass
class _StandInStep:
    """Lightweight stand-in for AbilityStep ORM object."""

    ability: _StandInAbility
    order: int
    modifier: StepModifier
    is_required: bool
    parameters: dict[str, Any] = field(default_factory=dict)
    condition_type: str | None = None
    condition_params: dict[str, Any] | None = None


@dataclass
class _StandInRole:
    """Lightweight stand-in for Role ORM object."""

    name: str
    wake_target: str | None
    ability_steps: list[_StandInStep] = field(default_factory=list)


class ScriptService:
    """Service for generating night narration scripts."""

    # Duration in seconds for each ability type
    STEP_DURATIONS = {
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

    def __init__(self, db: Session) -> None:
        """Initialize the script service.

        Args:
            db: Database session.
        """
        self.db = db

    def generate_night_script(self, game: GameSession) -> NightScript:
        """Generate the narrator script for the night phase.

        Args:
            game: GameSession with loaded game_roles.

        Returns:
            Complete night script with ordered actions.
        """
        logger.info("Generating night script for game %s", game.id)

        # Get non-center roles in this game
        game_roles = (
            self.db.query(GameRole)
            .filter(
                GameRole.game_session_id == game.id,
                GameRole.is_center.is_(False),
            )
            .all()
        )

        # Get unique roles that wake (have wake_order), sorted by wake_order
        role_ids = list({gr.role_id for gr in game_roles})
        roles = (
            self.db.query(Role)
            .options(
                joinedload(Role.ability_steps).joinedload(AbilityStep.ability),
            )
            .filter(
                Role.id.in_(role_ids),
                Role.wake_order.isnot(None),
                Role.wake_order != 0,
            )
            .order_by(Role.wake_order)
            .all()
        )

        actions: list[NarratorAction] = []
        order = 1

        # Opening narration
        actions.append(
            NarratorAction(
                order=order,
                role_name="Narrator",
                instruction="Everyone, close your eyes.",
                duration_seconds=5,
                requires_player_action=False,
            )
        )
        order += 1

        # Generate script for each waking role
        for role in roles:
            logger.debug(
                "Generating script for role %s (wake_order=%s)",
                role.name,
                role.wake_order,
            )
            role_actions = self._generate_role_script(role, order)
            for action in role_actions:
                actions.append(action)
                order += 1

        # Closing narration
        actions.append(
            NarratorAction(
                order=order,
                role_name="Narrator",
                instruction="Everyone, open your eyes.",
                duration_seconds=3,
                requires_player_action=False,
            )
        )

        total_duration = sum(a.duration_seconds for a in actions)

        logger.info(
            "Night script for game %s: %d actions, %ds total duration",
            game.id,
            len(actions),
            total_duration,
        )

        return NightScript(
            game_session_id=game.id,
            actions=actions,
            total_duration_seconds=total_duration,
        )

    def preview_role_script(
        self, data: PreviewScriptRequest
    ) -> NarratorPreviewResponse:
        """Generate a narrator preview for a draft role without persisting.

        Args:
            data: PreviewScriptRequest payload describing the draft role.

        Returns:
            NarratorPreviewResponse with ordered narrator actions.
        """
        logger.info("Generating preview script for role '%s'", data.name)

        if data.wake_order is None or data.wake_order == 0:
            return NarratorPreviewResponse(actions=[])

        # Build stand-in objects from the payload
        steps: list[_StandInStep] = []
        for step_data in data.ability_steps:
            steps.append(
                _StandInStep(
                    ability=_StandInAbility(type=step_data.ability_type),
                    order=step_data.order,
                    modifier=StepModifier(step_data.modifier),
                    is_required=step_data.is_required,
                    parameters=step_data.parameters,
                )
            )

        stand_in = _StandInRole(
            name=data.name,
            wake_target=data.wake_target,
            ability_steps=steps,
        )

        # Generate actions using the same logic as the full script
        role_actions = self._generate_role_script(stand_in, start_order=1)

        preview_actions: list[NarratorPreviewAction] = []
        for action in role_actions:
            preview_actions.append(
                NarratorPreviewAction(
                    order=action.order,
                    instruction=action.instruction,
                    is_section_header=False,
                )
            )

        # Check for perform_immediately / perform_as steps — add a section header
        has_second_wake = any(
            s.ability.type in ("perform_immediately", "perform_as") for s in steps
        )
        if has_second_wake:
            next_order = (preview_actions[-1].order + 1) if preview_actions else 1
            preview_actions.append(
                NarratorPreviewAction(
                    order=next_order,
                    instruction=(
                        "Then, at the copied role's wake time, "
                        f"{data.name} performs the copied role's night actions."
                    ),
                    is_section_header=True,
                )
            )

        return NarratorPreviewResponse(actions=preview_actions)

    def _generate_role_script(
        self, role: _RoleLike, start_order: int
    ) -> list[NarratorAction]:
        """Generate narration for a single role's turn.

        Args:
            role: Role with loaded ability_steps.
            start_order: Starting order number.

        Returns:
            List of narrator actions for this role.
        """
        actions: list[NarratorAction] = []
        order = start_order

        # Wake instruction
        wake_instruction = self._get_wake_instruction(role)
        actions.append(
            NarratorAction(
                order=order,
                role_name=role.name,
                instruction=wake_instruction,
                duration_seconds=3,
                requires_player_action=False,
            )
        )
        order += 1

        # Generate instructions for ability steps
        ability_steps = sorted(role.ability_steps, key=lambda s: s.order)
        for step in ability_steps:
            instruction = self._generate_step_instruction(role, step)
            if instruction:
                actions.append(
                    NarratorAction(
                        order=order,
                        role_name=role.name,
                        instruction=instruction,
                        duration_seconds=self._get_step_duration(step),
                        requires_player_action=(
                            step.is_required or step.modifier == StepModifier.OR
                        ),
                    )
                )
                order += 1

        # Close eyes
        actions.append(
            NarratorAction(
                order=order,
                role_name=role.name,
                instruction=f"{role.name}, close your eyes.",
                duration_seconds=3,
                requires_player_action=False,
            )
        )

        return actions

    def _get_wake_instruction(self, role: _RoleLike) -> str:
        """Get the wake-up instruction for a role.

        Args:
            role: Role to generate wake instruction for.

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

    def _generate_step_instruction(
        self, role: _RoleLike, step: _StepLike
    ) -> str | None:
        """Generate narrator instruction for an ability step.

        Args:
            role: Role performing the step.
            step: AbilityStep with loaded ability.

        Returns:
            Instruction string or None if no template found.
        """
        ability = step.ability
        params = step.parameters or {}

        templates = {
            "view_card": self._view_card_instruction,
            "swap_card": self._swap_card_instruction,
            "take_card": self._take_card_instruction,
            "view_awake": self._view_awake_instruction,
            "thumbs_up": self._thumbs_up_instruction,
            "explicit_no_view": self._no_view_instruction,
            "rotate_all": self._rotate_instruction,
            "touch": self._touch_instruction,
            "flip_card": self._flip_card_instruction,
            "copy_role": self._copy_role_instruction,
            "change_to_team": self._change_to_team_instruction,
            "perform_as": self._perform_as_instruction,
            "perform_immediately": self._perform_immediately_instruction,
            "stop": self._stop_instruction,
            "random_num_players": self._random_num_players_instruction,
        }

        generator = templates.get(ability.type)
        if generator:
            instruction = generator(role, params)

            if step.modifier == StepModifier.OR:
                instruction = f"OR {instruction}"

            return instruction

        return None

    def _view_card_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
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

    def _swap_card_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
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

    def _take_card_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
        """Generate take_card instruction."""
        target = params.get("target", "player.other")
        if "center" in target:
            return "Take a card from the center."
        return "Take another player's card."

    def _view_awake_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
        """Generate view_awake instruction."""
        return "Look around and see who else is awake."

    def _thumbs_up_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
        """Generate thumbs_up instruction."""
        target = params.get("target", "")

        if target == "player.self":
            return "Put your thumb out so others can see it."
        elif target.startswith("team."):
            team = target.replace("team.", "")
            return f"{team.title()}s, put your thumbs out."
        elif target.startswith("role."):
            target_role = target.replace("role.", "").replace("_", " ")
            return f"{target_role.title()}, put your thumb out."
        elif target == "players.actions":
            return "Everyone who viewed or moved a card tonight, put your thumb out."
        return "Put your thumb out."

    def _no_view_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
        """Generate explicit_no_view instruction."""
        return "Do not look at your new card."

    def _rotate_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
        """Generate rotate_all instruction."""
        direction = params.get("direction", "left")
        return f"You may move all player cards one position to the {direction}."

    def _touch_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
        """Generate touch instruction."""
        return "Reach out and tap the player next to you."

    def _flip_card_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
        """Generate flip_card instruction."""
        return "You may flip that player's card face up."

    def _copy_role_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
        """Generate copy_role instruction."""
        return "You are now that role for the rest of the game."

    def _change_to_team_instruction(
        self, role: _RoleLike, params: dict[str, Any]
    ) -> str:
        """Generate change_to_team instruction."""
        team = params.get("team")
        if team:
            return f"If you see a {team}, you are now on the {team} team."
        return "You change teams."

    def _perform_as_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
        """Generate perform_as instruction."""
        return "At the copied role's normal wake time, perform their night actions."

    def _perform_immediately_instruction(
        self, role: _RoleLike, params: dict[str, Any]
    ) -> str:
        """Generate perform_immediately instruction."""
        return "Now perform the copied role's night actions."

    def _stop_instruction(self, role: _RoleLike, params: dict[str, Any]) -> str:
        """Generate stop instruction."""
        return "Stop. Do not perform any further actions."

    def _random_num_players_instruction(
        self, role: _RoleLike, params: dict[str, Any]
    ) -> str:
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

    def _get_step_duration(self, step: _StepLike) -> int:
        """Get appropriate duration for an ability step.

        Args:
            step: AbilityStep with loaded ability.

        Returns:
            Duration in seconds.
        """
        return self.STEP_DURATIONS.get(step.ability.type, 5)
