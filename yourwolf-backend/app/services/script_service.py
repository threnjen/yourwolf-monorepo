"""Night script generation service.

Owns DB access and adaptation only: ORM objects and preview payloads are
adapted into :mod:`app.services.narration` input dataclasses, and the pure
narration package builds the actual script.
"""

import logging

from app.models.ability_step import AbilityStep, StepModifier
from app.models.game_role import GameRole
from app.models.game_session import GameSession
from app.models.role import Role
from app.schemas.game import NarratorAction, NightScript
from app.schemas.role import (
    NarratorPreviewResponse,
    PreviewScriptRequest,
)
from app.services.narration.inputs import AbilityStepInput, RoleScriptInput
from app.services.narration.script_builder import (
    build_night_script_actions,
    build_preview_actions,
    total_duration_seconds,
)
from sqlalchemy.orm import Session, joinedload

logger = logging.getLogger(__name__)


def _role_to_input(role: Role) -> RoleScriptInput:
    """Adapt a Role ORM object into narration input.

    Args:
        role: Role with loaded ability_steps and their abilities.

    Returns:
        Plain narration input for this role.
    """
    return RoleScriptInput(
        name=role.name,
        wake_target=role.wake_target,
        ability_steps=[
            AbilityStepInput(
                ability_type=step.ability.type,
                order=step.order,
                modifier=step.modifier,
                is_required=step.is_required,
                parameters=step.parameters or {},
            )
            for step in role.ability_steps
        ],
    )


def _preview_request_to_input(data: PreviewScriptRequest) -> RoleScriptInput:
    """Adapt a preview payload into narration input.

    Args:
        data: Draft role payload from the preview endpoint.

    Returns:
        Plain narration input for the draft role.
    """
    return RoleScriptInput(
        name=data.name,
        wake_target=data.wake_target,
        ability_steps=[
            AbilityStepInput(
                ability_type=step.ability_type,
                order=step.order,
                modifier=StepModifier(step.modifier),
                is_required=step.is_required,
                parameters=step.parameters,
            )
            for step in data.ability_steps
        ],
    )


class ScriptService:
    """Service for generating night narration scripts."""

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

        roles = self._get_waking_roles(game)

        for role in roles:
            logger.debug(
                "Generating script for role %s (wake_order=%s)",
                role.name,
                role.wake_order,
            )

        actions: list[NarratorAction] = build_night_script_actions(
            [_role_to_input(role) for role in roles]
        )
        total_duration = total_duration_seconds(actions)

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

        return NarratorPreviewResponse(
            actions=build_preview_actions(_preview_request_to_input(data))
        )

    def _get_waking_roles(self, game: GameSession) -> list[Role]:
        """Load the game's waking roles in narration order.

        Roles are de-duplicated by role ID, and roles with a null or zero
        wake_order are excluded. Ordering follows the game's custom
        wake_order_sequence when set, otherwise Role.wake_order.

        Args:
            game: GameSession to load roles for.

        Returns:
            Waking roles in the order they should be narrated.
        """
        game_roles = (
            self.db.query(GameRole)
            .filter(
                GameRole.game_session_id == game.id,
                GameRole.is_center.is_(False),
            )
            .all()
        )

        role_ids = list({gr.role_id for gr in game_roles})

        query = (
            self.db.query(Role)
            .options(
                joinedload(Role.ability_steps).joinedload(AbilityStep.ability),
            )
            .filter(
                Role.id.in_(role_ids),
                Role.wake_order.isnot(None),
                Role.wake_order != 0,
            )
        )

        if game.wake_order_sequence:
            logger.debug("Using custom wake_order_sequence for game %s", game.id)
            sequence_ids = game.wake_order_sequence  # list of UUID strings
            roles = query.all()
            # Roles missing from the sequence sort last, via the fallback index.
            seq_index = {uid: i for i, uid in enumerate(sequence_ids)}
            roles.sort(key=lambda r: seq_index.get(str(r.id), len(sequence_ids)))
            return roles

        logger.debug("Using default Role.wake_order ordering for game %s", game.id)
        return query.order_by(Role.wake_order).all()
