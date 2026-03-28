# Roles Listing Filters — Tasks

## Stage 1: Backend Multi-Visibility + Frontend Filters + Redirect Fix

### Backend Changes

- [ ] **routers/roles.py** — In `list_roles` endpoint, change `visibility: Visibility | None = Query(default=None)` to `visibility: list[Visibility] | None = Query(default=None)`
- [ ] **services/role_service.py** — In `list_roles` method signature, change `visibility: Visibility | None = None` to `visibility: list[Visibility] | None = None`
- [ ] **services/role_service.py** — In `list_roles` filter block, change `query.filter(Role.visibility == visibility)` to `query.filter(Role.visibility.in_(visibility))`

### Frontend Changes — Redirect Fix

- [ ] **RoleBuilder.tsx** — In `handleSave`, change `navigate(\`/roles/\${role.id}\`)` to `navigate('/roles')`

### Frontend Changes — API Layer

- [ ] **api/roles.ts** — In `RoleListParams` interface, change `visibility?: string` to `visibility?: string[]`
- [ ] **api/roles.ts** — In `rolesApi.list`, add params serializer to produce repeated query keys (`?visibility=official&visibility=private`) instead of bracket notation. Use: `paramsSerializer: {indexes: null}` on the axios call, or manually build the query string.

### Frontend Changes — useRoles Hook

- [ ] **hooks/useRoles.ts** — Add `visibility` parameter: `export function useRoles(visibility?: string[]): UseRolesResult`
- [ ] **hooks/useRoles.ts** — Change `rolesApi.listOfficial()` call to `rolesApi.list({visibility})` (or omit param when undefined)
- [ ] **hooks/useRoles.ts** — Make the `useFetch` `fetcher` depend on `visibility` so it refetches when filters change (add to deps array or key)

### Frontend Changes — Roles Page UI

- [ ] **pages/Roles.tsx** — Add filter state: `const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['official', 'private']))`
- [ ] **pages/Roles.tsx** — Define filter config array: `[{key: 'official', label: 'Official'}, {key: 'private', label: 'My Roles'}, {key: 'public', label: 'Downloaded'}]`
- [ ] **pages/Roles.tsx** — Render three toggle buttons below the header, using active/inactive styling (pill buttons matching team button pattern from `BasicInfoStep`)
- [ ] **pages/Roles.tsx** — Toggle handler: if clicking would leave 0 active filters, do nothing; otherwise toggle the filter and trigger refetch
- [ ] **pages/Roles.tsx** — Pass `Array.from(activeFilters)` to `useRoles`
- [ ] **pages/Roles.tsx** — Change page title `<h1>` from "Official Roles" to "Roles"
- [ ] **pages/Roles.tsx** — Change subtitle from "Browse all official…" to "Browse and manage your werewolf roles"

### Backend Tests

- [ ] **tests/test_roles.py** — Add test: `GET /api/roles?visibility=official&visibility=private` returns roles of both visibilities
- [ ] **tests/test_roles.py** — Add test: `GET /api/roles?visibility=official` returns only official (backward compat)
- [ ] **tests/test_roles.py** — Add test: `GET /api/roles` (no visibility param) returns all roles

### Frontend Tests

- [ ] **test/RoleBuilder.test.tsx** — Update redirect assertion: expect `mockNavigate` called with `'/roles'` (not `/roles/new-role-id`)
- [ ] **test/Roles.test.tsx** — Update mock setup: mock `rolesApi.list` instead of (or in addition to) `rolesApi.listOfficial`. The hook now calls `.list()`.
- [ ] **test/Roles.test.tsx** — Add test: "renders three filter buttons" — assert buttons with text "Official", "My Roles", "Downloaded" exist
- [ ] **test/Roles.test.tsx** — Add test: "Official and My Roles are active by default" — assert those buttons have active styling/aria
- [ ] **test/Roles.test.tsx** — Add test: "toggling Downloaded filter triggers refetch" — click Downloaded button, assert `rolesApi.list` called with updated visibility array
- [ ] **test/Roles.test.tsx** — Add test: "cannot deselect last active filter" — deselect My Roles, then try to deselect Official — Official remains active
- [ ] **test/Roles.test.tsx** — Add test: "page title reads Roles" — assert `<h1>` text is "Roles"
- [ ] **test/useRoles.test.ts** — Update to verify `rolesApi.list` called with visibility params instead of `rolesApi.listOfficial`

### Validation

- [ ] Run backend tests: `pytest` — all pass
- [ ] Run frontend tests: `npm test` — all pass
- [ ] Manual QA: create a new role, confirm redirect to `/roles`
- [ ] Manual QA: on `/roles`, confirm 3 filter buttons visible with correct defaults
- [ ] Manual QA: toggle "My Roles" off — private roles disappear; toggle back on — they reappear
- [ ] Manual QA: confirm newly created private role appears when "My Roles" is active
