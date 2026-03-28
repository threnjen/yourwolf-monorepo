# Roles Listing Filters — Context

## Key Files

### Backend

| File | Role |
|------|------|
| `yourwolf-backend/app/routers/roles.py` | `list_roles` endpoint — change `visibility` param from `Visibility \| None` to `list[Visibility] \| None` |
| `yourwolf-backend/app/services/role_service.py` | `list_roles` method — change filter from `.filter(Role.visibility == visibility)` to `.filter(Role.visibility.in_(visibility))` |
| `yourwolf-backend/app/models/role.py` | `Visibility` enum — no changes needed |
| `yourwolf-backend/tests/test_roles.py` | Add multi-visibility query param test |

### Frontend

| File | Role |
|------|------|
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | Line 76: change `navigate(\`/roles/\${role.id}\`)` → `navigate('/roles')` |
| `yourwolf-frontend/src/pages/Roles.tsx` | Add filter toggle state + UI; change title from "Official Roles" to "Roles"; pass visibility to `useRoles` |
| `yourwolf-frontend/src/hooks/useRoles.ts` | Accept optional `visibility` param; call `rolesApi.list({visibility})` instead of `rolesApi.listOfficial()` |
| `yourwolf-frontend/src/api/roles.ts` | `RoleListParams.visibility` type: `string` → `string[]`; update axios params serialization for array |
| `yourwolf-frontend/src/test/Roles.test.tsx` | Update mocks and add filter tests |
| `yourwolf-frontend/src/test/RoleBuilder.test.tsx` | Update redirect assertion |
| `yourwolf-frontend/src/routes.tsx` | No changes — `/roles` route already exists |

## Key Decisions

1. **Filter mapping**: "Official" → `visibility=official`, "My Roles" → `visibility=private`, "Downloaded" → `visibility=public`. These map directly to the `Visibility` enum values.
2. **No auth gating for "My Roles"**: Until auth is implemented, all private roles are shown. When auth is added, "My Roles" will additionally filter by `creator_id`.
3. **At least one filter must be active**: Clicking the last remaining active filter is a no-op. This prevents empty-by-design states.
4. **Array serialization**: Axios with `paramsSerializer` or repeated keys — use `{params: {visibility: ['official', 'private']}}` with Axios default serialization which produces `?visibility[]=official&visibility[]=private`. OR switch to manual serialization that produces `?visibility=official&visibility=private` to match FastAPI's expected format. **Decision: use custom params serializer** for the list call to produce repeated keys.
5. **Redirect to listing**: Simplest option. No role detail page needed yet.

## Constraints

- Backend change is backward compatible — omitting `visibility` returns all roles
- Frontend change removes reliance on `/roles/official` endpoint — the endpoint stays but is no longer called from the SPA
- Filter state is ephemeral (not URL params) — refreshing the page resets to defaults. URL-param persistence can be added later if needed.

## Sibling Plans

- **`wake-order-gating`**: Independent. No shared prerequisites. Can be implemented in any order.
