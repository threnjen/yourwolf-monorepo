# Phase 1: Foundation

> **Project scaffolding, data models, Docker environment, and 30 seeded roles**

## Overview

**Goal**: Establish the complete development infrastructure with working backend API, frontend shell, and database seeded with all 30 official roles.

**Duration**: ~3 weeks

**Prerequisites**: None (first phase)

---

## Sub-Phases

| Sub-Phase | Feature | Status |
|-----------|---------|--------|
| [1A](PHASE_1A_CORE_BACKEND.md) | Core Backend Foundation | ✅ Complete |
| [1B](PHASE_1B_ABILITIES_API.md) | Abilities API | ✅ Complete |
| [1C](PHASE_1C_ROLES_READ.md) | Roles API — Read Operations | ✅ Complete |
| [1D](PHASE_1D_ROLES_WRITE.md) | Roles API — Write Operations | ✅ Complete |
| [1E](PHASE_1E_FRONTEND_SHELL.md) | Frontend Shell | ✅ Complete |
| [1F](PHASE_1F_ROLES_DISPLAY.md) | Roles Display | ✅ Complete |
| [1G](PHASE_1G_DOCKER.md) | Docker Environment | ✅ Complete |
| [1H](PHASE_1H_TEST_COVERAGE.md) | Test Coverage & Final QA | ✅ Complete |

**Progress**: 8/8 sub-phases complete

---

## Deliverables

- [x] Docker Compose environment (PostgreSQL, backend)
- [x] Docker Compose with frontend (hot reload enabled)
- [x] FastAPI backend with SQLAlchemy models
- [x] React frontend with routing and dark theme
- [x] Database migrations and seed script
- [x] All 30 official roles queryable via API
- [x] ≥80% test coverage (backend 82%, frontend 100%)

---

## Application URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Database | localhost:5432 |

---

## Quick Start

### Start Services

```bash
cd yourwolf-backend
docker compose up --build
```

### Frontend (separate terminal)

```bash
cd yourwolf-frontend
npm install
npm run dev
```

### Reset Database

```bash
docker compose down -v
docker compose up
```

### Run Tests

```bash
# Backend
docker compose exec backend pytest -v

# Frontend
cd yourwolf-frontend && npm test
```

---

## Repository Structure

### yourwolf-backend

```
yourwolf-backend/
├── docker-compose.yml          # Dev environment
├── Dockerfile                  # Backend container
├── pyproject.toml              # Python config
├── alembic/                    # Database migrations
├── app/
│   ├── main.py                 # FastAPI app
│   ├── config.py               # Environment config
│   ├── database.py             # Database connection
│   ├── models/                 # SQLAlchemy models
│   ├── schemas/                # Pydantic schemas
│   ├── routers/                # API routes
│   ├── services/               # Business logic
│   └── seed/                   # Seed data
└── tests/                      # pytest tests
```

### yourwolf-frontend

```
yourwolf-frontend/
├── Dockerfile                  # Frontend container
├── package.json
├── vite.config.ts
├── src/
│   ├── main.tsx               # React entry
│   ├── App.tsx                # Root component
│   ├── routes.tsx             # Routing
│   ├── api/                   # API client
│   ├── components/            # UI components
│   ├── pages/                 # Route pages
│   ├── hooks/                 # Custom hooks
│   ├── types/                 # TypeScript types
│   └── styles/                # Theme/styles
└── src/test/                  # Vitest tests
```

---

## Completed

All Phase 1 deliverables are complete:

- **Docker Environment**: All services start with `docker compose up --build`, hot reload works for both backend and frontend
- **Test Coverage**: Backend 82.21% (109 tests), Frontend 100% (127 tests)

---

## Acceptance Criteria

Phase 1 is complete when:

1. `docker compose up` starts PostgreSQL and backend
2. Frontend runs via `npm run dev`
3. 30 official roles visible on Roles page
4. All automated tests pass
5. Backend test coverage ≥80%
6. Frontend test coverage ≥80%

---

*Last updated: February 2026*
