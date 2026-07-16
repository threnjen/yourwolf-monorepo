"""Plain input dataclasses for narration script generation.

These are the narration package's only input contract. They deliberately carry
no ORM, session, or Pydantic dependency so the narration logic stays pure and
directly portable.

Phase 04 port note: these shapes are the reference contract for the TypeScript
engine's ``RoleInput`` / ``AbilityStepInput`` types — field names are chosen to
be transcribed one-for-one.
"""

from dataclasses import dataclass, field
from typing import Any

from app.models.ability_step import StepModifier


@dataclass(frozen=True)
class AbilityStepInput:
    """One ability step of a role's night turn.

    Attributes:
        ability_type: Ability type string (e.g. ``"view_card"``).
        order: Position of this step within the role's turn (1-based).
        modifier: Step modifier; ``StepModifier.OR`` prefixes the instruction.
        is_required: Whether the step requires a player action.
        parameters: Ability-specific parameters used to render the copy.
    """

    ability_type: str
    order: int
    modifier: StepModifier
    is_required: bool
    parameters: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class RoleScriptInput:
    """A role's narration-relevant shape.

    Attributes:
        name: Display name used in narrator copy.
        wake_target: Wake-target string (e.g. ``"team.werewolf"``); ``None``
            is treated as ``"player.self"``.
        ability_steps: Steps for this role's turn, in any order — the builder
            sorts them by ``order``.
    """

    name: str
    wake_target: str | None
    ability_steps: list[AbilityStepInput] = field(default_factory=list)
