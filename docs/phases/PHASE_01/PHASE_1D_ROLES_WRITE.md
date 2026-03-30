# Phase 1D: Roles API — Write Operations

> Full CRUD for non-official roles

## Overview

**Goal**: Enable create, update, and delete operations for custom roles while protecting official roles.

**Status**: ✅ Complete

---

## Success Criteria

- [x] `POST /api/roles` creates role with ability_steps
- [x] `PUT /api/roles/{id}` updates non-locked roles
- [x] `DELETE /api/roles/{id}` cascades to related records
- [x] Official roles (is_locked=true) return 404 on PUT/DELETE
- [x] Unit tests for role write operations pass

---

## Key Files

| File | Purpose |
|------|---------|
| `app/routers/roles.py` | Create/Update/Delete endpoints |
| `app/schemas/role.py` | RoleCreate, RoleUpdate schemas |
| `app/services/role_service.py` | CRUD business logic |
| `tests/test_roles.py` | Role CRUD tests |

---

## API Endpoints

### POST /api/roles

Creates a new custom role.

**Request Body**:
```json
{
  "name": "Custom Seer",
  "description": "A variant of the Seer",
  "team": "village",
  "wake_order": 4,
  "visibility": "private",
  "ability_steps": [
    {
      "ability_type": "view_card",
      "step_order": 0,
      "parameters": {"target": "player"},
      "is_required": true
    }
  ],
  "win_conditions": [
    {
      "condition_type": "team_wins",
      "is_primary": true
    }
  ]
}
```

**Response**: `201 Created`

### PUT /api/roles/{id}

Updates an existing non-locked role.

**Restrictions**:
- Cannot update official roles (is_locked=true)
- Returns 404 for locked roles (not found/modifiable)

**Response**: `200 OK` or `404 Not Found`

### DELETE /api/roles/{id}

Deletes a role and all related records.

**Restrictions**:
- Cannot delete official roles (is_locked=true)
- Returns 404 for locked roles

**Cascade Behavior**:
- Deletes all associated `ability_steps`
- Deletes all associated `win_conditions`

**Response**: `204 No Content` or `404 Not Found`

---

## Business Rules

### Locked Role Protection

Official roles are marked with `is_locked=true` and cannot be:
- Modified via PUT
- Deleted via DELETE

The API returns 404 (not 403) for these operations to prevent enumeration of locked role IDs.

### Cascade Deletes

When a role is deleted:
1. All `ability_steps` with matching `role_id` are deleted
2. All `win_conditions` with matching `role_id` are deleted
3. The role itself is deleted

This is enforced at the database level via foreign key constraints with `ON DELETE CASCADE`.

---

## QA Checklist

### Create Role

- [x] POST `/api/roles` with valid data creates role, returns 201
- [x] POST `/api/roles` missing required fields returns 422
- [x] POST `/api/roles` with ability_steps array creates steps correctly
- [x] POST `/api/roles` with win_conditions array creates conditions correctly
- [x] Created role has `is_locked=false`
- [x] Created role has `visibility=private` by default

### Update Role

- [x] PUT `/api/roles/{id}` with valid data updates and returns role
- [x] PUT `/api/roles/{id}` on official role returns 404
- [x] PUT updates only provided fields (partial update)

### Delete Role

- [x] DELETE `/api/roles/{id}` deletes role, returns 204
- [x] DELETE `/api/roles/{id}` on official role returns 404
- [x] DELETE cascades to delete related ability_steps
- [x] DELETE cascades to delete related win_conditions

### Cascade Verification

```sql
-- After deleting a role, verify no orphaned records
SELECT COUNT(*) FROM ability_steps WHERE role_id = '<deleted_id>';
SELECT COUNT(*) FROM win_conditions WHERE role_id = '<deleted_id>';
```

- [x] Both queries return 0

### Tests

```bash
docker compose exec backend pytest tests/test_roles.py -v -k "create or update or delete"
```

- [x] All role write tests pass

---

*Completed: February 2026*
