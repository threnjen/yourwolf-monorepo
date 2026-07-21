"""Role rule evaluation.

``RoleService`` stays orchestration + persistence; the rules that decide whether
a role payload is legal live here.

Two reporting modes share this module:

* :func:`validate_role` returns an error list and never raises. ``POST
  /roles/validate`` reports the list; ``create_role`` raises on a non-empty one.
* :func:`get_warnings` is purely advisory and likewise never raises.

Rule order matters. The name rules form an if/elif chain, so a name that is both
too short and a duplicate reports only the length error. Reordering these checks
changes which message a multi-violation payload returns, which is observable.
"""

from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.ability import Ability
from app.models.role import Role, Visibility
from app.schemas.role import RoleCreate


def check_duplicate_name(
    db: Session, name: str, exclude_role_id: UUID | None = None
) -> bool:
    """Check if a name is already used by a public or official role.

    Args:
        db: Database session.
        name: Role name to check.
        exclude_role_id: Optional role UUID to exclude (for update self-check).

    Returns:
        True if a duplicate exists, False otherwise.
    """
    query = db.query(Role).filter(
        func.lower(Role.name) == name.strip().lower(),
        Role.visibility.in_([Visibility.PUBLIC, Visibility.OFFICIAL]),
    )
    if exclude_role_id is not None:
        query = query.filter(Role.id != exclude_role_id)
    return query.first() is not None


def validate_role(
    db: Session, data: RoleCreate, exclude_role_id: UUID | None = None
) -> list[str]:
    """Validate role creation data without persisting.

    Args:
        db: Database session, used for the duplicate-name and ability lookups.
        data: Role creation payload.
        exclude_role_id: Optional role UUID to exclude from duplicate check.

    Returns:
        List of human-readable error strings. Empty list means valid.
    """
    errors: list[str] = []

    # AC3 — name length.
    #
    # Only the lower bound is enforced here. ``RoleCreate.name`` is declared
    # ``min_length=2, max_length=50``, so pydantic rejects an over-long name
    # before this function runs, and ``strip()`` can only shorten a name — an
    # upper-bound check would therefore be unreachable. The lower bound stays
    # reachable because ``"  a  "`` satisfies ``min_length=2`` and strips to
    # ``"a"``.
    name = data.name.strip()
    if len(name) < 2:
        errors.append("Role name must be at least 2 characters.")
    elif check_duplicate_name(db, name, exclude_role_id):
        # AC4 — duplicate name
        errors.append(
            f"A role named '{name}' already exists as a public or official role."
        )

    # AC5–AC7 — ability step validation
    if data.ability_steps:
        # AC6 — first step modifier must be 'none' (step with the lowest order)
        first_step = min(data.ability_steps, key=lambda s: s.order)
        if first_step.modifier != "none":
            errors.append("The first ability step must have modifier 'none'.")

        # AC5 — each ability_type must exist and be active (batch query)
        ability_types = {step.ability_type for step in data.ability_steps}
        active_abilities = (
            db.query(Ability)
            .filter(
                Ability.type.in_(ability_types),
                Ability.is_active.is_(True),
            )
            .all()
        )
        active_ability_types = {ability.type for ability in active_abilities}
        for step in data.ability_steps:
            if step.ability_type not in active_ability_types:
                errors.append(
                    f"Ability type '{step.ability_type}' is not a valid active ability."
                )

        # AC7 — orders must be sequential starting at 1
        orders = [step.order for step in data.ability_steps]
        sorted_orders = sorted(orders)
        expected = list(range(1, len(orders) + 1))
        if sorted_orders != expected:
            if len(orders) != len(set(orders)):
                errors.append("Ability step orders must not have duplicates.")
            else:
                errors.append(
                    "Ability step orders must be sequential starting at 1 with no gaps."
                )

    # AC8–AC9 — win conditions
    if not data.win_conditions:
        errors.append("At least one win condition is required.")
    else:
        primary_count = sum(1 for wc in data.win_conditions if wc.is_primary)
        if primary_count == 0:
            errors.append("Exactly one win condition must be marked as primary.")
        elif primary_count > 1:
            errors.append(
                f"Exactly one win condition must be marked as primary "
                f"(found {primary_count})."
            )

    return errors


def get_warnings(data: RoleCreate) -> list[str]:
    """Return non-blocking advisory warnings for role data.

    Args:
        data: Role creation payload.

    Returns:
        List of human-readable warning strings.
    """
    warnings: list[str] = []

    # AC11 — more than 5 ability steps
    if len(data.ability_steps) > 5:
        warnings.append(
            "This role has more than 5 ability steps, which may make it complex to balance."
        )

    # AC11 — steps present but no wake_order
    if data.ability_steps and data.wake_order is None:
        warnings.append(
            "This role has ability steps but no wake_order set. "
            "It may not execute its abilities without a wake order."
        )

    # AC11 — conflicting ability types
    step_types = {step.ability_type for step in data.ability_steps}
    if "copy_role" in step_types and "change_to_team" in step_types:
        warnings.append(
            "Using both 'copy_role' and 'change_to_team' abilities may cause conflicts."
        )

    return warnings
