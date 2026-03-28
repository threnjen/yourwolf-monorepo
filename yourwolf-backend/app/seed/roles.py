"""Seed data for official roles."""

import logging

from app.models.ability import Ability
from app.models.ability_step import AbilityStep, StepModifier
from app.models.role import Role, Team, Visibility
from app.models.role_dependency import DependencyType, RoleDependency
from app.models.win_condition import WinCondition
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

# 30 Official Roles from One Night Ultimate Werewolf
ROLES_DATA = [
    {
        "name": "Villager",
        "team": Team.VILLAGE,
        "wake_order": None,
        "wake_target": None,
        "description": "You are a simple villager. You have no special abilities, but your vote counts!",
        "votes": 1,
        "default_count": 3,
        "min_count": 1,
        "max_count": 3,
        "ability_steps": [],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Werewolf",
        "team": Team.WEREWOLF,
        "wake_order": 1,
        "wake_target": "team.werewolf",
        "description": "You wake with other werewolves. If alone, view one center card.",
        "votes": 1,
        "default_count": 2,
        "min_count": 1,
        "max_count": 2,
        "is_primary_team_role": True,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_awake",
                "parameters": {"target": "team.werewolf"},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "if",
                "ability_type": "view_card",
                "parameters": {"target": "center.main"},
                "condition_type": "no_other_awake",
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "werewolf"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Insomniac",
        "team": Team.VILLAGE,
        "wake_order": 9,
        "wake_target": "player.self",
        "description": "You wake at the end of the night to check if your card changed.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "player.self"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Tanner",
        "team": Team.NEUTRAL,
        "wake_order": None,
        "wake_target": None,
        "description": "You hate your job. You only win if you are eliminated.",
        "votes": 1,
        "ability_steps": [],
        "win_conditions": [
            {
                "condition_type": "special_win_dead",
                "is_primary": True,
                "overrides_team": True,
            }
        ],
    },
    {
        "name": "Robber",
        "team": Team.VILLAGE,
        "wake_order": 4,
        "wake_target": "player.self",
        "description": "You may steal another player's role.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "take_card",
                "parameters": {"target": "player.other"},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "and",
                "ability_type": "view_card",
                "parameters": {"target": "player.self"},
                "is_required": True,
            },
            {
                "order": 3,
                "modifier": "and",
                "ability_type": "swap_card",
                "parameters": {"target_a": "player.self", "target_b": "previous"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins_as_current",
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Troublemaker",
        "team": Team.VILLAGE,
        "wake_order": 5,
        "wake_target": "player.self",
        "description": "You may swap two other players' cards without looking.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "swap_card",
                "parameters": {"target_a": "player.other", "target_b": "player.other"},
                "is_required": False,
            },
            {
                "order": 2,
                "modifier": "and",
                "ability_type": "explicit_no_view",
                "parameters": {},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Drunk",
        "team": Team.VILLAGE,
        "wake_order": 6,
        "wake_target": "player.self",
        "description": "You swap your card with a center card without looking.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "swap_card",
                "parameters": {"target_a": "player.self", "target_b": "center.main"},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "and",
                "ability_type": "explicit_no_view",
                "parameters": {},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins_as_current",
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Minion",
        "team": Team.WEREWOLF,
        "wake_order": 2,
        "wake_target": "player.self",
        "description": "You see who the werewolves are. You win if they survive.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "thumbs_up",
                "parameters": {"target": "team.werewolf"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "werewolf"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Mason",
        "team": Team.VILLAGE,
        "wake_order": 3,
        "wake_target": "player.self",
        "description": "You wake with other Masons and know each other.",
        "votes": 1,
        "default_count": 2,
        "min_count": 2,
        "max_count": 2,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_awake",
                "parameters": {"target": "role.mason"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Apprentice Seer",
        "team": Team.VILLAGE,
        "wake_order": 4,
        "wake_target": "player.self",
        "description": "You may look at one center card.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "center.main", "count": 1},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Seer",
        "team": Team.VILLAGE,
        "wake_order": 4,
        "wake_target": "player.self",
        "description": "You may look at one player's card or two center cards.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "player.other", "count": 1},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "or",
                "ability_type": "view_card",
                "parameters": {"target": "center.main", "count": 2},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Witch",
        "team": Team.VILLAGE,
        "wake_order": 4,
        "wake_target": "player.self",
        "description": "View a center card. You may swap it with any player's card.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "center.main"},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "and",
                "ability_type": "swap_card",
                "parameters": {"target_a": "viewed", "target_b": "player.other"},
                "is_required": False,
            },
            {
                "order": 3,
                "modifier": "or",
                "ability_type": "swap_card",
                "parameters": {"target_a": "viewed", "target_b": "player.self"},
                "is_required": False,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Marksman",
        "team": Team.VILLAGE,
        "wake_order": 4,
        "wake_target": "player.self",
        "description": "You may look at one other player's card.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "player.other"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Mystic Wolf",
        "team": Team.WEREWOLF,
        "wake_order": 2,
        "wake_target": "player.self",
        "description": "You are a werewolf. You may look at one other player's card.",
        "votes": 1,
        "is_primary_team_role": True,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "player.other"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "werewolf"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Doppelganger",
        "team": Team.VILLAGE,
        "wake_order": 0,
        "wake_target": "player.self",
        "description": "Look at another player's card and become that role.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "player.other"},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "and",
                "ability_type": "copy_role",
                "parameters": {},
                "is_required": True,
            },
            {
                "order": 3,
                "modifier": "and",
                "ability_type": "perform_immediately",
                "parameters": {},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins_as_current",
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Bodyguard",
        "team": Team.VILLAGE,
        "wake_order": 8,
        "wake_target": "player.self",
        "description": "Protect one player from elimination.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "player.other", "protect": True},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Copycat",
        "team": Team.VILLAGE,
        "wake_order": 0,
        "wake_target": "player.self",
        "description": "Look at a center card and become that role.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "center.main"},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "and",
                "ability_type": "copy_role",
                "parameters": {},
                "is_required": True,
            },
            {
                "order": 3,
                "modifier": "and",
                "ability_type": "perform_as",
                "parameters": {},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins_as_current",
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Revealer",
        "team": Team.VILLAGE,
        "wake_order": 7,
        "wake_target": "player.self",
        "description": "Flip a player's card. If werewolf/tanner, flip it back.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "player.other"},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "and",
                "ability_type": "flip_card",
                "parameters": {"target": "player.other"},
                "condition_type": "only_if_opponent",
                "condition_params": {"team": "village"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Dream Wolf",
        "team": Team.WEREWOLF,
        "wake_order": 1,
        "wake_target": "team.werewolf",
        "description": "You don't wake with wolves, but they see your thumb.",
        "votes": 1,
        "is_primary_team_role": True,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "thumbs_up",
                "parameters": {"target": "player.self"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "werewolf"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Alpha Wolf",
        "team": Team.WEREWOLF,
        "wake_order": 2,
        "wake_target": "player.self",
        "description": "Swap the center wolf card with another player's card.",
        "votes": 1,
        "is_primary_team_role": True,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "swap_card",
                "parameters": {"target_a": "center.bonus", "target_b": "player.other"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "werewolf"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Paranormal Investigator",
        "team": Team.VILLAGE,
        "wake_order": 4,
        "wake_target": "player.self",
        "description": "Look at up to two cards. If you see a werewolf, become one.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "player.other", "count": 2},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "if",
                "ability_type": "change_to_team",
                "parameters": {"team": "werewolf"},
                "condition_type": "only_if_team",
                "condition_params": {"team": "werewolf"},
                "is_required": True,
            },
            {
                "order": 3,
                "modifier": "and",
                "ability_type": "stop",
                "parameters": {},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins_as_current",
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Village Idiot",
        "team": Team.VILLAGE,
        "wake_order": 5,
        "wake_target": "player.self",
        "description": "You may rotate all player cards one position.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "rotate_all",
                "parameters": {"direction": "left", "count": 1},
                "is_required": False,
            },
            {
                "order": 2,
                "modifier": "or",
                "ability_type": "rotate_all",
                "parameters": {"direction": "right", "count": 1},
                "is_required": False,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Aura Seer",
        "team": Team.VILLAGE,
        "wake_order": 7,
        "wake_target": "player.self",
        "description": "See who viewed or moved cards tonight.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "thumbs_up",
                "parameters": {"target": "players.actions"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Apprentice Tanner",
        "team": Team.NEUTRAL,
        "wake_order": 2,
        "wake_target": "player.self",
        "description": "See who the Tanner is. You win if Tanner is eliminated.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "thumbs_up",
                "parameters": {"target": "role.tanner"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "special_win_alive",
                "condition_params": {"role": "tanner", "eliminated": True},
                "is_primary": True,
                "overrides_team": True,
            }
        ],
    },
    {
        "name": "Beholder",
        "team": Team.VILLAGE,
        "wake_order": 4,
        "wake_target": "player.self",
        "description": "You see who the Seer and Apprentice Seer are.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "thumbs_up",
                "parameters": {"target": "role.seer"},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "and",
                "ability_type": "thumbs_up",
                "parameters": {"target": "role.apprentice_seer"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Squire",
        "team": Team.WEREWOLF,
        "wake_order": 2,
        "wake_target": "player.self",
        "description": "See who wolves are and view one of their cards.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "thumbs_up",
                "parameters": {"target": "team.werewolf"},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "and",
                "ability_type": "view_card",
                "parameters": {"target": "role.werewolf"},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "werewolf"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Thing",
        "team": Team.VILLAGE,
        "wake_order": 8,
        "wake_target": "player.self",
        "description": "Tap an adjacent player to let them know you exist.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "touch",
                "parameters": {
                    "who": "player.self",
                    "target": "player.adjacent",
                    "location": "adjacent",
                },
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Cow",
        "team": Team.VILLAGE,
        "wake_order": 1,
        "wake_target": "team.alien",
        "description": "Wake when aliens wake. Adjacent aliens must tip you.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "thumbs_up",
                "parameters": {"target": "role.cow"},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "if",
                "ability_type": "touch",
                "parameters": {
                    "who": "team.alien",
                    "target": "role.cow",
                    "location": "adjacent",
                },
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "team_wins",
                "condition_params": {"team": "village"},
                "is_primary": True,
                "overrides_team": False,
            }
        ],
    },
    {
        "name": "Mortician",
        "team": Team.NEUTRAL,
        "wake_order": 4,
        "wake_target": "player.self",
        "description": "Randomly view cards and may join viewed roles.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "view_card",
                "parameters": {"target": "player.other", "random": [0, 1]},
                "is_required": True,
            },
            {
                "order": 2,
                "modifier": "and",
                "ability_type": "view_card",
                "parameters": {"target": "player.other", "random": [0, 1]},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "special_win_alive",
                "condition_params": {"with": "viewed_players"},
                "is_primary": True,
                "overrides_team": True,
            }
        ],
    },
    {
        "name": "Blob",
        "team": Team.NEUTRAL,
        "wake_order": 10,
        "wake_target": "player.self",
        "description": "Absorb 2-4 adjacent players. You all win together.",
        "votes": 1,
        "ability_steps": [
            {
                "order": 1,
                "modifier": "none",
                "ability_type": "random_num_players",
                "parameters": {"options": [2, 3, 4]},
                "is_required": True,
            },
        ],
        "win_conditions": [
            {
                "condition_type": "self_must_live",
                "is_primary": True,
                "overrides_team": True,
            },
            {
                "condition_type": "special_win_alive",
                "condition_params": {"with": "absorbed_players"},
                "is_primary": False,
                "overrides_team": True,
            },
        ],
    },
]


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


# Dependencies between official roles
# (source_role_name, target_role_name, dependency_type)
ROLE_DEPENDENCIES_DATA = [
    ("Apprentice Tanner", "Tanner", DependencyType.REQUIRES),
    ("Minion", "Werewolf", DependencyType.RECOMMENDS),
    ("Mystic Wolf", "Werewolf", DependencyType.RECOMMENDS),
    ("Dream Wolf", "Werewolf", DependencyType.RECOMMENDS),
    ("Alpha Wolf", "Werewolf", DependencyType.RECOMMENDS),
    ("Squire", "Werewolf", DependencyType.RECOMMENDS),
    ("Paranormal Investigator", "Werewolf", DependencyType.RECOMMENDS),
    ("Beholder", "Seer", DependencyType.RECOMMENDS),
    ("Beholder", "Apprentice Seer", DependencyType.RECOMMENDS),
]


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
