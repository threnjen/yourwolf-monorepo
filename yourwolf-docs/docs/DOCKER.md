# Docker Reference

> Quick-reference for running the YourWolf dev stack and tests

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Both repositories cloned as siblings on disk:
  ```
  yourwolf-backend/   ← docker-compose.yml lives here; run all compose commands from here
  yourwolf-frontend/
  ```

All `docker compose` commands must be run from the `yourwolf-backend/` directory.

---

## Service URLs

| Service  | URL                              | Notes                   |
|----------|----------------------------------|-------------------------|
| Frontend | http://localhost:3000            | React / Vite dev server |
| Backend  | http://localhost:8000            | FastAPI                 |
| API Docs | http://localhost:8000/docs       | Swagger UI              |
| API Docs | http://localhost:8000/redoc      | ReDoc                   |
| Database | `localhost:5432`                 | PostgreSQL 16           |

---

## Starting the Stack

### First run or after code changes

```bash
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

On startup, the backend automatically:
1. Runs `alembic upgrade head` (applies migrations)
2. Runs the seed script (idempotent — safe to run repeatedly)
3. Starts Uvicorn with hot reload

---

## Stopping

### Stop containers (keep database data)

```bash
docker compose down
```

### Stop and wipe the database

```bash
docker compose down -v
```

> Use `down -v` when you want a clean slate — all PostgreSQL data is deleted.

---

## Logs

```bash
# Follow all services
docker compose logs -f

# Follow a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

---

## Running Tests

Tests require the backend container to be running (they connect to the PostgreSQL `db` service).

```bash
# Run the full test suite
docker compose exec backend pytest

# Verbose output
docker compose exec backend pytest -v

# Stop on first failure
docker compose exec backend pytest -x
```

The test suite is configured with `--cov=app --cov-report=term-missing --cov-fail-under=80` by default (see `pyproject.toml`).

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

## Container Status

```bash
docker compose ps
```

All three containers (`yourwolf-db`, `yourwolf-backend`, `yourwolf-frontend`) should show status `Up`.

---

## Environment Configuration

The `docker-compose.yml` injects these environment variables into the backend automatically:

| Variable       | Value (Docker)                                        |
|----------------|-------------------------------------------------------|
| `DATABASE_URL` | `postgresql://yourwolf:yourwolf_dev@db:5432/yourwolf` |
| `ENVIRONMENT`  | `development`                                         |

If running the backend **outside of Docker** (e.g. `uvicorn` directly), set `DATABASE_URL` to point at `localhost:5432` instead of `db:5432`. Copy `.env.example` to `.env` and update accordingly.

---

## Common Issues

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Backend exits immediately | DB not ready | Wait — backend waits for `db` healthcheck; just retry |
| `relation does not exist` errors | Migrations not applied | `docker compose exec backend alembic upgrade head` |
| Frontend shows stale code | Vite cache issue | `docker compose down && docker compose up --build` |
| Port already in use | Another process on 8000/3000/5432 | Stop the conflicting process or change ports in `docker-compose.yml` |
| DB data unexpectedly gone | `down -v` was used | Re-run `docker compose up` — seed runs automatically |
