# Role Card Copies — Context

> Key files, decisions, constraints, and patterns for implementation.

---

## Key Files

### Backend (Stage 1)

| File | Role | What Changes |
|------|------|-------------|
| `yourwolf-backend/app/models/role.py` | Role model | No changes (already has `default_count`, `min_count`, `max_count`, `dependencies` relationship) |
| `yourwolf-backend/app/models/role_dependency.py` | RoleDependency model | No changes (already has `DependencyType`, `role`, `required_role` relationships) |
| `yourwolf-backend/app/schemas/role.py` | Pydantic schemas | Add `dependencies` to `RoleListItem` |
| `yourwolf-backend/app/services/role_service.py` | Role business logic | Add eager loading + mapping in `list_roles()` |
| `yourwolf-backend/tests/test_roles.py` | Role endpoint tests | Add test for dependencies in list response |
| `yourwolf-backend/tests/conftest.py` | Test fixtures | Already has `extended_role_set` fixture with dependencies; reuse it |

### Frontend (Stages 2–4)

| File | Role | What Changes |
|------|------|-------------|
| `yourwolf-frontend/src/types/role.ts` | TypeScript types | Add count fields + `RoleDependency` to `RoleListItem` |
| `yourwolf-frontend/src/components/RoleCard.tsx` | Role card UI | Add copy-count badge |
| `yourwolf-frontend/src/pages/GameSetup.tsx` | Game setup page | Replace toggle with quantity selection + dependency management |
| `yourwolf-frontend/src/test/mocks.ts` | Test mock factories | Add count + dependency defaults |
| `yourwolf-frontend/src/test/GameSetup.test.tsx` | GameSetup tests | Add quantity + dependency test cases |
| `yourwolf-frontend/src/test/RoleCard.test.tsx` | RoleCard tests | Add badge rendering tests |

### Docs (Stage 5)

| File | Role | What Changes |
|------|------|-------------|
| `yourwolf-docs/docs/phases/PHASE_2/PHASE_2_QA.md` | Manual QA plan | Add sections 1.6 and 1.7 |

---

## Existing Patterns to Follow

### Backend

- `RoleDependencyResponse` schema already exists in `yourwolf-backend/app/schemas/role.py` — reuse it for `RoleListItem.dependencies`
- `get_role()` in `role_service.py` already maps dependencies with `joinedload` — follow the same pattern in `list_roles()`
- `RoleListItem` uses `model_validate()` for ORM→Pydantic — dependencies will need manual mapping since `RoleDependencyResponse` has `required_role_name` which comes from a joined relationship
- Test fixtures in `conftest.py` already have `extended_role_set` with Mason (min=2, max=2), Werewolf (min=1, max=2), and dependency pairs

### Frontend

- Inline `React.CSSProperties` style objects (no CSS modules or styled-components)
- `theme` object from `../styles/theme` for all colors, spacing, radii
- Vitest + React Testing Library for component tests
- Mock pattern: `vi.mock('../hooks/useRoles')` + typed mock return values
- `RoleCard` accepts `role: RoleListItem` prop — count fields are already part of the object, just not in the TS type yet

---

## Key Decisions

### D1: Dependencies on the List Endpoint

**Decision**: Add `dependencies` to `RoleListItem` rather than requiring per-role detail fetches.

**Rationale**: The GameSetup page fetches via `rolesApi.listOfficial()`. Without dependencies on the list response, auto-selecting required roles would require either (a) fetching every role's detail on page load (N+1) or (b) a separate "dependencies" endpoint. Adding to the list response is simpler and the data is small (most roles have 0–1 dependencies).

**Trade-off**: Slightly larger list payload. Acceptable given ≤30 official roles and ≤2 dependencies each.

### D2: State Model — Counts Map vs ID Array

**Decision**: Use `Record<string, number>` for selection state; derive flat ID array for API calls.

**Rationale**: A counts map naturally represents "Werewolf: 2, Villager: 3" and makes +/– operations O(1). The API expects a flat array of role IDs (with duplicates for copies), which is derived at submit time.

### D3: Dependency Resolution Depth

**Decision**: One level deep only (no recursive cascading).

**Rationale**: Current seed data has no transitive dependency chains (e.g., A requires B requires C). If this changes in the future, recursion can be added. Keeping it single-level avoids infinite loops and is simpler to reason about.

### D4: – Button Below min_count

**Decision**: Clicking – when count equals `min_count` removes the role entirely (deselects it), rather than clamping.

**Rationale**: This matches the user's mental model — "I don't want this role anymore." If we clamped, the only way to deselect would be clicking the card itself, which creates two different deselect paths. Unified behavior: – always decreases or removes.

### D5: RECOMMENDS Stays Backend-Only

**Decision**: Only REQUIRES dependencies trigger frontend auto-selection. RECOMMENDS dependencies produce warnings from the backend after game creation.

**Rationale**: Auto-selecting recommended roles would be surprising UX — users expect control over optional choices. The backend already returns warnings for missing RECOMMENDS dependencies in the `GameSessionResponse.warnings` field.

---

## Constraints

1. **No new dependencies**: No state management library (Zustand, Redux). Use React `useState` only.
2. **Style approach**: Inline `React.CSSProperties` per project convention — no CSS-in-JS libraries.
3. **Backend stays source of truth**: Frontend quantity/dependency logic is advisory UX. Backend `GameService.create_game()` still validates min/max counts and REQUIRES dependencies on submission.
4. **Roles list limit**: `rolesApi.listOfficial()` fetches first 50 roles (known Issue #7). This is acceptable for current seed data (30 roles).

---

## Seed Data Reference

### Multi-Copy Roles

| Role | default_count | min_count | max_count | Behavior |
|------|--------------|-----------|-----------|----------|
| Villager | 3 | 1 | 3 | Add 3; adjustable 1–3 |
| Werewolf | 2 | 1 | 2 | Add 2; adjustable 1–2 |
| Mason | 2 | 2 | 2 | Add 2; fixed (no +/–) |
| All others | 1 | 1 | 1 | Standard toggle |

### REQUIRES Dependencies

| Source → Target | Effect |
|----------------|--------|
| Apprentice Tanner → Tanner | Adding Apprentice Tanner auto-adds Tanner |

### RECOMMENDS Dependencies (no frontend auto-select)

| Source → Target |
|----------------|
| Minion → Werewolf |
| Mystic Wolf → Werewolf |
| Dream Wolf → Werewolf |
| Alpha Wolf → Werewolf |
| Squire → Werewolf |
| Paranormal Investigator → Werewolf |
| Beholder → Seer |
| Beholder → Apprentice Seer |
