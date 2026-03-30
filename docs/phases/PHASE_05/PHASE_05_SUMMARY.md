# Phase 5: Local Data Layer

**Status**: Planned
**Depends on**: Phase 04 (Client-Side Game Engine)
**Estimated complexity**: Medium
**Cross-references**: Python models in `yourwolf-backend/app/models/`, frontend types in `yourwolf-frontend/src/types/`

## Objective

Add SQLite-based local storage so that roles, custom role drafts, game sessions, and user preferences persist on-device without any server or internet connection.

## Scope

### In Scope
- SQLite database schema mirroring the core PostgreSQL tables: `roles`, `abilities`, `ability_steps`, `win_conditions`, `game_sessions`, `game_roles`
- Data access layer with a repository pattern: abstracts storage behind interfaces so the app doesn't care whether data comes from SQLite or a remote API
- Bundled seed data: all 30 official roles pre-loaded into SQLite on first launch
- Custom role persistence: roles created in the Role Builder are saved to local SQLite
- Draft role persistence: in-progress role drafts survive app restarts (currently `useDrafts.ts` uses browser localStorage)
- Game session persistence: completed games stored locally for history
- User preferences table: discussion timer default, theme, last-used role set
- Migration strategy for local SQLite schema changes across app updates
- sql.js (SQLite compiled to WebAssembly) for browser context; Tauri SQL plugin for native context (Phase 06 wires the native path)
- Unit and integration tests for the data access layer

### Out of Scope
- Cloud sync (Phase 09 — Authentication & Users adds local→cloud sync)
- Tauri native packaging (Phase 06 — this phase works in the browser via sql.js)
- Full-text search on roles (Phase 10 — Community Features)
- Data export/import
- Encryption of local database

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | SQLite Schema | Local database schema for roles, abilities, steps, win conditions, games, preferences | Schema definitions |
| 2 | Repository Interfaces | TypeScript interfaces for data access (RoleRepository, GameRepository, etc.) | Type definitions |
| 3 | SQLite Repository Implementation | Concrete implementations using sql.js for browser context | Data access layer |
| 4 | Seed Data Loader | Bundle and load all 30 official roles into SQLite on first launch | Initialization logic |
| 5 | Draft Migration | Migrate `useDrafts.ts` localStorage drafts to SQLite storage | Hook update |
| 6 | Preferences Store | User preferences (timer defaults, theme, last role set) in SQLite | Key-value store |
| 7 | Schema Migration System | Versioned migrations for local SQLite updates across app versions | Migration runner |

## Technical Context

- Existing Python models define the canonical schema: `app/models/role.py`, `app/models/ability.py`, `app/models/ability_step.py`, `app/models/win_condition.py`, `app/models/game_session.py`, `app/models/game_role.py`
- Existing frontend types: `src/types/role.ts` (Role, AbilityStep, WinCondition), `src/types/game.ts` (GameSession, GameRole)
- Existing draft hook: `src/hooks/useDrafts.ts` — stores role drafts in `localStorage`; needs migration to SQLite
- Existing API client: `src/api/client.ts`, `src/api/roles.ts`, `src/api/games.ts` — these currently fetch from the backend; the repository layer will replace these for offline mode
- Existing hooks: `src/hooks/useRoles.ts`, `src/hooks/useGame.ts` — will be updated to use repositories instead of direct API calls
- sql.js: SQLite compiled to Wasm, runs in browser; no native dependencies needed for this phase
- The repository pattern enables a clean swap: `SqliteRoleRepository` (offline) vs. `ApiRoleRepository` (cloud, Phase 09+) behind the same interface
- Seed data source: `yourwolf-backend/app/seed/` contains the JSON/Python seed definitions for all 30 roles

## Dependencies & Risks

- **Dependency**: Phase 04 game engine must be complete — the data layer feeds data into the engine
- **Dependency**: Seed data must be extracted from Python format into a portable format (JSON) that can be bundled with the frontend
- **Risk**: sql.js Wasm bundle size (~1MB) — acceptable for a desktop/mobile app; verify it doesn't impact initial load
- **Risk**: SQLite schema drift from PostgreSQL — mitigate by treating the TypeScript types as the source of truth for local schema and mapping to PostgreSQL separately for cloud
- **Risk**: Migration system complexity — keep it simple (sequential numbered scripts, version table); don't over-engineer
- **Mitigation**: Test with realistic data volumes (30 seed roles + 50 custom roles + 100 game sessions) to verify query performance

## Success Criteria

- [ ] SQLite database is created and populated with 30 seed roles on first launch
- [ ] Custom roles created in the Role Builder persist across page reloads and app restarts
- [ ] In-progress role drafts are stored in SQLite (not localStorage)
- [ ] Game sessions are saved locally and retrievable
- [ ] User preferences (timer default, theme) persist
- [ ] Repository interfaces allow swapping between SQLite and API implementations
- [ ] Schema migrations run automatically on app update
- [ ] All data access goes through repository interfaces, not direct SQL or API calls

## QA Considerations

- Test data persistence across browser refresh and tab close
- Verify seed data integrity: all 30 roles load with correct abilities, steps, and win conditions
- Test the "first launch" flow: empty database → seed → ready
- Verify that the Role Builder, Game Setup, and Facilitator UI all work with local data (no backend running)

## Notes for Feature - Decomposer

Natural decomposition: SQLite schema + migration system → repository interfaces → SQLite implementation → seed data loader → draft migration → preferences store → hook integration. The repository interfaces should be defined first since they determine the contract. Seed data extraction (Python → JSON) is a standalone task. Hook integration touches existing code across multiple files — do it last.

Suggested decomposition: (1) role publishing workflow + visibility filtering, (2) voting system (model + API + frontend controls), (3) role sets CRUD (backend), (4) role set builder UI, (5) search & filter (backend query + frontend UI), (6) browse page with feeds, (7) role detail page. Features can be roughly parallelized as backend-first (1, 2, 3, 5 backend) then frontend (4, 5 UI, 6, 7). The browse page (6) depends on search/filter (5) and voting (2).
