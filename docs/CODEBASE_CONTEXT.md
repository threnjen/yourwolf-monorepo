# Codebase Context

> Dense reference for AI agents. Current phase: 04a complete; 04b planned.

## Project

- Monorepo: `yourwolf-backend/` (Python 3.14, FastAPI) + `yourwolf-frontend/` (React 18, TS, Vite) + `docs/`
- One Night Ultimate Werewolf game facilitator — offline-first, custom roles, ability composition
- Docker Compose orchestrates dev stack: PostgreSQL 16, backend (:8000), frontend (:3000)
- Docker Compose lives in `yourwolf-backend/docker-compose.yml`, references `../yourwolf-frontend`

## Backend Structure

```
yourwolf-backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router registration, domain exception handlers
│   ├── config.py            # Pydantic Settings + @cache get_settings()
│   ├── database.py          # @cache get_engine(), get_session_factory(), get_db(); re-exports Base
│   ├── exceptions.py        # Domain exception vocabulary (no framework imports)
│   ├── models/              # ORM models (see Models below); base.py holds Base
│   ├── routers/             # HTTP endpoints: roles, abilities, games, health
│   ├── schemas/             # Pydantic request/response models
│   ├── services/            # Business logic (see Services below)
│   │   └── narration/       # Pure script generation (no DB/ORM)
│   └── seed/                # Idempotent seed loader (__main__.py entry)
│       └── data/roles.json  # Role definitions (data, not code)
├── alembic/                 # Migrations (env.py, versions/)
├── tests/                   # Pytest suite, SQLite in-memory via conftest.py
├── docker-compose.yml       # PostgreSQL + backend + frontend
├── Dockerfile               # Backend container
└── pyproject.toml           # black, isort, mypy, pytest config
```

## Backend Config & Database Access

- No module-level `settings`, `engine`, or `SessionLocal` — all removed. Construction is lazy so importing a module never requires `DATABASE_URL` or opens a connection.
- `get_settings()` (`app/config.py`), `get_engine()` / `get_session_factory()` (`app/database.py`) — all `@functools.cache`. Call them; do not cache the result at import time.
- `Base` is defined in `app/models/base.py` and re-exported from `app.database`. Both import paths work.
- Changing env vars at runtime (tests) requires `get_settings.cache_clear()`.

## Backend Error Handling

- `app/exceptions.py` defines the domain vocabulary; services raise these instead of `ValueError`/`PermissionError`.
- `app/main.py` maps them to status codes via `register_exception_handlers()`. Routers do not inspect message prose.

| Exception | Status |
|-----------|--------|
| `NotFoundError` | 404 |
| `DomainValidationError` | 400 |
| `LockedError` | 403 |

- Unregistered exceptions fall through to the framework 500 path.
- Pydantic schema violations (field bounds) return 422 — not routed through `app/exceptions.py`.

## Backend Models

- `Role` — name, description, team (village/werewolf/vampire/alien/neutral), wake_order, wake_target, visibility (private/public/official), votes, is_locked, vote_score, use_count, default_count/min_count/max_count (card counts, drive game-setup validation), is_primary_team_role
- `Ability` — 15 atomic primitives: view_card, swap_card, take_card, view_awake, thumbs_up, explicit_no_view, rotate_all, touch, flip_card, copy_role, change_to_team, perform_as, perform_immediately, stop, random_num_players
- `AbilityStep` — role_id + ability_id + order + modifier (none/and/or/if) + is_required + parameters + condition_type/params
- `GameSession` — player_count, center_card_count, discussion_timer_seconds, phase (setup/night/discussion/voting/resolution/complete), wake_order_sequence (JSON list of UUID strings)
- `GameRole` — game_session_id + role_id + position + is_center + is_flipped + current_team
- `RoleDependency` — role_id + required_role_id + dependency_type (requires/recommends)
- `WinCondition` — role_id + condition_type + condition_params + is_primary + overrides_team
- `User` — exists but unused until Phase 09

## Backend Services

- `ScriptService` (`script_service.py`, ~195 lines) — DB access and adaptation ONLY. `generate_night_script(game)` → `NightScript`, `preview_role_script(data)` → `NarratorPreviewResponse`. Filters wake_order > 0, loads ORM, adapts to narration inputs via `_role_to_input()` / `_preview_request_to_input()`, delegates all copy generation to `app/services/narration/`.
- `GameService` — start (shuffle, assign positions), advance phase (`PHASE_ORDER` class attr), get/list/delete. Setup validation delegated to `game_setup_validation`.
- `RoleService` — CRUD and persistence. Validation delegated to `role_validation`.
- `AbilityService` — list/get abilities.

### `app/services/narration/` (pure package)

No DB, ORM, or session access — the reference implementation for the Phase 04 TypeScript port.

- `inputs.py` — `RoleScriptInput`, `AbilityStepInput` frozen dataclasses. The package's ONLY input contract; field names are chosen to transcribe one-for-one into the TS engine.
- `templates.py` — `STEP_DURATIONS`, `build_step_instruction(step)` (15 ability types; returns `None` for unknown), `build_wake_instruction(role)` (branches on `wake_target`), `get_step_duration(step)`.
- `script_builder.py` — `build_role_script()`, `build_night_script_actions()`, `build_preview_actions()`, `total_duration_seconds()`.

### Extracted validators / helpers

- `game_setup_validation.py` — `validate_game_setup(db, data)` → `GameSetupValidation`. Card counts, primary teams, dependencies, wake sequence.
- `role_validation.py` — module-level `validate_role()`, `check_duplicate_name()`, `get_warnings()`.
- `pagination.py` — `paginate(query, page, limit)` → `PageMeta`. Shared by both list endpoints; caller applies its own ordering/eager loads then slices with `PageMeta.offset`.

## Backend API Routes

- `GET /api/v1/roles` — list roles (filter: team, visibility; paginated, limit ≤100)
- `GET /api/v1/roles/official` — official roles only
- `GET /api/v1/roles/check-name` — name availability (422 on empty/whitespace name)
- `GET /api/v1/roles/{id}` — role detail (404 if absent)
- `POST /api/v1/roles` — create role. Enforces the FULL `validate_role` rule set (requires ≥1 win condition); violations → 400
- `PUT /api/v1/roles/{id}` — update (403 if locked)
- `DELETE /api/v1/roles/{id}` — delete (403 if locked or official)
- `POST /api/v1/roles/validate` — dry-run validate a draft; returns `{is_valid, errors, warnings}`. NOT `/{id}/validate`
- `POST /api/v1/roles/preview-script` — narrator preview for draft role
- `GET /api/v1/abilities` — list all 15 ability primitives
- `POST /api/v1/games` — create game session (400 on domain rule violation)
- `GET /api/v1/games` — list sessions (filter: phase; paginated)
- `POST /api/v1/games/{id}/start` — start game (shuffles roles, transitions to night)
- `POST /api/v1/games/{id}/advance` — advance to next phase (400 if already complete)
- `GET /api/v1/games/{id}/script` — get night script for a game
- `DELETE /api/v1/games/{id}` — delete session
- `GET /health` — healthcheck

### Validation status codes

- Role name bounds are `min_length=2, max_length=50` on the Pydantic schema, so violations return **422** (not 400) — including via `POST /roles/validate`.
- Invalid ability-step `modifier` returns **422** (enum coercion).
- Domain rule violations (duplicate name, missing win condition, bad dependency) return **400** via `DomainValidationError`.

## Backend Testing

- Framework: pytest, in `tests/` dir
- `conftest.py` sets `DATABASE_URL=sqlite:///:memory:` and `ENVIRONMENT=test` in a `pytest_configure()` hook, then calls `get_settings.cache_clear()`. Import order no longer matters — settings resolve lazily. Values are assigned unconditionally so a run never picks up an ambient `DATABASE_URL`.
- Tests needing a different URL: `monkeypatch.setenv(...)` + `get_settings.cache_clear()`.
- In-memory SQLite with `StaticPool`, fresh schema per test function
- `_ensure_abilities()` helper provisions abilities in test DB
- Coverage: `--cov=app --cov-fail-under=80`
- Key test files: `test_script_service.py`, `test_narration_templates.py`, `test_game_service.py`, `test_roles.py`, `test_role_validation.py`, `test_database.py`

## Frontend Structure

```
yourwolf-frontend/
├── src/
│   ├── main.tsx             # ReactDOM.createRoot entry
│   ├── App.tsx              # Layout wrapper + AppRoutes
│   ├── routes.tsx           # React Router v6 route definitions
│   ├── api/                 # Axios clients
│   │   ├── client.ts        # Axios instance (baseURL: VITE_API_URL/api/v1)
│   │   ├── games.ts         # gamesApi: create, getById, start, advancePhase, getNightScript, delete
│   │   ├── roles.ts         # rolesApi: list, create, validate, previewScript, checkName
│   │   ├── errors.ts        # Reads FastAPI 422 detail arrays and domain-error string details
│   │   └── abilities.ts     # abilitiesApi: list
│   ├── hooks/
│   │   ├── useFetch.ts      # Generic fetch hook (callers MUST wrap fetcher in useCallback)
│   │   ├── useGame.ts       # useGame(gameId), useNightScript(gameId, enabled)
│   │   ├── useGameSetup.ts  # Role selection, card count validation, navigate to wake order
│   │   ├── useRoles.ts      # Role list with filtering
│   │   ├── useAbilities.ts  # Abilities list
│   │   └── useNameCheck.ts  # Debounced, race-safe role-name availability check
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── RolesPage.tsx
│   │   ├── RoleBuilder.tsx          # Wizard-based role creation, live validation + preview
│   │   ├── GameSetup.tsx            # Role selection grid, player/center count config
│   │   ├── WakeOrderResolution.tsx  # Drag-to-reorder (@dnd-kit), calls gamesApi.create()
│   │   └── GameFacilitator.tsx      # Phase-based game runner, sub-components per phase
│   ├── components/
│   │   ├── Layout.tsx, Header.tsx, Sidebar.tsx
│   │   ├── ScriptReader.tsx         # Step-through night script with progress bar
│   │   ├── Timer.tsx                # Countdown timer for discussion phase
│   │   ├── RoleCard.tsx, ErrorBanner.tsx
│   │   └── RoleBuilder/            # Wizard.tsx, NarratorPreview.tsx
│   │       └── steps/              # BasicInfoStep, WinConditionsStep, ReviewStep,
│   │                               # AbilitiesStep (container) + AbilityPalette,
│   │                               # StepList, StepParameterInputs
│   ├── domain/              # Pure TypeScript game model — no React, no transport DTOs
│   │   ├── teams.ts         # TEAMS, Team
│   │   ├── constants.ts     # ABILITY_CATEGORIES, STRING_TARGET_OPTIONS, MODIFIERS, MODIFIER_LABELS
│   │   ├── roleDraft.ts     # RoleDraft, AbilityStepDraft, WinConditionDraft, StepModifier, createEmptyDraft
│   │   ├── roleSelection.ts # buildRoleMap, countSelectedCards, toggleRoleSelection,
│   │   │                    # adjustRoleCount, removeRoleWithCascade
│   │   ├── abilitySteps.ts  # append/remove/move/renumber steps, parameter coercion
│   │   └── wakeOrder.ts     # collectWakingRoles, buildGroupOrders, flattenWakeOrder,
│   │                        # expandRoleIds, shuffleArray(rng injectable)
│   ├── engine/              # Pure TypeScript engine; no application callers until Phase 04b
│   │   ├── types.ts         # Immutable engine input/output contracts
│   │   ├── templates.ts     # 15 ability templates, wake instructions, durations
│   │   ├── narration.ts     # Script/preview builders and deterministic wake sorting
│   │   ├── gameSetupValidation.ts # Setup rules and dependency warnings
│   │   └── gameSession.ts   # Immutable create/start/advance phase state machine
│   ├── types/
│   │   ├── game.ts          # GameSession, GamePhase, NarratorAction, NightScript, GameSessionCreate
│   │   ├── transport.ts     # Wire DTOs: Role, AbilityStep, Visibility, ValidationResult, NameCheckResult, NarratorPreviewAction/Response
│   │   └── routerState.ts   # Typed router-state contracts
│   ├── styles/
│   │   ├── theme.ts         # Dark theme object (colors, spacing, borderRadius, shadows)
│   │   └── shared.ts        # Reusable style functions
│   └── utils/
│       ├── format.ts        # String formatting helpers
│       └── roleSort.ts      # Role sorting utility
├── eslint.config.js         # Import-boundary rules + react-hooks plugin
├── vite.config.ts           # Vite + React plugin, test config, @ alias
├── package.json
└── tsconfig.json
```

## Frontend Import Boundaries (ESLint-enforced)

`eslint.config.js` enforces these via `no-restricted-imports`. They fail lint, not just review.

| Layer | Must NOT import |
|-------|-----------------|
| `src/domain/**`, `src/engine/**` | `react` / `react-dom`; `api`, `hooks`, `components`, `pages`, `styles`; `types` (transport DTOs) |
| `src/components/**` | `src/api` — go through a hook in `src/hooks` |

- Dependencies point inward. Transport types may depend on domain types, never the reverse — if the domain needs a shape, declare it in `src/domain`.
- The domain rule uses the `@typescript-eslint` variant with `allowTypeImports: false`, so `import type` is restricted too.
- `react-hooks` plugin (`recommended-latest`) is wired; `exhaustive-deps` is promoted to `error`.

## Client Engine

- `src/engine/` is implemented but has no application callers. Phase 04b owns adapters and replacement of backend API calls.
- `types.ts` defines `EngineRoleInput`, `EngineAbilityStepInput`, `NarratorAction`, and `NarratorPreviewAction`.
- `templates.ts` implements all 15 instruction types, wake-target handling, and duration lookup.
- `narration.ts` exports `sortWakingRoles()`, `buildRoleScript()`, `buildNightScript()`, `buildPreview()`, and `totalDurationSeconds()`.
- Default wake order sorts by `wake_order`, then role name. This deliberately replaces Python's incidental database row ordering for ties.
- Custom wake sequences place named roles first. Unnamed roles retain the deterministic default order.
- `gameSetupValidation.ts` ports setup validation and warning behavior from the backend.
- `gameSession.ts` creates immutable in-memory sessions with an injected ID generator.
- `startGame()` is the only setup-to-night transition. `advancePhase()` rejects setup, unlike the Python backend.
- Narration templates and fixture-covered outputs match Python. Do not claim complete behavioral identity because wake-order ties and setup advancement differ.

## Frontend Key Patterns

- Styling: inline styles with centralized `theme` object, no CSS-in-JS library
- State: React useState/useCallback hooks, no global state library
- API calls: Axios with typed wrappers, error interceptor logs in dev
- Testing: Vitest + jsdom + @testing-library/react, Axios mocked globally in `test/setup.ts`; `src/test/` mirrors the source tree (`api/`, `hooks/`, `domain/`, `components/`, `pages/`, `utils/`)
- Named exports only (no `export default` — enforced since Phase 2.5)
- `useFetch` generic hook: wraps fetcher in loading/error/data/refetch pattern
- Coverage threshold: 80% lines/branches/functions/statements

## Frontend Routes

| Path | Page Component | Key Dependencies |
|------|---------------|------------------|
| `/` | HomePage | — |
| `/roles` | RolesPage | useRoles |
| `/roles/new` | RoleBuilderPage | rolesApi.validate, rolesApi.previewScript, useAbilities, useNameCheck |
| `/games/new` | GameSetupPage | useGameSetup, useRoles |
| `/games/new/wake-order` | WakeOrderResolutionPage | @dnd-kit, gamesApi.create |
| `/games/:gameId` | GameFacilitatorPage | useGame, useNightScript, gamesApi.start/advancePhase |

## Seed Data

- 15 ability primitives seeded via `app/seed/abilities.py` (data still inline as `ABILITIES_DATA`)
- 30 base roles: definitions live in `app/seed/data/roles.json`; `app/seed/roles.py` is the loader+validator that exposes `ROLES_DATA` / `ROLE_DEPENDENCIES_DATA`. Edit the JSON, not the module, to change role data.
- Loader validates required keys and ability types up front and raises `SeedDataError` before any DB work — a bad data file can never produce a partial seed.
- JSON is separate from code so the same file can ship with non-server distributions (Phase 04+).
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

- Phases 01–3.6 are complete.
- Phase 04a is complete. Test health and mutation-tested guards verify coverage, output shape, injected identity, and deep input immutability.
- Phase 04b is planned. It owns transport adapters, six game/preview call-site replacements, refresh behavior, and end-to-end manual QA.
- The live frontend still calls the backend for game creation, phase transitions, night scripts, and narrator previews.
- After Phase 04b: local SQLite (05), Tauri desktop (06), TTS narration (07), mobile (08), then cloud features (09–13).

## Do Not

- Do NOT add `export default` — project uses named exports exclusively
- Do NOT import from `@` alias in test files — use relative paths
- Do NOT use CSS modules or styled-components — project uses inline styles with `theme` object
- Do NOT add React context or global state stores without explicit approval — hooks manage local state
- Do NOT modify the Python backend for Phase 04 work — it stays as-is for future cloud use
- Do NOT add DOM/Node/React dependencies to `src/engine/` (Phase 04) — must be pure TypeScript
- Do NOT import transport DTOs from `src/engine/` — Phase 04b adapters belong outside the engine.
- Do NOT describe the TypeScript engine as fully identical to Python — deterministic wake-order ties and setup-advance rejection are deliberate differences.
- Do NOT skip `_ensure_abilities()` in backend tests that need ability data — tests use fresh SQLite per function
- Do NOT hardcode `localhost` URLs — use `VITE_API_URL` env var via `import.meta.env`
- Do NOT forget `useCallback` around fetcher functions passed to `useFetch` — causes infinite re-render loops
- Do NOT import `settings`, `engine`, or `SessionLocal` from `app.config` / `app.database` — they no longer exist. Use `get_settings()`, `get_engine()`, `get_session_factory()`.
- Do NOT construct `Settings()` directly or bind an engine at import time — it reintroduces the import-order hazard the accessors removed.
- Do NOT raise bare `ValueError` / `PermissionError` from services for client-facing failures — raise from `app/exceptions.py`. Routers no longer parse message prose.
- Do NOT add status-code branching to routers for domain errors — register the mapping in `app/main.py`.
- Do NOT edit role seed data in `app/seed/roles.py` — the definitions are in `app/seed/data/roles.json`.
- Do NOT import React or `src/types` from `src/domain` — ESLint blocks it; the domain owns its own shapes.
- Do NOT put narrator copy in `ScriptService` — templates live in `app/services/narration/templates.py`. `ScriptService` only adapts ORM → `RoleScriptInput`.
- Do NOT add ORM/session imports to `app/services/narration/` — its purity is what makes the Phase 04 port a transcription.
- Do NOT "fix" the `Werewolfs` pluralization in `_thumbs_up_instruction` (`templates.py`) — narrator copy is frozen. `thumbs_up` renders `team.werewolf` as "Werewolfs" while `build_wake_instruction` says "Werewolves"; the inconsistency is the shipped pre-refactor output, pinned at source and in `test_narration_templates.py`. The Phase 04 TS port must reproduce it. A copy fix belongs in its own feature that changes source, pinned test, and port together.
- Do NOT expect 400 for role-name length or bad `modifier` — those are Pydantic bounds and return 422.
