# Troubleshooting

Common issues and their solutions, grouped by category. See also the quick-reference table at the bottom of [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md).

---

## Docker & Stack Startup

### Backend container exits immediately on startup

**Symptom**: `yourwolf-backend` container exits with code 1 shortly after `docker compose up`.

**Cause**: PostgreSQL isn't ready yet, or a migration fails.

**Fix**:
1. Check logs: `docker compose logs backend`
2. If DB connection error, the `db` healthcheck may not have passed yet. Re-run: `docker compose up`
3. If migration error, check `docker compose logs backend` for the specific Alembic error and fix the migration.

---

### `relation "roles" does not exist` (or any table)

**Symptom**: Backend returns 500 errors; logs show `relation does not exist`.

**Cause**: Alembic migrations were not applied (or were applied against a different schema version).

**Fix**:
```bash
docker compose exec backend alembic upgrade head
```

If that fails, reset the database:
```bash
docker compose down -v
docker compose up --build
```

---

### Port already in use (3000 / 8000 / 5432)

**Symptom**: `docker compose up` fails with `Bind for 0.0.0.0:XXXX failed: port is already allocated`.

**Cause**: Another process (or a previous Docker run) is using the port.

**Fix**:
```bash
# Find what's using the port (macOS/Linux)
lsof -i :8000

# Kill it, or stop the conflicting Docker containers
docker compose down
```

---

### Database data unexpectedly gone

**Symptom**: All roles and game sessions are missing after restarting.

**Cause**: You ran `docker compose down -v`, which deletes the PostgreSQL data volume. This command does not clear frontend IndexedDB data for `http://localhost:3000`.

**Fix**: Re-run `docker compose up`. The backend seed script re-populates the 30 base roles and 15 abilities. Check the browser's `yourwolf-local` IndexedDB database separately for local custom roles and game snapshots.

---

## Frontend

### The catalog never leaves the loading state or shows a database error

**Symptom**: The navigation renders, but routes stay behind the catalog loading gate or an IndexedDB error appears.

**Cause**: The browser blocked or failed to open the `yourwolf-local` IndexedDB database. A failed seed transaction leaves the seed version unapplied so the next launch can retry.

**Fix**: Confirm that the browser permits site storage for the current origin, then reload. For a clean development reset, clear site data for that exact origin. Development and packaged Tauri origins use separate stores.

### Frontend shows stale code after changes

**Symptom**: Browser shows old component behavior despite saving changes.

**Cause**: Vite's hot module replacement (HMR) cache is stale, or `node_modules` volume is outdated.

**Fix**:
```bash
docker compose down
docker compose up --build
```

If running standalone: stop the dev server, delete `node_modules/.vite`, restart with `npm run dev`.

---

### Frontend can't reach the backend API

**Symptom**: Network errors in the browser console; API calls fail with `ERR_CONNECTION_REFUSED`.

**Cause**: `VITE_API_URL` is not configured, or the backend isn't running.

**Fix**:
1. Verify `yourwolf-frontend/.env` contains `VITE_API_URL=http://localhost:8000`
2. Verify the backend container is running: `docker compose ps`
3. Test the backend directly: `curl http://localhost:8000/health`

---

### Lint fails: "src/domain and src/engine must stay pure TypeScript"

**Symptom**: `no-restricted-imports` errors on an import inside `src/domain/` (or `src/engine/`), including on an `import type`.

**Cause**: `eslint.config.js` enforces layer direction. `src/domain` may not import React, any UI layer (`api`, `hooks`, `components`, `pages`, `styles`), or transport DTOs from `src/types`. Type-only imports are restricted too (`allowTypeImports` is false) — a transport DTO leaking in as a type still couples the domain to the wire format.

**Fix**: Declare the shape the rule needs in `src/domain` and have the transport type depend on it, not the reverse. Dependencies point inward. If a domain function needs React state, that's a signal the rule belongs in the domain and the wiring belongs in the component.

---

### Lint fails: "src/components must not import src/api directly"

**Symptom**: `no-restricted-imports` error on an `src/api` import inside a component.

**Cause**: Components consume data through hooks.

**Fix**: Use an existing hook from `src/hooks`, or add one that wraps the API call.

---

### `react-hooks/exhaustive-deps` errors appear on untouched code

**Symptom**: Hook dependency errors in files you didn't change.

**Cause**: The ESLint configuration enforces the `react-hooks` rules and treats `exhaustive-deps` as an error across the frontend.

**Fix**: Fix the dependency array. Do not re-add a blanket disable; if a dependency genuinely must be omitted, disable that one line with a comment explaining why.

---

### `useFetch` causes infinite re-render loop

**Symptom**: Browser freezes or logs show hundreds of rapid re-renders.

**Cause**: The `fetcher` function passed to `useFetch` is not wrapped in `useCallback`, so it creates a new reference each render, triggering the effect again.

**Fix**: Wrap the fetcher in `useCallback`:
```tsx
const fetcher = useCallback(() => rolesApi.list({limit: 100}), []);
const {data, loading, error, refetch} = useFetch(fetcher);
```

---

## Backend

### `ImportError: cannot import name 'SessionLocal' from 'app.database'`

**Symptom**: `ImportError` for `SessionLocal`, `engine` (from `app.database`), or `settings` (from `app.config`).

**Cause**: These module-level globals were removed in favor of lazily-constructed cached accessors, so that importing a module never requires `DATABASE_URL` or opens a connection.

**Fix**: Use the accessors:
```python
from app.config import get_settings
from app.database import get_engine, get_session_factory

settings = get_settings()
db = get_session_factory()()
```
`from app.database import Base` still works — `Base` now lives in `app/models/base.py` and is re-exported.

---

### Settings don't pick up an environment variable change

**Symptom**: Setting `DATABASE_URL` (or another env var) has no effect; the old value is still used.

**Cause**: `get_settings()` is wrapped in `functools.cache`. Once resolved, later env changes are ignored.

**Fix**: Clear the cache after changing the environment:
```python
monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
get_settings.cache_clear()
```
`get_engine()` and `get_session_factory()` are cached the same way — clear them too if the engine must be rebuilt.

---

### A service error returns 500 instead of 400 / 403 / 404

**Symptom**: A validation or permission failure surfaces as an unhandled 500.

**Cause**: The service raised an exception that isn't in the registered domain vocabulary. Only `NotFoundError`, `DomainValidationError`, and `LockedError` are mapped in `app/main.py`; everything else falls through to the framework's 500 path. A bare `ValueError` no longer produces a 400 — status codes are no longer inferred from message prose.

**Fix**: Raise the right type from `app/exceptions.py`:
```python
from app.exceptions import DomainValidationError

raise DomainValidationError("Role must have at least one win condition.")
```

---

### Role creation returns 422 where 400 was expected

**Symptom**: A test or client expecting 400 gets 422, typically for role name length or an ability-step `modifier`.

**Cause**: These are Pydantic schema bounds, validated by FastAPI before the service runs, so they return 422. Role name bounds are `min_length=2, max_length=50`. Only domain rule violations return 400.

**Fix**: Expect 422 for schema-shape violations and 400 for domain rules. `POST /roles` enforces the full `validate_role` rule set, including at least one win condition.

---

### Editing `app/seed/roles.py` doesn't change the seeded roles

**Symptom**: Role definition changes have no effect after re-seeding.

**Cause**: `app/seed/roles.py` is only a loader. The definitions live in `app/seed/data/roles.json`.

**Fix**: Edit the JSON. If the file is malformed or references an unknown ability type, the loader raises `SeedDataError` before any DB write, so seeding fails cleanly rather than partially.

---

## Backend Tests

### Tests fail with `OperationalError: no such table`

**Symptom**: Pytest fails with SQLite errors about missing tables.

**Cause**: A new model was added or modified but the test fixture didn't create the schema.

**Fix**: Tests use `Base.metadata.create_all()` per function. Ensure:
1. The new model is imported in `conftest.py` (SQLAlchemy needs models imported to know about them)
2. If you added a model file, import it in `app/models/__init__.py`

---

### Tests fail because abilities are missing

**Symptom**: Tests expecting ability data fail with empty results or foreign key errors.

**Cause**: Test database starts empty. The `_ensure_abilities()` helper in `conftest.py` must be called to provision the 15 ability primitives.

**Fix**: Use the `seeded_abilities` or `seeded_roles` fixture, or call `_ensure_abilities(db_session)` directly at the start of your test.

---

## Frontend Tests

### Axios calls not being mocked

**Symptom**: Tests make real HTTP requests or fail with network errors.

**Cause**: The global Axios mock in `src/test/setup.ts` mocks `axios.create()` but tests may import the already-created `apiClient` instance.

**Fix**: Mock the specific API module, not axios directly. Note that `src/test/` mirrors the source tree, so the relative depth depends on where the test file sits. From `src/test/pages/GameSetup.test.tsx`, the roles client path is `../../api/roles`, not `../api/roles`:
```tsx
vi.mock('../../api/roles');
const mockList = rolesApi.list as ReturnType<typeof vi.fn>;
```

Game creation and phase transitions use the TypeScript engine and the provider-backed `GameRepository` in `src/data/indexeddb.ts`. Tests for those paths mock repository reads and writes, not an API client.

---

### `ReferenceError: document is not defined`

**Symptom**: Tests crash with errors about missing DOM globals.

**Cause**: Test file is not using the jsdom environment.

**Fix**: Verify `vite.config.ts` has `test.environment: 'jsdom'` and the test file is in `src/test/` or matches the test file pattern.
