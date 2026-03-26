# Phase 1C: Roles API — Read Operations

> Official roles seeded and queryable

## Overview

**Goal**: Seed 30 official roles with ability steps and win conditions, expose via read-only API endpoints.

**Status**: ✅ Complete

---

## Success Criteria

- [x] 30 official roles seeded (idempotent)
- [x] `GET /api/roles` returns paginated list
- [x] `GET /api/roles?team=X` filters correctly
- [x] `GET /api/roles/official` returns official roles only
- [x] `GET /api/roles/{id}` includes ability_steps and win_conditions
- [x] Unit tests for role read operations pass

---

## Key Files

| File | Purpose |
|------|---------|
| `app/seed/roles.py` | 30 official role definitions |
| `app/routers/roles.py` | Roles API endpoints |
| `app/schemas/role.py` | Role Pydantic schemas |
| `app/services/role_service.py` | Role business logic |
| `tests/test_roles.py` | Role endpoint tests |

---

## 30 Official Roles

### Village Team (20 roles)

| Role | Wake Order | Description |
|------|------------|-------------|
| Villager | - | No special ability |
| Insomniac | 9 | Views own card at end of night |
| Robber | 4 | Swaps card with another player |
| Troublemaker | 5 | Swaps two other players' cards |
| Drunk | 6 | Swaps own card with center |
| Mason | 3 | Sees other Masons |
| Apprentice Seer | 4 | Views one center card |
| Seer | 4 | Views player or two center cards |
| Witch | 4 | Views center, may swap to player |
| Marksman | 4 | Views card, may swap with adjacent |
| Doppelganger | 0 | Copies another player's role |
| Bodyguard | 8 | Protects a player from death |
| Copycat | 0 | Copies center card ability |
| Revealer | 7 | Flips a player's card face-up |
| Paranormal Investigator | 4 | Views cards until finds werewolf |
| Village Idiot | 5 | Rotates all cards one position |
| Aura Seer | 7 | Sees if player moved/viewed cards |
| Beholder | 4 | Sees who the Seer is |
| Thing | 8 | Touches adjacent player |
| Cow | 1 | Shows team to werewolves |

### Werewolf Team (6 roles)

| Role | Wake Order | Description |
|------|------------|-------------|
| Werewolf | 1 | Basic werewolf |
| Minion | 2 | Knows werewolves, wins with them |
| Mystic Wolf | 2 | Werewolf that can view a card |
| Dream Wolf | 1 | Werewolf that doesn't wake |
| Alpha Wolf | 2 | Can turn player into werewolf |
| Squire | 2 | Knows werewolves, human minion |

### Neutral Team (4 roles)

| Role | Wake Order | Description |
|------|------------|-------------|
| Tanner | - | Wins by being killed |
| Apprentice Tanner | 2 | Knows tanner, wins if tanner dies |
| Mortician | 4 | Sees dead players' roles |
| Blob | 10 | Absorbs adjacent players |

---

## API Endpoints

### GET /api/roles

Returns paginated list of roles with optional filters.

**Query Parameters**:
- `team` - Filter by team (village, werewolf, vampire, alien, neutral)
- `visibility` - Filter by visibility (private, public, official)
- `page` - Page number (default 1)
- `limit` - Items per page (default 20)

**Response**: `200 OK`
```json
{
  "items": [...],
  "total": 30,
  "page": 1,
  "limit": 20,
  "pages": 2
}
```

### GET /api/roles/official

Returns all official roles (no pagination).

### GET /api/roles/{id}

Returns full role details with ability_steps and win_conditions.

---

## QA Checklist

### Seed Verification

```bash
docker compose exec db psql -U yourwolf -d yourwolf -c 'SELECT COUNT(*) FROM roles;'
```

- [x] Returns exactly 30 roles
- [x] Run seed twice → still 30 roles (idempotent)

### Role Fields

- [x] `id` - UUID format
- [x] `name` - String, not empty
- [x] `description` - String
- [x] `team` - One of: village, werewolf, vampire, alien, neutral
- [x] `visibility` - One of: private, public, official
- [x] `wake_order` - Integer or null
- [x] `votes` - Integer (default 1)
- [x] `is_locked` - Boolean (true for official)
- [x] `ability_steps` - Array
- [x] `win_conditions` - Array (≥1 for official roles)

### List Roles

- [x] GET `/api/roles` returns paginated response
- [x] GET `/api/roles/official` returns all 30 official roles
- [x] Response includes pagination fields: `items`, `total`, `page`, `limit`, `pages`

### Filter Roles

- [x] GET `/api/roles?team=village` returns only village roles
- [x] GET `/api/roles?team=werewolf` returns 6 werewolf roles
- [x] GET `/api/roles?team=neutral` returns neutral roles

### Pagination

- [x] GET `/api/roles?limit=5` returns exactly 5 roles
- [x] GET `/api/roles?page=2&limit=10` returns roles 11-20
- [x] GET `/api/roles?page=100` returns empty array

### Get Role by ID

- [x] GET `/api/roles/{valid_id}` returns full role with ability_steps
- [x] Response includes `ability_steps` array
- [x] Response includes `win_conditions` array
- [x] GET `/api/roles/00000000-0000-0000-0000-000000000000` returns 404
- [x] GET `/api/roles/invalid-uuid` returns 422 Validation Error

### Tests

```bash
docker compose exec backend pytest tests/test_roles.py -v -k "list or get or filter"
```

- [x] All role read tests pass

---

*Completed: February 2026*
