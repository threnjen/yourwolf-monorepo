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

**Cause**: You ran `docker compose down -v`, which deletes the PostgreSQL data volume.

**Fix**: Re-run `docker compose up`. The seed script re-populates the 30 base roles and 15 abilities automatically. Custom roles and game sessions created during development are lost.

---

## Frontend

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

### `useFetch` causes infinite re-render loop

**Symptom**: Browser freezes or logs show hundreds of rapid re-renders.

**Cause**: The `fetcher` function passed to `useFetch` is not wrapped in `useCallback`, so it creates a new reference each render, triggering the effect again.

**Fix**: Wrap the fetcher in `useCallback`:
```tsx
const fetcher = useCallback(() => gamesApi.getById(gameId), [gameId]);
const {data, loading, error, refetch} = useFetch(fetcher);
```

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

**Fix**: Mock the specific API module, not axios directly:
```tsx
vi.mock('../api/games');
const mockCreate = gamesApi.create as ReturnType<typeof vi.fn>;
```

---

### `ReferenceError: document is not defined`

**Symptom**: Tests crash with errors about missing DOM globals.

**Cause**: Test file is not using the jsdom environment.

**Fix**: Verify `vite.config.ts` has `test.environment: 'jsdom'` and the test file is in `src/test/` or matches the test file pattern.
