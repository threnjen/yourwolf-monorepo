# Codebase Context

> Dense reference for AI agents. Updated: April 2026. Current phase: 04 (planned).

## Project

- Monorepo: `yourwolf-backend/` (Python 3.14, FastAPI) + `yourwolf-frontend/` (React 18, TS, Vite) + `docs/`
- One Night Ultimate Werewolf game facilitator — offline-first, custom roles, ability composition
- Docker Compose orchestrates dev stack: PostgreSQL 16, backend (:8000), frontend (:3000)
- Docker Compose lives in `yourwolf-backend/docker-compose.yml`, references `../yourwolf-frontend`

## Backend Structure

```
yourwolf-backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── config.py            # Pydantic Settings (DATABASE_URL, ENVIRONMENT, CORS_ORIGINS)
│   ├── database.py          # SQLAlchemy engine, SessionLocal, Base, get_db()
│   ├── models/              # ORM models (see Models below)
│   ├── routers/             # HTTP endpoints: roles, abilities, games, health
│   ├── schemas/             # Pydantic request/response models
│   ├── services/            # Business logic (see Services below)
│   └── seed/                # Idempotent seed loader (__main__.py entry)
├── alembic/                 # Migrations (env.py, versions/)
├── tests/                   # Pytest suite, SQLite in-memory via conftest.py
├── docker-compose.yml       # PostgreSQL + backend + frontend
├── Dockerfile               # Backend container
└── pyproject.toml           # black, isort, mypy, pytest config
```

## Backend Models

- `Role` — name, description, team (village/werewolf/vampire/alien/neutral), wake_order, wake_target, visibility (private/public/official), votes, is_locked
- `Ability` — 15 atomic primitives: view_card, swap_card, take_card, view_awake, thumbs_up, explicit_no_view, rotate_all, touch, flip_card, copy_role, change_to_team, perform_as, perform_immediately, stop, random_num_players
- `AbilityStep` — role_id + ability_id + order + modifier (none/and/or/if) + is_required + parameters + condition_type/params
- `GameSession` — player_count, center_card_count, discussion_timer_seconds, phase (setup/night/discussion/voting/resolution/complete), wake_order_sequence (JSON list of UUID strings)
- `GameRole` — game_session_id + role_id + position + is_center + is_flipped + current_team
- `RoleDependency` — role_id + required_role_id + dependency_type (requires/recommends)
- `WinCondition` — role_id + condition_type + condition_params + is_primary + overrides_team
- `User` — exists but unused until Phase 09

## Backend Services

- `ScriptService` (~540 lines) — `generate_night_script(game)` → `NightScript`, `preview_role_script(data)` → `NarratorPreviewResponse`. Filters wake_order > 0, sorts by wake_order (custom sequence overrides), generates per-role actions via `_generate_role_script()`. 15 ability-type instruction templates via `_generate_step_instruction()`. Wake instructions via `_get_wake_instruction()` — 5 branches on `wake_target` pattern.
- `GameService` — create game (validate card counts, dependencies, wake sequence), start (shuffle, assign positions), advance phase (PHASE_ORDER list), get/list/delete.
- `RoleService` — CRUD, validation, duplicate name check, team constraints, dependency management.
- `AbilityService` — list/get abilities.

## Backend API Routes

- `GET /api/v1/roles` — list roles (filterable by team, visibility)
- `POST /api/v1/roles` — create role
- `POST /api/v1/roles/preview-script` — narrator preview for draft role
- `POST /api/v1/roles/{id}/validate` — validate a role draft
- `GET /api/v1/abilities` — list all 15 ability primitives
- `POST /api/v1/games` — create game session
- `POST /api/v1/games/{id}/start` — start game (shuffles roles, transitions to night)
- `POST /api/v1/games/{id}/advance` — advance to next phase
- `GET /api/v1/games/{id}/script` — get night script for a game
- `GET /health` — healthcheck

## Backend Testing

- Framework: pytest, in `tests/` dir
- `conftest.py` sets `DATABASE_URL=sqlite:///:memory:` and `ENVIRONMENT=test` at module level BEFORE importing app modules
- In-memory SQLite with `StaticPool`, fresh schema per test function
- `_ensure_abilities()` helper provisions abilities in test DB
- Coverage: `--cov=app --cov-fail-under=80`
- Key test files: `test_script_service.py` (~1270 lines), `test_game_service.py`, `test_roles.py`, `test_role_validation.py`

## Frontend Structure

```
yourwolf-frontend/
├── src/
│   ├── main.tsx             # ReactDOM.createRoot entry
│   ├── App.tsx              # Layout wrapper + AppRoutes
│   ├── routes.tsx           # React Router v6 route definitions
│   ├── api/                 # Axios clients
│   │   ├── client.ts        # Axios instance (baseURL: VITE_API_URL/api/v1)
│   │   ├── games.ts         # gamesApi: create, list, getById, start, advancePhase, getNightScript, delete
│   │   ├── roles.ts         # rolesApi: list, getById, create, validate, previewScript, checkName
│   │   └── abilities.ts     # abilitiesApi: list
│   ├── hooks/
│   │   ├── useFetch.ts      # Generic fetch hook (callers MUST wrap fetcher in useCallback)
│   │   ├── useGame.ts       # useGame(gameId), useNightScript(gameId, enabled)
│   │   ├── useGameSetup.ts  # Role selection, card count validation, navigate to wake order
│   │   ├── useRoles.ts      # Role list with filtering
│   │   ├── useAbilities.ts  # Abilities list
│   │   └── useDrafts.ts     # Local draft storage for role builder
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Roles.tsx
│   │   ├── RoleBuilder.tsx          # Wizard-based role creation, live validation + preview
│   │   ├── GameSetup.tsx            # Role selection grid, player/center count config
│   │   ├── WakeOrderResolution.tsx  # Drag-to-reorder (@dnd-kit), calls gamesApi.create()
│   │   └── GameFacilitator.tsx      # Phase-based game runner, sub-components per phase
│   ├── components/
│   │   ├── Layout.tsx, Header.tsx, Sidebar.tsx
│   │   ├── ScriptReader.tsx         # Step-through night script with progress bar
│   │   ├── Timer.tsx                # Countdown timer for discussion phase
│   │   ├── RoleCard.tsx, ErrorBanner.tsx
│   │   └── RoleBuilder/            # Wizard.tsx, NarratorPreview.tsx, steps/
│   ├── types/
│   │   ├── game.ts          # GameSession, GamePhase, NarratorAction, NightScript, GameSessionCreate
│   │   └── role.ts          # Role, AbilityStep, StepModifier, Team, Visibility, RoleDraft, NarratorPreviewAction/Response
│   ├── styles/
│   │   ├── theme.ts         # Dark theme object (colors, spacing, borderRadius, shadows)
│   │   └── shared.ts        # Reusable style functions
│   └── utils/
│       └── roleSort.ts      # Role sorting utility
├── vite.config.ts           # Vite + React plugin, test config, @ alias
├── package.json
└── tsconfig.json
```

## Frontend Key Patterns

- Styling: inline styles with centralized `theme` object, no CSS-in-JS library
- State: React useState/useCallback hooks, no global state library
- API calls: Axios with typed wrappers, error interceptor logs in dev
- Testing: Vitest + jsdom + @testing-library/react, Axios mocked globally in `test/setup.ts`
- Named exports only (no `export default` — enforced since Phase 2.5)
- `useFetch` generic hook: wraps fetcher in loading/error/data/refetch pattern
- Coverage threshold: 80% lines/branches/functions/statements

## Frontend Routes

| Path | Page Component | Key Dependencies |
|------|---------------|------------------|
| `/` | Home | — |
| `/roles` | Roles | useRoles |
| `/roles/new` | RoleBuilderPage | rolesApi.validate, rolesApi.previewScript, useAbilities, useDrafts |
| `/games/new` | GameSetupPage | useGameSetup, useRoles |
| `/games/new/wake-order` | WakeOrderResolutionPage | @dnd-kit, gamesApi.create |
| `/games/:gameId` | GameFacilitatorPage | useGame, useNightScript, gamesApi.start/advancePhase |

## Seed Data

- 15 ability primitives seeded via `app/seed/abilities.py`
- 30 base roles seeded via `app/seed/roles.py` (with ability steps, dependencies, win conditions)
- Seed is idempotent — safe to run repeatedly
- Auto-runs on Docker startup: `alembic upgrade head && python -m app.seed && uvicorn ...`

## Environment Variables

| Variable | Service | Default | Purpose |
|----------|---------|---------|---------|
| `DATABASE_URL` | Backend | `postgresql://yourwolf:yourwolf_dev@db:5432/yourwolf` | DB connection |
| `ENVIRONMENT` | Backend | `development` | App mode (development/test/staging/production) |
| `CORS_ORIGINS` | Backend | `http://localhost:3000,http://127.0.0.1:3000` | Allowed origins |
| `VITE_API_URL` | Frontend | `http://localhost:8000` | Backend URL |

## Current Status

- Phases 01–3.6 complete (foundation, game facilitation, role builder, narrator preview fixes, wake order resolution)
- Phase 04 (Client-Side Game Engine) is next — port ScriptService + GameService to TypeScript `src/engine/`, replace 6 API calls with local engine
- `src/engine/` does not exist yet; `dev/` folder is empty
- After Phase 04: local SQLite (05), Tauri desktop (06), TTS narration (07), mobile (08), then cloud features (09–13)

## Do Not

- Do NOT add `export default` — project uses named exports exclusively
- Do NOT import from `@` alias in test files — use relative paths
- Do NOT use CSS modules or styled-components — project uses inline styles with `theme` object
- Do NOT add React context or global state stores without explicit approval — hooks manage local state
- Do NOT modify the Python backend for Phase 04 work — it stays as-is for future cloud use
- Do NOT add DOM/Node/React dependencies to `src/engine/` (Phase 04) — must be pure TypeScript
- Do NOT skip `_ensure_abilities()` in backend tests that need ability data — tests use fresh SQLite per function
- Do NOT hardcode `localhost` URLs — use `VITE_API_URL` env var via `import.meta.env`
- Do NOT forget `useCallback` around fetcher functions passed to `useFetch` — causes infinite re-render loops
