# Phase 05a Discovery Context

Phase-scoped context gathered during refinement on 2026-09-16. Read by Phase - Execute. Project-wide context lives in `docs/phases/DISCOVERY_CONTEXT.md`.

## Decisions the user made

1. **Role save moves to the local store in this phase, not 05b.** The user asked for the robust choice over a throwaway one. A write-through to the local store after a server save was rejected because it produces two ids for one role and is deleted a phase later. The local save is the code 05b would have written, so 05b narrows to porting validation and name check and deleting the HTTP client.
2. **A local case-insensitive name check runs before every save.** The server name check cannot see local custom roles. The local check stays after 05b removes the server call.

## Facts discovered in the code

- `useRoles` is read by `src/pages/RolesPage.tsx` (with a visibility filter) and `src/pages/GameSetup.tsx`. `useAbilities` is read by `src/components/RoleBuilder/steps/AbilitiesStep.tsx`.
- `src/App.tsx` renders `Layout` around `AppRoutes`. `src/App.test.tsx` and `src/routes.test.tsx` mount it. The loading gate goes between them.
- `src/hooks/useFetch.ts` requires a memoized fetcher and is reusable for repository-backed hooks.
- The existing pure-layer ESLint rule for `src/engine` and `src/domain` bans `**/types` as well as React and UI layers. `src/data/` must declare its own record types.
- The backend seeder defaults `default_count`, `min_count`, `max_count` to 1 and `is_primary_team_role` to false when the seed omits them (`yourwolf-backend/app/seed/roles.py`). Seed steps carry no `ability_name` and no id. Seed win conditions carry no id. `abilities.py` records carry no id, `is_active`, or timestamp. The transport types require all of these.
- `RoleDraft` in `src/domain/roleDraft.ts` carries no dependencies or counts. The draft-to-record mapping supplies defaults.
- The shared Axios guard in `src/test/setup.ts` mocks every Axios method and rejects by URL.

## Final-check findings applied

A cold-start review returned four findings: partial record defaults, the `types` import ban contradiction, duplicate custom names slipping past the server check, and reseed leaving stale official records. All four are folded into the phase document.

## No external research was performed in this session.
