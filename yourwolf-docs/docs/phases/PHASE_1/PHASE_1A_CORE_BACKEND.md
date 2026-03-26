# Phase 1A: Core Backend Foundation

> Database models, migrations, and health endpoints

## Overview

**Goal**: Establish the backend infrastructure with SQLAlchemy models, Alembic migrations, and health check endpoints.

**Status**: ✅ Complete

---

## Success Criteria

- [x] PostgreSQL database starts via Docker
- [x] SQLAlchemy models defined for all entities
- [x] Alembic migration creates all tables
- [x] Health endpoints return 200 OK
- [x] Unit tests for models and health pass

---

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `app/models/role.py` | Role model with all fields |
| `app/models/ability.py` | Ability primitive model |
| `app/models/ability_step.py` | Role-Ability junction with parameters |
| `app/models/win_condition.py` | Win condition model |
| `app/models/user.py` | User model (minimal for Phase 1) |
| `app/models/types.py` | Shared enums (Team, Visibility, etc.) |
| `app/database.py` | Database connection and session |
| `app/routers/health.py` | Health check endpoints |
| `alembic/versions/*.py` | Initial migration |

---

## Data Models

### Role

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | String | Role name (unique) |
| `description` | String | Role description |
| `team` | Enum | village, werewolf, vampire, alien, neutral |
| `wake_order` | Integer | Order in night phase (null = doesn't wake) |
| `wake_target` | String | What they target when waking |
| `votes` | Integer | Number of votes (default 1) |
| `visibility` | Enum | private, public, official |
| `is_locked` | Boolean | True for official roles (immutable) |
| `vote_score` | Integer | Community rating |
| `use_count` | Integer | Times used in games |
| `creator_id` | UUID | FK to users (null for official) |
| `created_at` | DateTime | Timestamp |
| `updated_at` | DateTime | Timestamp |

### Ability

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `type` | String | Unique identifier (e.g., `view_card`) |
| `name` | String | Display name |
| `description` | String | What the ability does |
| `parameters_schema` | JSON | Schema for ability parameters |
| `is_active` | Boolean | Whether ability is available |
| `created_at` | DateTime | Timestamp |

### AbilityStep

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `role_id` | UUID | FK to roles |
| `ability_id` | UUID | FK to abilities |
| `order` | Integer | Step order (0-indexed) |
| `modifier` | Enum | none, and, or, if |
| `is_required` | Boolean | Must complete this step |
| `parameters` | JSON | Step-specific parameters |
| `condition_type` | String | Conditional logic type |
| `condition_params` | JSON | Condition parameters |

### WinCondition

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `role_id` | UUID | FK to roles |
| `condition_type` | String | Type of win condition |
| `condition_params` | JSON | Condition parameters |
| `is_primary` | Boolean | Primary win condition |
| `overrides_team` | Boolean | Overrides team win |

### User (Minimal)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `username` | String | Display name |
| `email` | String | Email address |
| `cognito_id` | String | AWS Cognito user ID |
| `is_anonymous` | Boolean | Guest user |
| `is_admin` | Boolean | Admin privileges |
| `is_banned` | Boolean | Account banned |
| `created_at` | DateTime | Timestamp |
| `updated_at` | DateTime | Timestamp |

---

## QA Checklist

### Database Tables

```bash
docker compose exec db psql -U yourwolf -d yourwolf -c '\dt'
```

- [x] `roles` table exists
- [x] `abilities` table exists
- [x] `ability_steps` table exists
- [x] `win_conditions` table exists
- [x] `users` table exists
- [x] `alembic_version` table exists

### Health Endpoints

- [x] GET `http://localhost:8000/health` returns `{"status": "healthy"}` with 200
- [x] GET `http://localhost:8000/health/db` returns `{"status": "connected"}` with 200
- [x] Stop database → `/health/db` returns error status

### Migrations

```bash
docker compose exec backend alembic current
docker compose exec backend alembic history
```

- [x] `alembic current` shows current migration revision
- [x] `alembic history` shows migration history
- [x] Schema matches model definitions

### Tests

```bash
docker compose exec backend pytest tests/test_health.py tests/test_models.py -v
```

- [x] All health tests pass
- [x] All model tests pass

---

*Completed: February 2026*
