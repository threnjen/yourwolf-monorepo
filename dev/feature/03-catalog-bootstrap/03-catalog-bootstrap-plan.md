# 03 Catalog Bootstrap

## A. Requirements & Traceability

### Acceptance Criteria

- **AC1:** A React context provider exposes the repositories created by Feature 02 without leaking storage details into pages or hooks.
- **AC2:** `yourwolf-frontend/src/App.tsx` runs bootstrap and gates `AppRoutes` inside `Layout`. Navigation chrome remains visible during loading and database-open failures show a visible message instead of rendering catalog pages.
- **AC3:** A shared test render helper creates a unique fake IndexedDB database, mounts the provider, runs bootstrap, and awaits completion before returning.
- **AC4:** `useRoles` keeps using `useFetch` with a memoized repository fetcher, preserves the visibility-array behavior used by `RolesPage`, and preserves the unfiltered catalog used by `GameSetup`.
- **AC5:** `useAbilities` keeps using `useFetch` with a memoized repository fetcher and supplies all 15 abilities to `AbilitiesStep` offline.
- **AC6:** `WakeOrderResolutionPage` reads each distinct selected role through `RoleRepository`, passes the full local record as both existing adapter inputs, and preserves adapter signatures and null-handling behavior.
- **AC7:** `yourwolf-frontend/src/test/setup.ts` rejects `GET /roles`, `GET /roles/{id}`, and `GET /abilities`, while preserving the existing `/games` and `/roles/preview-script` guards.
- **AC8:** Updated app, route, hook, page, adapter, and shared-mock tests prove catalog browsing, game setup, ability browsing, and wake-order preparation no longer require the backend.

### Non-Goals

- Do not migrate game snapshots or role saves.
- Do not remove `rolesApi.validate`, `rolesApi.checkName`, or the Axios client.
- Do not alter adapter signatures, engine semantics, or domain logic.

### Traceability

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1-AC3 | `yourwolf-frontend/src/App.tsx`, `yourwolf-frontend/src/test/setup.ts`, provider and render-helper modules | Must-have automated test |
| AC4 | `yourwolf-frontend/src/hooks/useRoles.ts`, `yourwolf-frontend/src/pages/RolesPage.tsx`, `yourwolf-frontend/src/pages/GameSetup.tsx` | Existing test to update |
| AC5 | `yourwolf-frontend/src/hooks/useAbilities.ts`, `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Existing test to update |
| AC6 | `yourwolf-frontend/src/pages/WakeOrderResolution.tsx`, `yourwolf-frontend/src/adapters/role_adapters.ts` | Existing test to update |
| AC7-AC8 | `yourwolf-frontend/src/test/setup.ts`, affected frontend suites | Must-have automated test; existing test to update |

## B. Correctness & Edge Cases

- Do not render `AppRoutes` before bootstrap succeeds.
- Show the original failure message when IndexedDB cannot open or seeding rejects.
- Avoid duplicate role fetches for repeated selected-role ids.
- Preserve loading, empty, and failure states already exposed by `useFetch` callers.
- Ensure each test database is isolated so asynchronous tests cannot leak records or ordering.
- Keep the provider value stable enough to avoid hook refetch loops.

## C. Consistency & Architecture Fit

- Follow the existing `Layout` around `AppRoutes` structure in `App.tsx`.
- Reuse `useFetch` and memoized fetchers rather than adding a second async-hook pattern.
- Reuse `adaptRoleToEngine` with the local record as both inputs. Do not create another adapter entry point.
- Required downstream contract: Features 04 and 05 consume the provider and shared render helper for repository-backed page and hook tests.
- New provider and helper symbols not named by the Phase remain `[PROPOSED - name TBD]` until implementation.

## D. Clean Design & Maintainability

- Keep provider construction, bootstrap state, and test setup separate but small.
- Centralize repository access in one context hook instead of passing repositories through page props.
- Avoid compatibility wrappers around removed HTTP reads.
- Keep it clean: one provider, one bootstrap gate, one shared render helper, existing hook patterns retained.

## E. Completeness: Observability, Security, Operability

- **Observability:** Add no normal-path logs. Render a visible bootstrap error with the underlying message.
- **Security:** Catalog data contains no secrets. Do not expose raw database handles through UI components.
- **Runbook:** Start with an empty database to verify loading and seed success. Simulate open failure for the error path. Run affected suites, full coverage, lint, and build. Roll back the provider and call-site changes together.

## F. Test Plan

- AC1-AC3: provider, loading, failure, and isolated render-helper tests.
- AC4-AC6: update the existing role, ability, game setup, roles page, and wake-order suites.
- AC7-AC8: assert forbidden request methods and URLs through the shared Axios guard.
- High-value checks:
  1. Given a pending bootstrap, when `App` renders, then navigation appears and routes do not.
  2. Given database open rejection, when bootstrap settles, then the shell shows the error message and no catalog page renders.
  3. Given no backend, when roles and game setup render after bootstrap, then all official roles are available with filters preserved.
  4. Given the builder opens offline, when abilities load, then all 15 appear.
  5. Given duplicate selected role ids, when wake order starts, then each distinct role is read once and adapted without HTTP.
- Reuse copied seeds, `fake-indexeddb`, existing page fixtures, and adapter tests.
- This rewires async reads. Update impacted tests to await bootstrap and repository fetches; do not suppress act warnings.
- Stage 0 is not required because the baseline suite exists and the global frontend coverage gate is 80 percent.

## Stage 1: Provider, Test Helper, and App Gate
**Goal**: Make bootstrapped repositories available to runtime and tests with explicit loading and failure states.
**Success Criteria**: AC1-AC3 pass.
**Status**: Not Started

## Stage 2: Catalog Read Migration
**Goal**: Move all role and ability reads to repositories without changing visible behavior or adapter contracts.
**Success Criteria**: AC4-AC8 pass with no forbidden catalog requests.
**Status**: Not Started
