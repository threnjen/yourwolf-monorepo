"""Seed data for ability primitives."""

import logging

from app.models.ability import Ability
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# 15 Ability Primitives
ABILITIES_DATA = [
    {
        "type": "take_card",
        "name": "Take Card",
        "description": "Take another player's card and give them your card.",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "target": {
                    "type": "string",
                    "description": "The card to take (player.other, center.main, etc.)",
                },
            },
            "required": ["target"],
        },
    },
    {
        "type": "swap_card",
        "name": "Swap Card",
        "description": "Swap two cards with each other.",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "target_a": {
                    "type": "string",
                    "description": "First card to swap",
                },
                "target_b": {
                    "type": "string",
                    "description": "Second card to swap",
                },
            },
            "required": ["target_a", "target_b"],
        },
    },
    {
        "type": "view_card",
        "name": "View Card",
        "description": "Look at a card without moving it.",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "target": {
                    "type": "string",
                    "description": "The card to view",
                },
                "count": {
                    "type": "integer",
                    "description": "Number of cards to view",
                    "default": 1,
                },
            },
            "required": ["target"],
        },
    },
    {
        "type": "flip_card",
        "name": "Flip Card",
        "description": "Turn a card face-up so all players can see it.",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "target": {
                    "type": "string",
                    "description": "The card to flip",
                },
            },
            "required": ["target"],
        },
    },
    {
        "type": "copy_role",
        "name": "Copy Role",
        "description": "Change your role to match a viewed card.",
        "parameters_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "type": "view_awake",
        "name": "View Awake",
        "description": "See which players have their eyes open.",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "target": {
                    "type": "string",
                    "description": "Which group to observe (team.werewolf, role.mason, etc.)",
                },
            },
            "required": ["target"],
        },
    },
    {
        "type": "thumbs_up",
        "name": "Thumbs Up",
        "description": "Put up a thumb to signal identity to awake players.",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "target": {
                    "type": "string",
                    "description": "Who should put thumb up",
                },
            },
            "required": ["target"],
        },
    },
    {
        "type": "explicit_no_view",
        "name": "Explicit No View",
        "description": "The narrator emphasizes that the player does NOT view their changes.",
        "parameters_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "type": "rotate_all",
        "name": "Rotate All",
        "description": "Move all player cards in a direction.",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "direction": {
                    "type": "string",
                    "enum": ["left", "right"],
                    "description": "Direction to rotate cards",
                },
                "count": {
                    "type": "integer",
                    "description": "Number of positions to rotate",
                    "default": 1,
                },
            },
            "required": ["direction"],
        },
    },
    {
        "type": "touch",
        "name": "Touch",
        "description": "Physically touch another player to signal.",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "who": {
                    "type": "string",
                    "description": "Who does the touching",
                },
                "target": {
                    "type": "string",
                    "description": "Who gets touched",
                },
                "location": {
                    "type": "string",
                    "description": "Where the touch occurs",
                    "default": "adjacent",
                },
            },
            "required": ["who", "target"],
        },
    },
    {
        "type": "change_to_team",
        "name": "Change to Team",
        "description": "Change the active player's team allegiance.",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "team": {
                    "type": "string",
                    "enum": ["village", "werewolf", "vampire", "alien", "neutral"],
                    "description": "New team to join",
                },
            },
            "required": ["team"],
        },
    },
    {
        "type": "perform_as",
        "name": "Perform As",
        "description": "Perform abilities as your current role at normal wake time.",
        "parameters_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "type": "perform_immediately",
        "name": "Perform Immediately",
        "description": "Perform copied role's abilities immediately.",
        "parameters_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "type": "stop",
        "name": "Stop",
        "description": "Stop executing further ability steps.",
        "parameters_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "type": "random_num_players",
        "name": "Random Number of Players",
        "description": "Select a random number of players from given options.",
        "parameters_schema": {
            "type": "object",
            "properties": {
                "options": {
                    "type": "array",
                    "items": {"type": "integer"},
                    "description": "Possible values to choose from",
                },
            },
            "required": ["options"],
        },
    },
]


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
