# Local Draft Storage — Context

> Key files, decisions, constraints, and patterns for implementation.

---

## Key Files

### New Files

| File | Role |
|------|------|
| `src/hooks/useDrafts.ts` | Hook — localStorage CRUD for role drafts |
| `src/test/useDrafts.test.ts` | Tests for useDrafts hook |

### Dependencies (From Other Features)

| File | Feature | What It Provides |
|------|---------|-----------------|
| `src/types/role.ts` | `role-builder-wizard` | `RoleDraft` type definition |

### Read-Only (Pattern Reference)

| File | Why |
|------|-----|
| `src/hooks/useRoles.ts` | Pattern reference for hook structure |
| `src/hooks/useGame.ts` | Pattern reference for hook with callbacks |
| `src/test/useRoles.test.ts` | Pattern reference for hook testing |

---

## Existing Patterns to Follow

### Hook Pattern (`src/hooks/useRoles.ts`)

- `useState` for state management
- `useCallback` for memoized functions returned to consumers
- `useEffect` for side effects (data fetching on mount)
- Returns a plain object with named properties
- No TypeScript generics — concrete types only

### Hook Test Pattern (`src/test/useRoles.test.ts`)

- Uses `renderHook` from `@testing-library/react`
- State updates wrapped in `act()`
- Assertions on `result.current` properties
- Vitest (`vi.mock`, `vi.fn`, `vi.spyOn`)

---

## Key Decisions

### D1: localStorage, Not sessionStorage

**Decision**: Use `localStorage` for draft persistence.

**Rationale**: `localStorage` persists across browser sessions (closing and reopening the browser). `sessionStorage` is cleared when the tab closes, which would lose work-in-progress roles.

### D2: Full Array Serialization

**Decision**: Store the entire drafts array as a single JSON string under one key.

**Rationale**: Simpler than key-per-draft. With ≤10 drafts expected, serializing the full array on each save is negligible. Single-key storage makes `clearAll` trivial and avoids key enumeration.

### D3: Sync Write on Every State Change

**Decision**: `useEffect([drafts])` writes to localStorage on every change.

**Rationale**: Ensures persistence is never stale. The alternative (explicit save calls) risks missing saves on unmount or refresh. The write cost is negligible for small arrays.

### D4: No Cross-Tab Sync

**Decision**: Don't listen for `window.storage` events to sync across tabs.

**Rationale**: MVP scope — users aren't expected to edit roles in multiple tabs simultaneously. Adding a `storage` event listener adds complexity and edge cases. Can be added later if needed.

### D5: Graceful Corruption Handling

**Decision**: If `JSON.parse` fails or the parsed value isn't an array, fall back to `[]`.

**Rationale**: localStorage can be manually edited or corrupted by other code. Crashing on corrupt data would make the entire app unusable. Silent fallback with an empty array is the safest behavior.

---

## Constraints

1. **No new dependencies** — Uses only React hooks and browser `localStorage` API
2. **Type dependency** — `RoleDraft` type must be defined before this hook can be implemented (handled by `role-builder-wizard` Stage 1)
3. **No SSR** — `localStorage` is browser-only; not a concern since the app is a Vite SPA
4. **Storage limit** — ~5MB per origin; each draft is ~1–2KB; ample room
5. **Vitest environment** — Tests run in jsdom; `localStorage` is available but should be mocked for isolation

---

## Relationship to Other Features

- **role-builder-wizard** (frontend): Consumes `useDrafts` in `RoleBuilder.tsx` for auto-save and draft restoration. The `RoleDraft` type is defined by that feature.
- **No backend dependency** — This feature is entirely client-side.

---

*Last updated: March 26, 2026*
