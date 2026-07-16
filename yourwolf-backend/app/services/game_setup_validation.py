"""Game-setup rule evaluation.

``GameService`` stays orchestration + persistence; every rule that decides
whether a proposed game setup is legal lives here.

The rules are evaluated in a fixed precedence order. That order is an
observable contract: a payload that violates several rules at once surfaces
only the first one, so reordering these checks is a behaviour change, not a
refactor.
"""

from collections import Counter
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.exceptions import DomainValidationError
from app.models.role import Role, Team
from app.models.role_dependency import DependencyType, RoleDependency
from app.schemas.game import GameSessionCreate


@dataclass(frozen=True)
class GameSetupValidation:
    """Everything ``create_game`` needs from a successful rule pass.

    Attributes:
        warnings: Non-blocking advisories collected from soft dependencies.
        wake_order_sequence: The requested sequence normalized to the stored
            string form, or None when the payload omitted it.
    """

    warnings: list[str]
    wake_order_sequence: list[str] | None


def validate_game_setup(db: Session, data: GameSessionCreate) -> GameSetupValidation:
    """Evaluate every game-setup rule against a creation payload.

    Args:
        db: Database session, used to resolve roles and their dependencies.
        data: Game creation data including role_ids.

    Returns:
        The warnings and normalized wake order sequence for a legal setup.

    Raises:
        DomainValidationError: On the first rule the payload violates.
    """
    # Validate role count against players + center cards
    total_cards = data.player_count + data.center_card_count
    if len(data.role_ids) != total_cards:
        raise DomainValidationError(
            f"Must select exactly {total_cards} roles "
            f"({data.player_count} players + "
            f"{data.center_card_count} center)"
        )

    # Fetch roles and validate
    roles = db.query(Role).filter(Role.id.in_(data.role_ids)).all()
    role_map = {r.id: r for r in roles}

    # Reject unknown role IDs
    unknown_ids = set(data.role_ids) - set(role_map.keys())
    if unknown_ids:
        raise DomainValidationError(
            f"Unknown role IDs: {', '.join(str(uid) for uid in unknown_ids)}"
        )

    # Validate card counts
    role_id_counts = Counter(data.role_ids)
    errors = _validate_card_counts(role_map, role_id_counts)
    if errors:
        raise DomainValidationError("; ".join(errors))

    # Validate primary team roles
    errors = _validate_primary_teams(role_map)
    if errors:
        raise DomainValidationError("; ".join(errors))

    # Validate dependencies
    present_role_ids = set(data.role_ids)
    dep_errors, warnings = _validate_dependencies(db, present_role_ids)
    if dep_errors:
        raise DomainValidationError("; ".join(dep_errors))

    # Validate wake_order_sequence if provided
    wake_order_sequence_str: list[str] | None = None
    if data.wake_order_sequence is not None:
        seq_errors = _validate_wake_sequence(data, roles, role_map)
        if seq_errors:
            raise DomainValidationError("; ".join(seq_errors))
        wake_order_sequence_str = [str(uid) for uid in data.wake_order_sequence]

    return GameSetupValidation(
        warnings=warnings,
        wake_order_sequence=wake_order_sequence_str,
    )


def _validate_card_counts(
    role_map: dict[UUID, Role], role_id_counts: Counter
) -> list[str]:
    """Validate card counts against role min/max constraints.

    Args:
        role_map: Mapping of role ID to Role objects.
        role_id_counts: Counter of role IDs in the game.

    Returns:
        List of error strings. Empty if valid.
    """
    errors: list[str] = []
    for role_id, count in role_id_counts.items():
        role = role_map[role_id]
        if count < role.min_count:
            errors.append(
                f"'{role.name}' requires at least {role.min_count} "
                f"card(s), but only {count} provided"
            )
        if count > role.max_count:
            errors.append(
                f"'{role.name}' allows at most {role.max_count} "
                f"card(s), but {count} provided"
            )
    return errors


def _validate_primary_teams(role_map: dict[UUID, Role]) -> list[str]:
    """Validate that each non-village/neutral team has a primary role.

    Args:
        role_map: Mapping of role ID to Role objects.

    Returns:
        List of error strings. Empty if valid.
    """
    errors: list[str] = []
    teams_with_primary: dict[Team, bool] = {}
    for role in role_map.values():
        if role.team in (Team.VILLAGE, Team.NEUTRAL):
            continue
        if role.team not in teams_with_primary:
            teams_with_primary[role.team] = False
        if role.is_primary_team_role:
            teams_with_primary[role.team] = True

    for team, has_primary in teams_with_primary.items():
        if not has_primary:
            errors.append(
                f"'{team.value}' team requires at least one primary role "
                f"(e.g., Werewolf)"
            )
    return errors


def _validate_dependencies(
    db: Session, present_role_ids: set[UUID]
) -> tuple[list[str], list[str]]:
    """Validate role dependencies and collect warnings.

    Args:
        db: Database session.
        present_role_ids: Set of role IDs present in the game.

    Returns:
        Tuple of (errors, warnings) string lists.
    """
    errors: list[str] = []
    warnings: list[str] = []

    deps = (
        db.query(RoleDependency)
        .options(
            joinedload(RoleDependency.role),
            joinedload(RoleDependency.required_role),
        )
        .filter(RoleDependency.role_id.in_(present_role_ids))
        .all()
    )

    for dep in deps:
        if dep.required_role_id not in present_role_ids:
            role_name = dep.role.name if dep.role else "Unknown"
            req_name = dep.required_role.name if dep.required_role else "Unknown"
            if dep.dependency_type == DependencyType.REQUIRES:
                errors.append(f"'{role_name}' requires '{req_name}' to be in the game")
            else:
                warnings.append(
                    f"'{role_name}' works best with '{req_name}' in the game"
                )

    return errors, warnings


def _validate_wake_sequence(
    data: GameSessionCreate,
    roles: list[Role],
    role_map: dict[UUID, Role],
) -> list[str]:
    """Validate the wake_order_sequence field.

    Args:
        data: Game creation data.
        roles: List of fetched Role objects.
        role_map: Mapping of role ID to Role objects.

    Returns:
        List of error strings. Empty if valid.
    """
    sequence = data.wake_order_sequence
    seq_errors: list[str] = []

    # Check for duplicates
    if len(sequence) != len(set(sequence)):
        seq_errors.append("Duplicate IDs found in wake_order_sequence")

    role_ids_set = set(data.role_ids)
    # Check all IDs in sequence are in role_ids
    extra_ids = set(sequence) - role_ids_set
    if extra_ids:
        seq_errors.append("wake_order_sequence contains IDs not in role_ids")

    # Determine waking roles (unique role IDs with wake_order not None and != 0)
    unique_role_ids = set(data.role_ids)
    waking_roles = {
        r.id
        for r in roles
        if r.id in unique_role_ids and r.wake_order is not None and r.wake_order != 0
    }

    # Check no non-waking roles in sequence
    non_waking_in_seq = set(sequence) - waking_roles
    # Only flag non-waking if those IDs are actually in role_ids
    non_waking_in_seq = non_waking_in_seq & role_ids_set
    if non_waking_in_seq:
        seq_errors.append("wake_order_sequence contains IDs that are not waking roles")

    # Check all waking roles in sequence
    missing_waking = waking_roles - set(sequence)
    if missing_waking:
        missing_names = [
            role_map[rid].name for rid in missing_waking if rid in role_map
        ]
        seq_errors.append(
            f"Missing waking role(s) from wake_order_sequence: "
            f"{', '.join(missing_names)}"
        )

    return seq_errors
