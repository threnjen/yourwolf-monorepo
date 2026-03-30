# Phase 1: Foundation

**Status**: Complete
**Depends on**: None
**Estimated complexity**: Large
**Cross-references**: None

## Objective

Establish the complete development infrastructure with a working backend API, frontend shell, Docker environment, and database seeded with all 30 official One Night Ultimate Werewolf roles.

## Scope

### In Scope
- Docker Compose environment (PostgreSQL, backend, frontend with hot reload)
- FastAPI backend with SQLAlchemy models and Alembic migrations
- React + Vite frontend with routing, layout, and dark theme
- Database models for Role, Ability, AbilityStep, WinCondition
- Seed script for all 30 official roles with full ability data
- REST API for roles and abilities (CRUD)
- Frontend role browsing and display
- Backend and frontend test coverage ≥80%

### Out of Scope
- User authentication (Phase 04)
- Game session management (Phase 02)
- Custom role creation (Phase 03)
- Production deployment (Phase 08)

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Core Backend | FastAPI app, SQLAlchemy models, Alembic migrations, health endpoint | Project scaffolding, DB connection |
| 2 | Abilities API | CRUD endpoints for ability types | Ability model, router, service |
| 3 | Roles Read API | GET endpoints for roles with filtering and includes | Role queries, pagination |
| 4 | Roles Write API | POST/PUT/DELETE for roles with validation | Role creation, updates, deletion |
| 5 | Frontend Shell | React + Vite setup with routing, layout, dark theme, sidebar | App skeleton, component library |
| 6 | Roles Display | Frontend pages for browsing and viewing roles | Role cards, role list, role detail |
| 7 | Docker Environment | Docker Compose with PostgreSQL, backend, frontend | Containerization, dev workflow |
| 8 | Test Coverage | ≥80% backend and frontend test coverage | Test infrastructure, fixtures |

## Technical Context

- Backend entry point: `yourwolf-backend/app/main.py`
- Models: `app/models/role.py`, `app/models/ability.py`, `app/models/ability_step.py`, `app/models/win_condition.py`
- Routers: `app/routers/roles.py`, `app/routers/abilities.py`
- Seed data: `app/seed/`
- Frontend entry: `yourwolf-frontend/src/main.tsx`
- Pages: `src/pages/Home.tsx`, `src/pages/Roles.tsx`
- Components: `src/components/RoleCard.tsx`, `src/components/Layout.tsx`, `src/components/Header.tsx`, `src/components/Sidebar.tsx`

## Dependencies & Risks

- **Dependency**: None — this is the first phase
- **Risk**: Data model changes later could require migrations; mitigated by using Alembic from the start

## Success Criteria

- [x] Docker Compose starts PostgreSQL, backend, and frontend
- [x] API returns list of 30 seeded roles at `GET /api/roles/`
- [x] Frontend displays roles with dark theme
- [x] Backend test coverage ≥80%
- [x] Frontend test coverage ≥80%

## QA Considerations

- Frontend UI: role browsing, layout, theming all require visual verification
- API contract: seed data shape must match frontend expectations

## Notes for Feature - Decomposer

Phase was decomposed into 8 sub-phases (1A–1H) in dependency order: core backend → abilities API → roles read → roles write → frontend shell → roles display → Docker → test coverage. Sub-phase docs are in this folder.
