# Role Validation Service — Context

> Key files, decisions, constraints, and patterns for implementation.

---

## Key Files

| File | Role | What Changes |
|------|------|-------------|
| `app/schemas/role.py` | Pydantic schemas | Add `RoleValidationResponse`, `RoleNameCheckResponse` |
| `app/services/role_service.py` | Business logic | Add `validate_role()`, `check_duplicate_name()`, `get_warnings()` |
| `app/routers/roles.py` | HTTP endpoints | Add `POST /validate`, `GET /check-name` |
| `app/models/ability.py` | Ability model | Read-only — queried during ability type validation |
| `app/models/role.py` | Role model + enums | Read-only — `Visibility` enum used in duplicate check |
| `tests/test_role_validation.py` | New test file | All validation unit + integration tests |
| `tests/conftest.py` | Test fixtures | May need new fixtures for roles with specific names/visibilities |

---

## Existing Patterns to Follow

### Schema Pattern

All schemas in `app/schemas/role.py` follow:
- Inherit from `pydantic.BaseModel`
- Use `Field(...)` with descriptions for required fields
- Use `Field(default=...)` for optional fields
- Response schemas used by endpoints that read from DB use `ConfigDict(from_attributes=True)`
- Pure response models (not ORM-mapped) skip `ConfigDict`

### Service Pattern

`RoleService` in `app/services/role_service.py`:
- Initialized with `db: Session` in `__init__`
- All methods are instance methods using `self.db`
- Methods return Pydantic schemas (not ORM models) for responses
- Uses `joinedload` / `selectinload` for eager loading relationships
- `func` imported from `sqlalchemy` for SQL functions

### Router Pattern

`app/routers/roles.py`:
- Uses `APIRouter()` with no prefix (prefix set in `main.py` as `/api/roles`)
- Depends on `get_db` for database sessions
- Instantiates `RoleService(db)` per request
- Returns Pydantic models; FastAPI handles serialization
- Static routes (`/official`) are registered before parameterized routes (`/{role_id}`)

### Test Pattern

- Test classes grouped by feature: `TestListRoles`, `TestGetRoleById`, `TestCreateRole`
- Fixtures from `conftest.py`: `db_session`, `client`, `sample_ability`, `sample_role`, `sample_roles`
- Integration tests use `client` (TestClient); unit tests use `db_session` directly with `RoleService`
- Assertions use `response.status_code` and `response.json()` field checks

---

## Key Decisions

### D1: Public Method Name

**Decision**: Use `validate_role()` (public), not `_validate_role()` (private).

**Rationale**: The method is called from the router endpoint. Making it private and then calling it from outside the class violates the convention. The Phase 3 spec showed `_validate_role` but that was illustrative — the actual implementation should follow Python convention.

### D2: Validation Returns Strings, Not Exceptions

**Decision**: `validate_role()` returns `list[str]` of error messages. It does not raise exceptions.

**Rationale**: The `/validate` endpoint needs to return all errors at once for UX. Raising on first error would require try/except wrapping and lose subsequent errors. The caller (router) checks `len(errors) == 0` to determine validity.

### D3: Warnings Separate from Errors

**Decision**: `get_warnings()` is a separate method, not interleaved with `validate_role()`.

**Rationale**: Warnings are advisory — they never block creation. Keeping them separate makes the caller's logic clearer: errors → block, warnings → display.

### D4: Route Registration Order

**Decision**: `/validate` and `/check-name` must be registered before `/{role_id}` in the router.

**Rationale**: FastAPI matches routes in registration order. If `/{role_id}` comes first, "validate" and "check-name" would be interpreted as UUID path parameters and fail with 422.

### D5: No Validation on Create (Yet)

**Decision**: The existing `POST /api/roles/` endpoint does NOT call `validate_role()` — validation is opt-in via the `/validate` endpoint.

**Rationale**: Adding mandatory validation to create would change existing behavior and could break tests. This can be added later as a follow-up. The frontend will call `/validate` before `/` by convention.

---

## Constraints

1. **No new dependencies** — validation uses stdlib and SQLAlchemy only
2. **SQLite compatibility** — `func.lower()` works on SQLite; no PostgreSQL-specific functions
3. **No auth** — endpoints are unauthenticated; `exclude_role_id` is passed directly, not derived from a session
4. **Schema reuse** — `RoleCreate` is the input for both `POST /` and `POST /validate`; no new input schema needed

---

## Frontend Contract Reference

The frontend `role-builder-wizard` feature will consume these endpoints. Contract details are documented identically in both this file and `yourwolf-frontend/dev/active/role-builder-wizard/role-builder-wizard-context.md`.

---

*Last updated: March 26, 2026*
