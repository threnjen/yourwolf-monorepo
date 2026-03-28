# Roles Listing Filters — Plan

> Add visibility filter toggles (Official / My / Downloaded) to the Roles page, fix post-save redirect, support multi-visibility backend queries.

## Stage 1: Backend Multi-Visibility + Frontend Filters + Redirect Fix

**Goal**: Roles page shows filter toggle buttons; backend supports multi-visibility queries; role creation redirects to `/roles`.

**Success Criteria**: All 7 acceptance criteria pass; existing tests updated and green.

**Status**: Not Started

---

## A. Requirements & Traceability

### Acceptance Criteria

| AC  | Description |
|-----|-------------|
| AC1 | After successful role creation, user is redirected to `/roles` (not `/roles/:id`) |
| AC2 | Roles page shows three filter toggle buttons: "Official", "My Roles", "Downloaded" |
| AC3 | "Official" and "My Roles" are selected by default; "Downloaded" is not |
| AC4 | Toggling a filter on/off re-fetches and displays matching roles; at least one filter must remain active |
| AC5 | Backend `GET /api/roles` accepts multiple `visibility` query params (e.g., `?visibility=official&visibility=private`) |
| AC6 | Page title changes from "Official Roles" to "Roles" |
| AC7 | Newly created private roles appear when "My Roles" filter is active |

### Non-Goals

- No `/roles/:id` detail page — redirect goes to the listing
- No auth-based "My Roles" filtering — until auth exists, "My Roles" = `visibility=private`
- No "Downloaded Roles" backend logic beyond filtering `visibility=public` — content will be empty until community sharing is built
- No changes to team grouping or sort order within the listing
- No removal of `/roles/official` backend endpoint — keep for backward compat

### Traceability Matrix

| AC  | Code Areas / Modules | Planned Tests |
|-----|---------------------|---------------|
| AC1 | `yourwolf-frontend/src/pages/RoleBuilder.tsx` — `navigate()` call | `test_ac1_redirect_to_roles` |
| AC2 | `yourwolf-frontend/src/pages/Roles.tsx` — filter UI | `test_ac2_filter_buttons_render` |
| AC3 | `yourwolf-frontend/src/pages/Roles.tsx` — default state | `test_ac3_default_filters` |
| AC4 | `yourwolf-frontend/src/pages/Roles.tsx` + `yourwolf-frontend/src/hooks/useRoles.ts` | `test_ac4_filter_toggle`, `test_ac4_prevent_all_off` |
| AC5 | `yourwolf-backend/app/routers/roles.py` + `yourwolf-backend/app/services/role_service.py` | `test_ac5_multi_visibility` |
| AC6 | `yourwolf-frontend/src/pages/Roles.tsx` — heading text | `test_ac6_page_title` |
| AC7 | Integration of AC1 + AC3 + AC5 | `test_ac7_new_role_visible` (manual QA) |

---

## B. Correctness & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| All filters deselected | Prevented: last active toggle cannot be deselected (button stays active, click is a no-op) |
| Empty results for all active filters | Standard empty state: "No roles found" with guidance text |
| API error during fetch | Existing error banner renders; no partial results |
| URL has no visibility params (backward compat) | Backend defaults to returning all roles (existing behavior when no filter) |
| Multiple `?visibility=X&visibility=Y` params | FastAPI `Query(default=None)` with `list[Visibility]` type handles this natively |
| Frontend sends no visibility params (all 3 active) | Omit param entirely — backend returns all visibilities (same as no filter) |

### Error Handling

- No new error paths introduced. The existing `error` state from `useFetch` handles API failures.
- Filter state is local component state — no persistence needed.

---

## C. Consistency & Architecture Fit

### Existing Patterns to Follow

- **Filter buttons**: Use same `getTeamButtonStyles` pattern from `BasicInfoStep.tsx` — pill-style buttons with active/inactive border+color treatment, adapted for filter semantics
- **Data fetching**: `useRoles` already wraps `useFetch`. Change it to accept `visibility` params and call `rolesApi.list()` instead of `rolesApi.listOfficial()`
- **Backend query pattern**: `list_roles` already filters on `team` with `query.filter(Role.team == team)`. Change `visibility` filter from `==` to `.in_()` when multiple values provided
- **FastAPI list query param**: Use `visibility: list[Visibility] | None = Query(default=None)` — FastAPI handles repeated `?visibility=X&visibility=Y` natively

### Deviations

- `rolesApi.listOfficial()` becomes unused on the frontend — remove the call site in `useRoles.ts`. Keep the backend `/roles/official` endpoint for API backward compat.
- `useRoles` gains a `visibility` parameter — minor interface change, but follows existing `params` pattern in `rolesApi.list()`

### Interface Contracts

**Backend `GET /api/roles` updated signature:**
```
visibility: list[Visibility] | None = Query(default=None)
```
- `None` (omitted): no visibility filter (returns all)
- Single value: `?visibility=official`
- Multiple values: `?visibility=official&visibility=private`

**Frontend `useRoles` updated signature:**
```typescript
function useRoles(visibility?: string[]): UseRolesResult
```

**Frontend `rolesApi.list` params update:**
```typescript
interface RoleListParams {
  team?: string;
  visibility?: string[];  // was: string
  page?: number;
  limit?: number;
}
```

---

## D. Clean Design

- **Backend**: 1 parameter type change + 1 filter line change in `role_service.py`
- **Frontend**: Filter state as `Set<string>` in `Roles.tsx`, passed down to `useRoles` → `rolesApi.list`
- No new hooks, context, or routing changes
- No new components — filter buttons are inline in `Roles.tsx`

### Keep It Clean Checklist

- [ ] No new abstractions — filter state is a local `useState` in `Roles.tsx`
- [ ] Reuse existing button styling patterns
- [ ] `useRoles` accepts optional visibility array — default is `['official', 'private']`
- [ ] No new routes needed — redirect goes to existing `/roles`

---

## E. Observability, Security, Operability

- **Security**: `visibility` is already a public filter. No sensitive data exposure changes.
- **Deploy**: Backend change required (parameter type). Backward compatible — omitting the param returns all roles (same as before).
- **Rollback**: Revert backend param change + frontend filter state. No data migration.
- **Monitoring**: No new endpoints or metrics.

---

## F. Test Plan

### Test Cases

| # | Test | AC | Given / When / Then |
|---|------|----|---------------------|
| 1 | Redirect after save | AC1 | Given role created / When API returns success / Then `navigate('/roles')` called (not `/roles/:id`) |
| 2 | Filter buttons render | AC2 | Given Roles page loads / When observed / Then 3 filter buttons visible: "Official", "My Roles", "Downloaded" |
| 3 | Default selection | AC3 | Given Roles page loads / When observed / Then Official + My Roles buttons are active; Downloaded is inactive |
| 4 | Toggle filter refetches | AC4 | Given Official + My active / When "My Roles" toggled off / Then `rolesApi.list` called with `visibility: ['official']` |
| 5 | Prevent all-off | AC4 | Given only Official active / When Official toggle clicked / Then button remains active; no refetch |

### Backend Test Cases

| # | Test | AC | Given / When / Then |
|---|------|----|---------------------|
| 1 | Multi-visibility filter | AC5 | Given roles with official + private visibility / When `GET /api/roles?visibility=official&visibility=private` / Then both returned |
| 2 | Single visibility compat | AC5 | Given roles / When `GET /api/roles?visibility=official` / Then only official returned |
| 3 | No visibility param | AC5 | Given roles / When `GET /api/roles` (no filter) / Then all returned |

### Fixtures/Mocks to Update

- `Roles.test.tsx`: mock `rolesApi.list` instead of `rolesApi.listOfficial`; add filter button tests
- `RoleBuilder.test.tsx`: update redirect assertion from `/roles/new-role-id` to `/roles`
- `test_roles.py` (backend): add multi-visibility query test
