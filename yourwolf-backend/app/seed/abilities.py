"""Seed data for ability primitives."""

import json
import logging
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models.ability import Ability

logger = logging.getLogger(__name__)

DATA_FILE = Path(__file__).parent / "data" / "abilities.json"
AbilityData = dict[str, Any]
REQUIRED_ABILITY_KEYS = ("type", "name", "description", "parameters_schema")


class SeedDataError(RuntimeError):
    """Raised when a seed data file is missing, malformed, or inconsistent."""


def _read_ability_data_file(path: Path) -> Any:
    """Read and parse an ability seed data file.

    Args:
        path: Path to the JSON data file.

    Returns:
        The parsed JSON payload.

    Raises:
        SeedDataError: If the file is missing, unreadable, or invalid JSON.
    """
    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        raise SeedDataError(f"Seed data file not found: {path}") from exc
    except (OSError, UnicodeError) as exc:
        raise SeedDataError(f"Seed data file could not be read: {path}") from exc

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise SeedDataError(f"Seed data file is not valid JSON: {path}: {exc}") from exc


def load_ability_seed_data(path: Path = DATA_FILE) -> list[AbilityData]:
    """Load and validate the canonical ability seed data.

    Args:
        path: Path to the JSON data file. Defaults to the packaged file.

    Returns:
        Validated ability records in file order.

    Raises:
        SeedDataError: If the data file is missing, malformed, or inconsistent.
    """
    payload = _read_ability_data_file(path)
    if not isinstance(payload, list):
        raise SeedDataError(f"Seed data file must contain a JSON list: {path}")

    abilities: list[AbilityData] = []
    for index, entry in enumerate(payload):
        if not isinstance(entry, dict):
            raise SeedDataError(
                f"Seed ability entries contain a non-object: {path} "
                f"(index {index})",
            )

        missing = [key for key in REQUIRED_ABILITY_KEYS if key not in entry]
        if missing:
            raise SeedDataError(
                f"Ability at index {index} is missing required field(s): "
                f"{', '.join(missing)}",
            )

        for key in ("type", "name", "description"):
            if not isinstance(entry[key], str) or not entry[key]:
                raise SeedDataError(
                    f"Ability at index {index} has invalid {key!r} field",
                )
        if not isinstance(entry["parameters_schema"], dict):
            raise SeedDataError(
                f"Ability at index {index} has invalid 'parameters_schema' field",
            )

        abilities.append(dict(entry))

    return abilities


# Public compatibility surface retained for role validation and seed callers.
ABILITIES_DATA = load_ability_seed_data()


def seed_abilities(db: Session) -> int:
    """Seed the ability primitives into the database.

    This function is idempotent - it checks for existing abilities by type.

    Args:
        db: Database session.

    Returns:
        Number of abilities created.
    """
    created_count = 0

    for ability_data in ABILITIES_DATA:
        # Check if ability already exists
        existing = (
            db.query(Ability).filter(Ability.type == ability_data["type"]).first()
        )

        if existing:
            logger.debug("Ability '%s' already exists, skipping.", ability_data["type"])
            continue

        # Create new ability
        ability = Ability(
            type=ability_data["type"],
            name=ability_data["name"],
            description=ability_data["description"],
            parameters_schema=ability_data["parameters_schema"],
            is_active=True,
        )
        db.add(ability)
        created_count += 1
        logger.info("Created ability: %s", ability_data["type"])

    db.commit()
    return created_count
