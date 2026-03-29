# YourWolf Seed Roles

> **30 base game roles from One Night Ultimate Werewolf**

This document defines the official roles that will be seeded into the database during Phase 1. These roles are marked with `visibility: official` and cannot be edited by users.

---

## Table of Contents

1. [Role Format](#role-format)
2. [Village Team](#village-team)
3. [Werewolf Team](#werewolf-team)
4. [Neutral Roles](#neutral-roles)
5. [Alien Team](#alien-team)
6. [Seed Data (JSON)](#seed-data-json)

---

## Role Format

Each role is defined with:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (1-31) |
| `name` | Role name |
| `team` | Starting team affiliation |
| `wake_order` | When role wakes during night (lower = earlier) |
| `description` | Flavor text for the card |
| `ability_steps` | Ordered list of ability executions |
| `win_conditions` | How this role wins |

---

## Village Team

### 1. Villager
**Wake Order**: None (does not wake)

**Description**: You are a simple villager. You have no special abilities, but your vote counts!

**Abilities**: None

**Win Condition**: Village team wins (at least one werewolf eliminated)

---

### 2. Insomniac
**Wake Order**: 9 (late)

**Description**: You wake at the end of the night to check if your card changed.

**Abilities**:
1. Wake (self)
2. AND: View Card (player.self)

**Win Condition**: Village team wins

---

### 3. Robber
**Wake Order**: 4

**Description**: You may steal another player's role, becoming that role.

**Abilities**:
1. Wake (self)
2. AND: Take Card (player.other) - take their card, give them yours
3. AND: View Card (player.self) - see your new role
4. AND: Swap Card (player.self ↔ previous)

**Win Condition**: Wins with new team if role changed

---

### 4. Troublemaker
**Wake Order**: 5

**Description**: You may swap two other players' cards without looking at them.

**Abilities**:
1. Wake (self)
2. AND: Take Card (player.other) - first card
3. AND: Explicit No-View
4. AND (optional): Swap Card (player.other ↔ player.other)

**Win Condition**: Village team wins

---

### 5. Drunk
**Wake Order**: 6

**Description**: You swap your card with a center card without looking at it.

**Abilities**:
1. Wake (self)
2. AND: Take Card (center.main)
3. AND: Explicit No-View
4. AND: Swap Card (player.self ↔ center.main)

**Win Condition**: Wins with new team

---

### 6. Mason
**Wake Order**: 3

**Description**: Masons wake together and know each other's identity.

**Abilities**:
1. Wake (self)
2. AND: View Awake - see other masons

**Win Condition**: Village team wins

---

### 7. Seer
**Wake Order**: 4

**Description**: You may look at one player's card OR two center cards.

**Abilities**:
1. Wake (self)
2. AND: View Card (player.other) x1
3. OR: View Card (center.main) x2

**Win Condition**: Village team wins

---

### 8. Apprentice Seer
**Wake Order**: 4

**Description**: You may look at one center card.

**Abilities**:
1. Wake (self)
2. AND: View Card (center.main) x1

**Win Condition**: Village team wins

---

### 9. Witch
**Wake Order**: 4

**Description**: You look at a center card. You may swap it with any player's card.

**Abilities**:
1. Wake (self)
2. View Card (center.main)
3. AND (optional): Swap Card (center.main ↔ player.other)
4. OR (optional): Swap Card (center.main ↔ player.self)

**Win Condition**: Village team wins

---

### 10. Marksman
**Wake Order**: 4

**Description**: You may look at one other player's card.

**Abilities**:
1. Wake (self)
2. AND: View Card (player.other)

**Win Condition**: Village team wins

---

### 11. Revealer
**Wake Order**: 7

**Description**: You flip over another player's card. If it's a werewolf or tanner, flip it back.

**Abilities**:
1. Wake (self)
2. AND: View Card (player.other)
3. AND: Flip Card (player.other) - IF: only_if_opponent(team.village)

**Win Condition**: Village team wins

---

### 12. Village Idiot
**Wake Order**: 5

**Description**: You may rotate all players' cards one position left or right.

**Abilities**:
1. Wake (self)
2. AND: Rotate All (to_left) x1
3. OR: Rotate All (to_right) x1

**Win Condition**: Village team wins

---

### 13. Thing (That Goes Bump in the Night)
**Wake Order**: 8

**Description**: You tap an adjacent player to let them know you exist.

**Abilities**:
1. Wake (self)
2. AND: Touch (player.self → player.adjacent, location: adjacent)

**Win Condition**: Village team wins

---

### 14. Bodyguard
**Wake Order**: 8

**Description**: You protect one player from elimination. They cannot be voted out.

**Abilities**:
1. Wake (self)
2. AND: View Card (player.other) - select who to protect

**Win Condition**: Village team wins (protected player survives)

---

### 15. Beholder
**Wake Order**: 4

**Description**: You see who the Seer and Apprentice Seer are.

**Abilities**:
1. Wake (self)
2. AND: Thumbs Up (role.Seer) - Seer puts thumb up
3. AND: Thumbs Up (role.Apprentice_Seer)

**Win Condition**: Village team wins

---

### 16. Aura Seer
**Wake Order**: 7

**Description**: You see which players have viewed or moved cards.

**Abilities**:
1. Wake (self)
2. AND: Thumbs Up (players.Actions) - players who took actions put thumb up

**Win Condition**: Village team wins

---

---

## Werewolf Team

### 17. Werewolf
**Wake Order**: 1

**Description**: You wake with other werewolves to learn each other's identity. If you're the only werewolf, you may view one center card.

**Abilities**:
1. Wake (self)
2. AND: View Awake (team.werewolf)
3. IF: No Other Awake → Thumbs Up (player.self)
4. AND: View Card (center.main)
5. AND: Repeat Until Opponent

**Win Condition**: Werewolf team wins (no werewolf eliminated)

---

### 18. Mystic Wolf
**Wake Order**: 2

**Description**: You are a werewolf. You may also look at one other player's card.

**Abilities**:
1. Wake (self)
2. AND: View Card (player.other)

**Win Condition**: Werewolf team wins

---

### 19. Dream Wolf
**Wake Order**: 1

**Description**: You are a werewolf, but you don't wake with the other wolves. They see your thumb.

**Abilities**:
1. Wake (team.werewolf) - wakes when wolves wake but keeps eyes closed
2. AND: Thumbs Up (player.self)

**Win Condition**: Werewolf team wins

---

### 20. Alpha Wolf
**Wake Order**: 2

**Description**: You are a werewolf. After the wolves wake, you swap the center bonus card with another player's card.

**Abilities**:
1. Wake (self)
2. AND: Take Card (center.bonus)
3. AND: Swap Card (center.bonus ↔ player.other)

**Win Condition**: Werewolf team wins

---

### 21. Minion
**Wake Order**: 2

**Description**: You see who the werewolves are, but they don't know you. You win if a werewolf survives, even if you die.

**Abilities**:
1. Wake (self)
2. AND: Thumbs Up (team.werewolf) - werewolves put thumb up

**Win Condition**: Werewolf team wins (werewolf survives, or no werewolves and minion eliminated)

---

### 22. Squire
**Wake Order**: 2

**Description**: You see who the werewolves are and may look at one of their cards.

**Abilities**:
1. Wake (self)
2. Thumbs Up (team.werewolf)
3. AND: View Card (role.werewolf)

**Win Condition**: Werewolf team wins

---

---

## Neutral Roles

### 23. Tanner
**Wake Order**: None

**Description**: You hate your job. You only win if you are eliminated.

**Abilities**: None

**Win Condition**: Special Win Dead (self eliminated)

---

### 24. Apprentice Tanner
**Wake Order**: 2

**Description**: You see who the Tanner is. If the Tanner is eliminated, you win too.

**Abilities**:
1. Wake (self)
2. AND: Thumbs Up (role.Tanner)
3. AND: Special Win Alive (role.Tanner eliminated)

**Win Condition**: Tanner wins (you win with them)

---

### 25. Doppelganger
**Wake Order**: 0 (first)

**Description**: You look at another player's card and become that role, performing their action immediately or at the appropriate time.

**Abilities**:
1. Wake (self)
2. AND: View Card (player.other)
3. AND: Copy Role
4. AND: Perform Immediately (if werewolf/mason/etc) OR Perform As (at normal time)

**Win Condition**: Wins with copied role's team

---

### 26. Copycat
**Wake Order**: 0 (first)

**Description**: You look at a center card and become that role.

**Abilities**:
1. Wake (self)
2. AND: View Card (center.main)
3. AND: Copy Role
4. AND: Perform As (at normal time)

**Win Condition**: Wins with copied role's team

---

### 27. Paranormal Investigator (PI)
**Wake Order**: 4

**Description**: You may look at up to two players' cards. If you see a werewolf, you become a werewolf and stop looking.

**Abilities**:
1. Wake (self)
2. AND: View Card (player.other)
3. IF: only_if_team(werewolf) → Change To Team (werewolf) → Stop
4. AND: View Card (player.other) - repeat up to 2 times

**Win Condition**: Village team wins, or Werewolf team if converted

---

### 28. Mortician
**Wake Order**: 4

**Description**: You choose cards to view randomly. If you see specific roles, you join them.

**Abilities**:
1. Wake (self)
2. AND: View Card (player.other) - random [0,1]
3. AND: View Card (player.other) - random [0,1]
4. IF: viewed specific role → Special Win Alive (viewed_players)

**Win Condition**: Complex conditional based on what was viewed

---

---

## Alien Team

### 29. Cow
**Wake Order**: 1

**Description**: You wake when aliens wake. If an alien is adjacent to the cow, they must tip you.

**Abilities**:
1. Wake (team.alien)
2. AND: Thumbs Up (role.cow)
3. IF: Touch (team.alien → role.cow, adjacent)

**Win Condition**: Village team wins

---

### 30. Blob
**Wake Order**: 10

**Description**: You randomly absorb 2-4 adjacent players. You all win together.

**Abilities**:
1. Random Num Players [2,3,4]
2. RANDOM: Rotate All (to_left) - absorb adjacent
3. RANDOM: Rotate All (to_right) - absorb adjacent
4. Self Must Live; Special Win Alive (specified_players)

**Win Condition**: All absorbed players win if Blob survives

---

---

## Seed Data (JSON)

The following JSON can be used to seed the database:

```json
{
  "roles": [
    {
      "id": 1,
      "name": "Villager",
      "team": "village",
      "wake_order": null,
      "description": "You are a simple villager. You have no special abilities, but your vote counts!",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 2,
      "name": "Werewolf",
      "team": "werewolf",
      "wake_order": 1,
      "wake_target": "team.werewolf",
      "description": "You wake with other werewolves. If alone, view one center card.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_awake", "parameters": {"target": "team.werewolf"}, "is_required": true},
        {"order": 2, "modifier": "if", "ability": "view_card", "parameters": {"target": "center.main"}, "condition_type": "no_other_awake", "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "werewolf"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 3,
      "name": "Insomniac",
      "team": "village",
      "wake_order": 9,
      "wake_target": "player.self",
      "description": "You wake at the end of the night to check if your card changed.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "player.self"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 5,
      "name": "Robber",
      "team": "village",
      "wake_order": 4,
      "wake_target": "player.self",
      "description": "You may steal another player's role.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "take_card", "parameters": {"target": "player.other"}, "is_required": true},
        {"order": 2, "modifier": "and", "ability": "view_card", "parameters": {"target": "player.self"}, "is_required": true},
        {"order": 3, "modifier": "and", "ability": "swap_card", "parameters": {"target_a": "player.self", "target_b": "previous"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins_as_current",
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 6,
      "name": "Troublemaker",
      "team": "village",
      "wake_order": 5,
      "wake_target": "player.self",
      "description": "You may swap two other players' cards without looking.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "swap_card", "parameters": {"target_a": "player.other", "target_b": "player.other"}, "is_required": false},
        {"order": 2, "modifier": "and", "ability": "explicit_no_view", "parameters": {}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 7,
      "name": "Drunk",
      "team": "village",
      "wake_order": 6,
      "wake_target": "player.self",
      "description": "You swap your card with a center card without looking.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "swap_card", "parameters": {"target_a": "player.self", "target_b": "center.main"}, "is_required": true},
        {"order": 2, "modifier": "and", "ability": "explicit_no_view", "parameters": {}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins_as_current",
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 8,
      "name": "Minion",
      "team": "werewolf",
      "wake_order": 2,
      "wake_target": "player.self",
      "description": "You see who the werewolves are. You win if they survive.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "thumbs_up", "parameters": {"target": "team.werewolf"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "werewolf"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 9,
      "name": "Mason",
      "team": "village",
      "wake_order": 3,
      "wake_target": "player.self",
      "description": "You wake with other Masons and know each other.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_awake", "parameters": {"target": "role.mason"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 10,
      "name": "Apprentice Seer",
      "team": "village",
      "wake_order": 4,
      "wake_target": "player.self",
      "description": "You may look at one center card.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "center.main", "count": 1}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 11,
      "name": "Seer",
      "team": "village",
      "wake_order": 4,
      "wake_target": "player.self",
      "description": "You may look at one player's card or two center cards.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "player.other", "count": 1}, "is_required": true},
        {"order": 2, "modifier": "or", "ability": "view_card", "parameters": {"target": "center.main", "count": 2}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 12,
      "name": "Witch",
      "team": "village",
      "wake_order": 4,
      "wake_target": "player.self",
      "description": "View a center card. You may swap it with any player's card.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "center.main"}, "is_required": true},
        {"order": 2, "modifier": "and", "ability": "swap_card", "parameters": {"target_a": "viewed", "target_b": "player.other"}, "is_required": false},
        {"order": 3, "modifier": "or", "ability": "swap_card", "parameters": {"target_a": "viewed", "target_b": "player.self"}, "is_required": false}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 13,
      "name": "Marksman",
      "team": "village",
      "wake_order": 4,
      "wake_target": "player.self",
      "description": "You may look at one other player's card.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "player.other"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 14,
      "name": "Mystic Wolf",
      "team": "werewolf",
      "wake_order": 2,
      "wake_target": "player.self",
      "description": "You are a werewolf. You may look at one other player's card.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "player.other"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "werewolf"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 15,
      "name": "Doppelganger",
      "team": "village",
      "wake_order": 0,
      "wake_target": "player.self",
      "description": "Look at another player's card and become that role.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "player.other"}, "is_required": true},
        {"order": 2, "modifier": "and", "ability": "copy_role", "parameters": {}, "is_required": true},
        {"order": 3, "modifier": "and", "ability": "perform_immediately", "parameters": {}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins_as_current",
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 17,
      "name": "Copycat",
      "team": "village",
      "wake_order": 0,
      "wake_target": "player.self",
      "description": "Look at a center card and become that role.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "center.main"}, "is_required": true},
        {"order": 2, "modifier": "and", "ability": "copy_role", "parameters": {}, "is_required": true},
        {"order": 3, "modifier": "and", "ability": "perform_as", "parameters": {}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins_as_current",
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 18,
      "name": "Revealer",
      "team": "village",
      "wake_order": 7,
      "wake_target": "player.self",
      "description": "Flip a player's card. If werewolf/tanner, flip it back.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "player.other"}, "is_required": true},
        {"order": 2, "modifier": "and", "ability": "flip_card", "parameters": {"target": "player.other"}, "condition_type": "only_if_opponent", "condition_params": {"team": "village"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 20,
      "name": "Dream Wolf",
      "team": "werewolf",
      "wake_order": 1,
      "wake_target": "team.werewolf",
      "description": "You don't wake with wolves, but they see your thumb.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "thumbs_up", "parameters": {"target": "player.self"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "werewolf"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 21,
      "name": "Alpha Wolf",
      "team": "werewolf",
      "wake_order": 2,
      "wake_target": "player.self",
      "description": "Swap the center wolf card with another player's card.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "swap_card", "parameters": {"target_a": "center.bonus", "target_b": "player.other"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "werewolf"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 22,
      "name": "Paranormal Investigator",
      "team": "village",
      "wake_order": 4,
      "wake_target": "player.self",
      "description": "Look at up to two cards. If you see a werewolf, become one.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "player.other", "count": 2}, "is_required": true},
        {"order": 2, "modifier": "if", "ability": "change_to_team", "parameters": {"team": "werewolf"}, "condition_type": "only_if_team", "condition_params": {"team": "werewolf"}, "is_required": true},
        {"order": 3, "modifier": "and", "ability": "stop", "parameters": {}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins_as_current",
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 23,
      "name": "Village Idiot",
      "team": "village",
      "wake_order": 5,
      "wake_target": "player.self",
      "description": "You may rotate all player cards one position.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "rotate_all", "parameters": {"direction": "left", "count": 1}, "is_required": false},
        {"order": 2, "modifier": "or", "ability": "rotate_all", "parameters": {"direction": "right", "count": 1}, "is_required": false}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 24,
      "name": "Aura Seer",
      "team": "village",
      "wake_order": 7,
      "wake_target": "player.self",
      "description": "See who viewed or moved cards tonight.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "thumbs_up", "parameters": {"target": "players.actions"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 25,
      "name": "Apprentice Tanner",
      "team": "neutral",
      "wake_order": 2,
      "wake_target": "player.self",
      "description": "See who the Tanner is. You win if Tanner is eliminated.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "thumbs_up", "parameters": {"target": "role.tanner"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "special_win_alive",
          "condition_params": {"role": "tanner", "eliminated": true},
          "is_primary": true,
          "overrides_team": true
        }
      ]
    },
    {
      "id": 26,
      "name": "Beholder",
      "team": "village",
      "wake_order": 4,
      "wake_target": "player.self",
      "description": "You see who the Seer and Apprentice Seer are.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "thumbs_up", "parameters": {"target": "role.seer"}, "is_required": true},
        {"order": 2, "modifier": "and", "ability": "thumbs_up", "parameters": {"target": "role.apprentice_seer"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 27,
      "name": "Squire",
      "team": "werewolf",
      "wake_order": 2,
      "wake_target": "player.self",
      "description": "See who wolves are and view one of their cards.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "thumbs_up", "parameters": {"target": "team.werewolf"}, "is_required": true},
        {"order": 2, "modifier": "and", "ability": "view_card", "parameters": {"target": "role.werewolf"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "werewolf"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 28,
      "name": "Thing",
      "team": "village",
      "wake_order": 8,
      "wake_target": "player.self",
      "description": "Tap an adjacent player to let them know you exist.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "touch", "parameters": {"who": "player.self", "target": "player.adjacent", "location": "adjacent"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 29,
      "name": "Cow",
      "team": "village",
      "wake_order": 1,
      "wake_target": "team.alien",
      "description": "Wake when aliens wake. Adjacent aliens must tip you.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "thumbs_up", "parameters": {"target": "role.cow"}, "is_required": true},
        {"order": 2, "modifier": "if", "ability": "touch", "parameters": {"who": "team.alien", "target": "role.cow", "location": "adjacent"}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    },
    {
      "id": 30,
      "name": "Mortician",
      "team": "neutral",
      "wake_order": 4,
      "wake_target": "player.self",
      "description": "Randomly view cards and may join viewed roles.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "player.other", "random": [0, 1]}, "is_required": true},
        {"order": 2, "modifier": "and", "ability": "view_card", "parameters": {"target": "player.other", "random": [0, 1]}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "special_win_alive",
          "condition_params": {"with": "viewed_players"},
          "is_primary": true,
          "overrides_team": true
        }
      ]
    },
    {
      "id": 31,
      "name": "Blob",
      "team": "neutral",
      "wake_order": 10,
      "wake_target": "player.self",
      "description": "Absorb 2-4 adjacent players. You all win together.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "random_num_players", "parameters": {"options": [2, 3, 4]}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "self_must_live",
          "is_primary": true,
          "overrides_team": true
        },
        {
          "condition_type": "special_win_alive",
          "condition_params": {"with": "absorbed_players"},
          "is_primary": false,
          "overrides_team": true
        }
      ]
    },
    {
      "id": 4,
      "name": "Tanner",
      "team": "neutral",
      "wake_order": null,
      "description": "You hate your job. You only win if you are eliminated.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [],
      "win_conditions": [
        {
          "condition_type": "special_win_dead",
          "is_primary": true,
          "overrides_team": true
        }
      ]
    },
    {
      "id": 16,
      "name": "Bodyguard",
      "team": "village",
      "wake_order": 8,
      "wake_target": "player.self",
      "description": "Protect one player from elimination.",
      "visibility": "official",
      "votes": 1,
      "ability_steps": [
        {"order": 1, "modifier": "none", "ability": "view_card", "parameters": {"target": "player.other", "protect": true}, "is_required": true}
      ],
      "win_conditions": [
        {
          "condition_type": "team_wins",
          "condition_params": {"team": "village"},
          "is_primary": true,
          "overrides_team": false
        }
      ]
    }
  ]
}
```

---

## Role Count Summary

| Team | Count | Roles |
|------|-------|-------|
| Village | 20 | Villager, Insomniac, Robber, Troublemaker, Drunk, Mason, Apprentice Seer, Seer, Witch, Marksman, Doppelganger, Bodyguard, Copycat, Revealer, Paranormal Investigator, Village Idiot, Aura Seer, Beholder, Thing, Cow |
| Werewolf | 6 | Werewolf, Minion, Mystic Wolf, Dream Wolf, Alpha Wolf, Squire |
| Neutral | 4 | Tanner, Apprentice Tanner, Mortician, Blob |

**Total: 30 roles** (IDs 1-31, with gaps for future expansion)

---

*Last updated: January 31, 2026*
