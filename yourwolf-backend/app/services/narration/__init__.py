"""Pure narration script generation.

This package holds the narrator copy templates and script assembly logic as
pure functions over plain input dataclasses. It performs no DB or ORM access —
``ScriptService`` owns persistence and adapts ORM objects and preview payloads
into these inputs.
"""

from app.services.narration.inputs import AbilityStepInput, RoleScriptInput
from app.services.narration.script_builder import (
    build_night_script_actions,
    build_preview_actions,
    build_role_script,
    total_duration_seconds,
)
from app.services.narration.templates import (
    STEP_DURATIONS,
    build_step_instruction,
    build_wake_instruction,
    get_step_duration,
)

__all__ = [
    "STEP_DURATIONS",
    "AbilityStepInput",
    "RoleScriptInput",
    "build_night_script_actions",
    "build_preview_actions",
    "build_role_script",
    "build_step_instruction",
    "build_wake_instruction",
    "get_step_duration",
    "total_duration_seconds",
]
