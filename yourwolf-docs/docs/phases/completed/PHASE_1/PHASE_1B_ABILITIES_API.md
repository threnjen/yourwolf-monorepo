# Phase 1B: Abilities API

> Ability primitives seeded and queryable

## Overview

**Goal**: Seed 15 ability primitives and expose them via REST API.

**Status**: ✅ Complete

---

## Success Criteria

- [x] 15 ability primitives seeded to database
- [x] `GET /api/abilities` returns all 15 abilities
- [x] `GET /api/abilities/{type}` returns specific ability
- [x] `GET /api/abilities/nonexistent` returns 404
- [x] Unit tests for abilities pass

---

## Key Files

| File | Purpose |
|------|---------|
| `app/seed/abilities.py` | 15 ability primitive definitions |
| `app/routers/abilities.py` | Abilities API endpoints |
| `app/schemas/ability.py` | Ability Pydantic schemas |
| `tests/test_abilities.py` | Ability endpoint tests |

---

## 15 Ability Primitives

| Type | Name | Description |
|------|------|-------------|
| `take_card` | Take Card | Take a card from a location |
| `swap_card` | Swap Card | Swap cards between locations |
| `view_card` | View Card | Look at a card |
| `flip_card` | Flip Card | Turn a card face-up |
| `copy_role` | Copy Role | Copy another role's ability |
| `view_awake` | View Awake | See who else is awake |
| `thumbs_up` | Thumbs Up | Give a signal to another player |
| `explicit_no_view` | Explicit No-View | Explicitly cannot view |
| `rotate_all` | Rotate All | Rotate all cards in a direction |
| `touch` | Touch | Touch another player |
| `change_to_team` | Change Team | Change a player's team |
| `perform_as` | Perform As | Act as another role |
| `perform_immediately` | Perform Immediately | Take action right away |
| `stop` | Stop | End current action |
| `random_num_players` | Random Number | Select random number of players |

---

## API Endpoints

### GET /api/abilities

Returns all active abilities.

**Response**: `200 OK`
```json
[
  {
    "id": "uuid",
    "type": "view_card",
    "name": "View Card",
    "description": "Look at a card without revealing it",
    "parameters_schema": {...},
    "is_active": true
  }
]
```

### GET /api/abilities/{type}

Returns a specific ability by type.

**Response**: `200 OK` or `404 Not Found`

---

## QA Checklist

### Seed Verification

```bash
docker compose exec db psql -U yourwolf -d yourwolf -c 'SELECT COUNT(*) FROM abilities;'
```

- [x] Returns exactly 15 abilities

### List Abilities

- [x] GET `/api/abilities` returns array of 15 abilities
- [x] Each ability has `id`, `type`, `name`, `description` fields
- [x] Each ability has `parameters_schema` field (JSON object or null)

### Verify All 15 Primitives

- [x] `take_card` - "Take Card"
- [x] `swap_card` - "Swap Card"
- [x] `view_card` - "View Card"
- [x] `flip_card` - "Flip Card"
- [x] `copy_role` - "Copy Role"
- [x] `view_awake` - "View Awake"
- [x] `thumbs_up` - "Thumbs Up"
- [x] `explicit_no_view` - "Explicit No-View"
- [x] `rotate_all` - "Rotate All"
- [x] `touch` - "Touch"
- [x] `change_to_team` - "Change Team"
- [x] `perform_as` - "Perform As"
- [x] `perform_immediately` - "Perform Immediately"
- [x] `stop` - "Stop"
- [x] `random_num_players` - "Random Number"

### Get by Type

- [x] GET `/api/abilities/view_card` returns ability details
- [x] GET `/api/abilities/nonexistent` returns 404 Not Found

### Tests

```bash
docker compose exec backend pytest tests/test_abilities.py -v
```

- [x] All ability tests pass

---

*Completed: February 2026*
