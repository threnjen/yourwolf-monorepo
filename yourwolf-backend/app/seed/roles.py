"""Seed data loader for official roles.

The role definitions live in ``data/roles.json`` rather than in this module so
that the same data file can be bundled with non-server distributions of the
game. This module reads that single known file, validates it, and exposes the
same ``ROLES_DATA`` / ``ROLE_DEPENDENCIES_DATA`` structures the seeding
routines have always consumed.
"""

import json
import logging
from pathlib import Path
from typing import Any

from app.models.ability import Ability
from app.models.ability_step import AbilityStep, StepModifier
from app.models.role import Role, Team, Visibility
from app.models.role_dependency import DependencyType, RoleDependency
from app.models.win_condition import WinCondition
from app.seed.abilities import ABILITIES_DATA
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

DATA_FILE = Path(__file__).parent / "data" / "roles.json"

RoleData = dict[str, Any]
RoleDependencyData = tuple[str, str, DependencyType]

# Ability types the seeding routine can resolve to a real Ability row.
KNOWN_ABILITY_TYPES = {ability["type"] for ability in ABILITIES_DATA}

# Fields ``seed_roles`` indexes directly; absent ones would raise KeyError
# part-way through seeding rather than up front.
REQUIRED_ROLE_KEYS = ("wake_order", "wake_target", "description", "votes")
REQUIRED_STEP_KEYS = ("order", "modifier", "ability_type", "is_required", "parameters")
REQUIRED_WIN_CONDITION_KEYS = ("condition_type", "is_primary", "overrides_team")


class SeedDataError(RuntimeError):
    """Raised when the seed data file is missing, malformed, or inconsistent.

    Loading fails before any database work begins, so a bad data file can
    never produce a partial seed.
    """


def _require_keys(entry: dict[str, Any], keys: tuple[str, ...], what: str) -> None:
    """Check that a data-file entry carries every field the seeder indexes.

    Args:
        entry: The entry to check.
        keys: Field names that must be present.
        what: Description of the entry, for error messages.

    Raises:
        SeedDataError: If any required field is absent.
    """
    missing = [key for key in keys if key not in entry]
    if missing:
        raise SeedDataError(
            f"{what} is missing required field(s): {', '.join(missing)}"
        )


def _require_entry_list(role_name: str, section: Any, key: str) -> list[dict[str, Any]]:
    """Return a role's required list-of-objects section.

    Args:
        role_name: The owning role's name, for error messages.
        section: The raw section value.
        key: The section name.

    Returns:
        The section's entries.

    Raises:
        SeedDataError: If the section is not a list of objects.
    """
    if not isinstance(section, list):
        raise SeedDataError(f"Role {role_name!r} must have a {key!r} list")
    for entry in section:
        if not isinstance(entry, dict):
            raise SeedDataError(f"Role {role_name!r} has a non-object {key!r} entry")
    return section


def _read_data_file(path: Path) -> dict[str, Any]:
    """Read and parse the seed data file.

    Args:
        path: Path to the JSON data file.

    Returns:
        The parsed top-level object.

    Raises:
        SeedDataError: If the file is missing, unreadable, not valid JSON, or
            not a JSON object.
    """
    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise SeedDataError(f"Seed data file not found: {path}") from exc
    except OSError as exc:
        raise SeedDataError(f"Seed data file could not be read: {path}") from exc

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SeedDataError(f"Seed data file is not valid JSON: {path}: {exc}") from exc

    if not isinstance(payload, dict):
        raise SeedDataError(
            f"Seed data file must contain a JSON object: {path}",
        )
    return payload


def _require_list(payload: dict[str, Any], key: str, path: Path) -> list[Any]:
    """Return a required list-valued section of the data file.

    Args:
        payload: The parsed data file.
        key: The section name.
        path: Path to the data file, for error messages.

    Returns:
        The section's list value.

    Raises:
        SeedDataError: If the section is absent or is not a list.
    """
    section = payload.get(key)
    if not isinstance(section, list):
        raise SeedDataError(
            f"Seed data file must contain a {key!r} list: {path}",
        )
    return section


def _parse_role(role: Any, path: Path) -> RoleData:
    """Validate one role entry and reconstruct its enum-valued fields.

    Args:
        role: The raw role entry.
        path: Path to the data file, for error messages.

    Returns:
        The role dict with ``team`` reconstructed as a ``Team`` member.

    Raises:
        SeedDataError: If the entry is malformed, omits a field the seeding
            routine requires, or references unknown enum values or unknown
            ability types.
    """
    if not isinstance(role, dict):
        raise SeedDataError(f"Seed role entries must be objects: {path}")

    name = role.get("name")
    if not isinstance(name, str) or not name:
        raise SeedDataError(f"Seed role is missing a 'name': {path}")

    try:
        team = Team(role["team"])
    except KeyError as exc:
        raise SeedDataError(f"Role {name!r} is missing 'team'") from exc
    except ValueError as exc:
        raise SeedDataError(
            f"Role {name!r} has unknown team {role['team']!r}",
        ) from exc

    _require_keys(role, REQUIRED_ROLE_KEYS, f"Role {name!r}")

    steps = _require_entry_list(name, role.get("ability_steps"), "ability_steps")
    for step in steps:
        _require_keys(step, REQUIRED_STEP_KEYS, f"Role {name!r} ability step")

        modifier = step["modifier"]
        try:
            StepModifier(modifier)
        except ValueError as exc:
            raise SeedDataError(
                f"Role {name!r} step {step.get('order')} has unknown "
                f"modifier {modifier!r}",
            ) from exc

        ability_type = step["ability_type"]
        if ability_type not in KNOWN_ABILITY_TYPES:
            raise SeedDataError(
                f"Role {name!r} step {step.get('order')} references unknown "
                f"ability_type {ability_type!r}",
            )

    win_conditions = _require_entry_list(
        name,
        role.get("win_conditions"),
        "win_conditions",
    )
    for win_condition in win_conditions:
        _require_keys(
            win_condition,
            REQUIRED_WIN_CONDITION_KEYS,
            f"Role {name!r} win condition",
        )

    return {**role, "team": team}


def _parse_dependency(
    dependency: Any,
    role_names: set[str],
    path: Path,
) -> RoleDependencyData:
    """Validate one dependency entry and reconstruct its enum-valued field.

    Args:
        dependency: The raw dependency entry.
        role_names: Names of every role defined in the data file.
        path: Path to the data file, for error messages.

    Returns:
        A ``(source, target, DependencyType)`` tuple.

    Raises:
        SeedDataError: If the entry is malformed, names an unknown dependency
            type, or points at a role that is not defined in the data file.
    """
    if not isinstance(dependency, dict):
        raise SeedDataError(f"Seed dependency entries must be objects: {path}")

    source = dependency.get("source")
    target = dependency.get("target")
    for label, value in (("source", source), ("target", target)):
        if not isinstance(value, str):
            raise SeedDataError(f"Seed dependency is missing {label!r}: {path}")
        if value not in role_names:
            raise SeedDataError(
                f"Dependency {source!r} -> {target!r} names undefined "
                f"role {value!r}",
            )

    try:
        dep_type = DependencyType(dependency["dependency_type"])
    except KeyError as exc:
        raise SeedDataError(
            f"Dependency {source!r} -> {target!r} is missing 'dependency_type'",
        ) from exc
    except ValueError as exc:
        raise SeedDataError(
            f"Dependency {source!r} -> {target!r} has unknown dependency_type "
            f"{dependency['dependency_type']!r}",
        ) from exc

    return (str(source), str(target), dep_type)


def load_seed_data(
    path: Path = DATA_FILE,
) -> tuple[list[RoleData], list[RoleDependencyData]]:
    """Load and validate the official role seed data.

    Validation happens up front: a missing file, malformed JSON, a field the
    seeding routine requires, an unknown enum value, or a dangling
    role/ability reference all raise before any seeding is attempted, so a
    bad data file can never produce a partial seed. Field *values* beyond
    enum members are not type-checked; the database schema enforces those.

    Args:
        path: Path to the JSON data file. Defaults to the file shipped with
            this package.

    Returns:
        A ``(roles, role_dependencies)`` pair.

    Raises:
        SeedDataError: If the data file is missing, malformed, or inconsistent.
    """
    payload = _read_data_file(path)

    raw_roles = _require_list(payload, "roles", path)
    raw_dependencies = _require_list(payload, "role_dependencies", path)

    roles = [_parse_role(role, path) for role in raw_roles]

    role_names = {role["name"] for role in roles}
    if len(role_names) != len(roles):
        raise SeedDataError(f"Seed data file contains duplicate role names: {path}")

    dependencies = [
        _parse_dependency(dependency, role_names, path)
        for dependency in raw_dependencies
    ]

    return roles, dependencies


# 30 Official Roles from One Night Ultimate Werewolf, plus the dependencies
# between them. (source_role_name, target_role_name, dependency_type)
ROLES_DATA, ROLE_DEPENDENCIES_DATA = load_seed_data()


def seed_roles(db: Session) -> int:
    """Seed the official roles into the database.

    This function is idempotent - it checks for existing roles by name
    and official visibility.

    Args:
        db: Database session.

    Returns:
        Number of roles created.
    """
    created_count = 0

    # Build ability type to ID mapping
    abilities = db.query(Ability).all()
    ability_map = {a.type: a.id for a in abilities}

    for role_data in ROLES_DATA:
        # Check if role already exists as official
        existing = (
            db.query(Role)
            .filter(
                Role.name == role_data["name"],
                Role.visibility == Visibility.OFFICIAL,
            )
            .first()
        )

        if existing:
            logger.debug("Role '%s' already exists, skipping.", role_data["name"])
            continue

        # Create new role
        role = Role(
            name=role_data["name"],
            team=role_data["team"],
            wake_order=role_data["wake_order"],
            wake_target=role_data["wake_target"],
            description=role_data["description"],
            votes=role_data["votes"],
            default_count=role_data.get("default_count", 1),
            min_count=role_data.get("min_count", 1),
            max_count=role_data.get("max_count", 1),
            is_primary_team_role=role_data.get("is_primary_team_role", False),
            visibility=Visibility.OFFICIAL,
            is_locked=True,
            creator_id=None,  # Official roles have no creator
        )
        db.add(role)
        db.flush()  # Get the role ID

        # Create ability steps
        for step_data in role_data["ability_steps"]:
            ability_type = step_data["ability_type"]
            ability_id = ability_map.get(ability_type)

            if not ability_id:
                logger.warning(
                    "Ability type '%s' not found for role '%s'",
                    ability_type,
                    role_data["name"],
                )
                continue

            step = AbilityStep(
                role_id=role.id,
                ability_id=ability_id,
                order=step_data["order"],
                modifier=StepModifier(step_data["modifier"]),
                is_required=step_data["is_required"],
                parameters=step_data["parameters"],
                condition_type=step_data.get("condition_type"),
                condition_params=step_data.get("condition_params"),
            )
            db.add(step)

        # Create win conditions
        for wc_data in role_data["win_conditions"]:
            wc = WinCondition(
                role_id=role.id,
                condition_type=wc_data["condition_type"],
                condition_params=wc_data.get("condition_params"),
                is_primary=wc_data["is_primary"],
                overrides_team=wc_data["overrides_team"],
            )
            db.add(wc)

        created_count += 1
        logger.info("Created role: %s", role_data["name"])

    db.commit()
    return created_count


def seed_role_dependencies(db: Session) -> int:
    """Seed dependencies between official roles.

    This function is idempotent — it checks for existing dependency
    rows before inserting.

    Args:
        db: Database session.

    Returns:
        Number of dependencies created.
    """
    # Build role name → ID mapping for official roles
    official_roles = db.query(Role).filter(Role.visibility == Visibility.OFFICIAL).all()
    role_name_map = {r.name: r.id for r in official_roles}

    created_count = 0

    for source_name, target_name, dep_type in ROLE_DEPENDENCIES_DATA:
        source_id = role_name_map.get(source_name)
        target_id = role_name_map.get(target_name)

        if not source_id or not target_id:
            logger.warning(
                "Cannot create dependency %s -> %s: role(s) not found",
                source_name,
                target_name,
            )
            continue

        # Check if already exists
        existing = (
            db.query(RoleDependency)
            .filter(
                RoleDependency.role_id == source_id,
                RoleDependency.required_role_id == target_id,
            )
            .first()
        )

        if existing:
            logger.debug(
                "Dependency %s -> %s already exists, skipping.",
                source_name,
                target_name,
            )
            continue

        dep = RoleDependency(
            role_id=source_id,
            required_role_id=target_id,
            dependency_type=dep_type,
        )
        db.add(dep)
        created_count += 1
        logger.info(
            "Created dependency: %s -> %s (%s)",
            source_name,
            target_name,
            dep_type.value,
        )

    db.commit()
    return created_count
