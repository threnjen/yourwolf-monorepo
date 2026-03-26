# Phase 1G: Docker Environment

> Single-command development environment

## Overview

**Goal**: Configure Docker Compose to start all services (PostgreSQL, backend, frontend) with a single command, with hot reload for development.

**Status**: ✅ Complete

---

## Success Criteria

- [x] `docker compose up` starts all services
- [x] Edit Python file → hot reload in backend
- [x] Edit React file → hot reload in frontend
- [x] `docker compose down -v` clears database
- [x] Frontend container runs by default (not placeholder)

---

## Completed Work

1. **Frontend container**: Runs by default with `docker compose up` (no profile restrictions).

2. **Frontend hot reload**: Vite dev server works in container with `CHOKIDAR_USEPOLLING=true` and volume mounts.

---

## Key Files

| File | Purpose |
|------|---------|
| `yourwolf-backend/docker-compose.yml` | Service orchestration |
| `yourwolf-backend/Dockerfile` | Backend container |
| `yourwolf-frontend/Dockerfile` | Frontend container |

---

## Services

### db (PostgreSQL)

| Setting | Value |
|---------|-------|
| Image | `postgres:16` |
| Port | `5432:5432` |
| User | `yourwolf` |
| Password | `yourwolf_dev` |
| Database | `yourwolf` |
| Volume | `postgres_data` |
| Healthcheck | `pg_isready` |

### backend (FastAPI)

| Setting | Value |
|---------|-------|
| Build | `./Dockerfile` |
| Port | `8000:8000` |
| Volume | `.:/app` |
| Depends on | `db` (healthy) |
| Command | Alembic migrate → Seed → Uvicorn |

### frontend (React)

| Setting | Value |
|---------|-------|
| Build | `../yourwolf-frontend/Dockerfile` |
| Port | `3000:3000` |
| Volume | `../yourwolf-frontend:/app` |
| Depends on | `backend` |
| Command | `npm run dev -- --host 0.0.0.0` |

---

## Commands

### Start All Services

```bash
docker compose up --build
```

### Start in Background

```bash
docker compose up -d
```

### View Logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Stop Services

```bash
docker compose down
```

### Reset Database

```bash
docker compose down -v
docker compose up
```

### Connect to Database

```bash
docker compose exec db psql -U yourwolf -d yourwolf
```

### Run Backend Tests

```bash
docker compose exec backend pytest -v
```

---

## QA Checklist

### Container Startup

```bash
docker compose up --build
```

- [x] All containers build without errors
- [x] PostgreSQL shows "healthy"
- [x] Backend starts after DB is healthy
- [x] Backend logs show "Uvicorn running on http://0.0.0.0:8000"
- [ ] Frontend starts and shows "Local: http://localhost:3000"

### Container Health

```bash
docker compose ps
```

- [x] All containers show "Up" status
- [x] No containers in "Restarting" loop

### Hot Reload

- [x] Edit `app/routers/health.py` → backend reloads
- [ ] Edit `src/App.tsx` → frontend reloads

### Volume Persistence

- [x] Stop and start containers → data persists
- [x] `docker compose down -v` → database cleared

### Database Access

```bash
docker compose exec db psql -U yourwolf -d yourwolf -c '\dt'
```

- [x] Shows all expected tables
- [x] `SELECT COUNT(*) FROM roles;` returns 30

### Seeding

- [x] Seed runs on container startup
- [x] Seed is idempotent (no duplicates on restart)

---

## Required Changes

### docker-compose.yml

Remove the `profiles` block from frontend service:

```yaml
frontend:
  build:
    context: ../yourwolf-frontend
    dockerfile: Dockerfile
  container_name: yourwolf-frontend
  # Remove: profiles: ["frontend"]
  ports:
    - "3000:3000"
  volumes:
    - ../yourwolf-frontend:/app
    - /app/node_modules
  depends_on:
    - backend
  command: npm run dev -- --host 0.0.0.0
```

---

*Status: Needs work on frontend container integration*
