# Local Development

> How to start, use, and manage the YourWolf development stack.

See [PROJECT_SETUP.md](PROJECT_SETUP.md) if this is your first time setting up the project.

All `docker compose` commands must be run from the `yourwolf-backend/` directory.

---

## Starting the Stack

### First run or after code changes

```bash
cd yourwolf-backend
docker compose up --build
```

### Subsequent runs (no code changes)

```bash
docker compose up
```

### Run in the background

```bash
docker compose up -d
```

On every startup, the backend container automatically:
1. Runs `alembic upgrade head` — applies any pending database migrations
2. Runs `python -m app.seed` — loads seed data (idempotent; safe to run repeatedly)
3. Starts Uvicorn with hot reload enabled

The frontend container runs `npm install && npm run dev` with hot reload.

---

## Service URLs

Once the stack is up, the following URLs are available:

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:3000 | React / Vite dev server |
| Backend | http://localhost:8000 | FastAPI |
| API Docs (Swagger) | http://localhost:8000/docs | Interactive API explorer |
| API Docs (ReDoc) | http://localhost:8000/redoc | |
| Database | `localhost:5432` | PostgreSQL 16 |

---

## Database Migrations (Alembic)

Migrations run automatically on startup. To run them manually or create new ones:

```bash
# Apply all pending migrations
docker compose exec backend alembic upgrade head

# Check current migration state
docker compose exec backend alembic current

# View migration history
docker compose exec backend alembic history

# Create a new migration after changing a model
docker compose exec backend alembic revision --autogenerate -m "describe your change"
```

---

## Seed Data

The seed script runs automatically on startup. To run it manually:

```bash
docker compose exec backend python -m app.seed
```

The seed script is idempotent — running it multiple times will not create duplicate records.

---

## Running the Frontend Standalone (Without Docker)

```bash
cd yourwolf-frontend
npm install
npm run dev
```

The dev server starts at http://localhost:3000. Ensure `VITE_API_URL` in `yourwolf-frontend/.env` points to a running backend instance.

---

## Running the Backend Standalone (Without Docker)

Requires PostgreSQL running locally and `DATABASE_URL` updated to use `localhost` (see [PROJECT_SETUP.md](PROJECT_SETUP.md)).

```bash
cd yourwolf-backend
source .venv/bin/activate
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

---

## Running Tests

### Backend Tests

The backend container must be running. Tests connect to the PostgreSQL `db` service.

```bash
# Full test suite with coverage report
docker compose exec backend pytest

# Verbose output
docker compose exec backend pytest -v

# Stop on first failure
docker compose exec backend pytest -x

# Run a specific test file
docker compose exec backend pytest tests/test_games_router.py
```

Coverage settings are configured in `pyproject.toml` with a minimum threshold of 80%.

### Frontend Tests

Frontend tests run outside Docker (they use jsdom, not a real browser).

```bash
cd yourwolf-frontend

# Run tests in watch mode
npm test

# Run tests once with coverage report
npm run test:coverage

# Interactive test UI
npm run test:ui
```

Coverage thresholds are configured in `vite.config.ts` at 80% for lines, branches, functions, and statements.

---

## Viewing Logs

```bash
# Follow all services
docker compose logs -f

# Follow a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

---

## Container Status

```bash
docker compose ps
```

All three containers (`yourwolf-db`, `yourwolf-backend`, `yourwolf-frontend`) should show status `Up`.

---

## Stopping the Stack

### Stop containers, preserve database data

```bash
docker compose down
```

### Stop and wipe all database data

```bash
docker compose down -v
```

> Use `down -v` for a clean slate. All PostgreSQL data is permanently deleted. Seed data will be re-populated automatically on the next `docker compose up`.

---

## Database Shell

```bash
docker compose exec db psql -U yourwolf -d yourwolf
```

Useful one-liners:

```bash
# List all tables
docker compose exec db psql -U yourwolf -d yourwolf -c '\dt'

# Check seeded role count
docker compose exec db psql -U yourwolf -d yourwolf -c 'SELECT COUNT(*) FROM roles;'
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Backend exits immediately on startup | DB not ready | The backend waits for the `db` healthcheck; retry `docker compose up` |
| `relation does not exist` errors | Migrations not applied | `docker compose exec backend alembic upgrade head` |
| Frontend shows stale code | Vite cache issue | `docker compose down && docker compose up --build` |
| Port already in use (8000 / 3000 / 5432) | Another process on that port | Stop the conflicting process, or change ports in `docker-compose.yml` |
| Database data unexpectedly gone | `down -v` was used | Re-run `docker compose up` — seed runs automatically |
| Frontend can't reach the API | `VITE_API_URL` misconfigured | Verify `yourwolf-frontend/.env` has `VITE_API_URL=http://localhost:8000` |
