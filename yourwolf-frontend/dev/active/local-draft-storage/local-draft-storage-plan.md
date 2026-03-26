# Local Draft Storage

> **Goal**: Implement client-side draft persistence using localStorage so that work-in-progress role configurations survive page refreshes and browser restarts.

---

## Requirements & Acceptance Criteria

| ID | Acceptance Criteria |
|----|---------------------|
| AC1 | `useDrafts` hook provides CRUD operations for drafts stored in localStorage |
| AC2 | Saving a new draft persists it; saving an existing draft (same ID) updates it |
| AC3 | Deleting a draft removes it from storage |
| AC4 | Drafts survive page refresh (loaded from localStorage on mount) |
| AC5 | `getDraft(id)` returns a specific draft or `null` |
| AC6 | `clearAllDrafts()` removes all drafts |
| AC7 | Corrupted/invalid localStorage data is handled gracefully (fallback to empty array) |
| AC8 | `RoleDraft` type from `role-builder-wizard` is the shape stored |
| AC9 | Draft list can be displayed to the user (drafts array exposed by hook) |
| AC10 | Auto-save: wizard draft changes are saved automatically (integration with role-builder-wizard) |

### Non-Goals

- Server-side draft persistence
- Draft sharing between users/browsers
- Draft versioning or undo history
- Draft expiration / TTL
- Draft encryption

### Traceability

| AC | Code Areas | Planned Tests |
|----|-----------|---------------|
| AC1 | `hooks/useDrafts.ts` | `test_save_draft`, `test_delete_draft`, `test_get_draft` |
| AC2 | `hooks/useDrafts.ts` | `test_update_existing_draft` |
| AC3 | `hooks/useDrafts.ts` | `test_delete_removes_draft` |
| AC4 | `hooks/useDrafts.ts` | `test_loads_from_localstorage` |
| AC5 | `hooks/useDrafts.ts` | `test_get_draft_by_id`, `test_get_draft_not_found` |
| AC6 | `hooks/useDrafts.ts` | `test_clear_all` |
| AC7 | `hooks/useDrafts.ts` | `test_corrupted_localstorage` |
| AC8 | `types/role.ts` | Type check — no dedicated test |
| AC9 | `hooks/useDrafts.ts` | `test_drafts_array_exposed` |
| AC10 | `pages/RoleBuilder.tsx` integration | Documented as integration contract — tested in wizard feature |

---

## Stage 1: useDrafts Hook

**Goal**: Implement the complete `useDrafts` hook with localStorage persistence.

**Success Criteria**: All hook operations work correctly; drafts persist across mounts.

**Status**: Not Started

### Changes

1. **`src/hooks/useDrafts.ts`** — New hook:
   - Storage key: `yourwolf_drafts`
   - On mount: read from `localStorage.getItem(STORAGE_KEY)`, parse JSON, set state
   - On state change: `localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))`
   - `saveDraft(draft: RoleDraft)`: if draft with same `id` exists → replace; else → append
   - `deleteDraft(id: string)`: filter out draft with matching id
   - `getDraft(id: string)`: find draft by id, return or null
   - `clearAllDrafts()`: set state to empty array
   - Error handling: if `JSON.parse()` fails on mount, fall back to empty array (don't crash)

### Design Notes

- Uses `useState` + `useEffect` + `useCallback` — same pattern as `useRoles`
- `useEffect` for localStorage sync runs on `[drafts]` dependency
- `useEffect` for initial load runs on `[]` (mount only)
- `useCallback` wraps all exposed functions for referential stability
- `RoleDraft` type is defined in `src/types/role.ts` by the `role-builder-wizard` feature — this feature depends on that type existing

---

## Stage 2: Tests

**Goal**: Comprehensive test coverage for all hook operations.

**Success Criteria**: All tests pass; edge cases covered.

**Status**: Not Started

### Changes

1. **`src/test/useDrafts.test.ts`** — New test file:

### Test Cases

**T1: Starts with empty drafts when no localStorage data**
- Given: localStorage returns null
- When: Hook renders
- Then: `drafts` is `[]`

**T2: Loads existing drafts from localStorage**
- Given: localStorage contains `[{ id: '1', name: 'Test' }]`
- When: Hook renders
- Then: `drafts` has 1 item with name 'Test'

**T3: Saves new draft**
- Given: Empty drafts
- When: `saveDraft({ id: '1', name: 'New' })`
- Then: `drafts` has 1 item; localStorage.setItem called

**T4: Updates existing draft (same ID)**
- Given: Draft with id '1' exists
- When: `saveDraft({ id: '1', name: 'Updated' })`
- Then: `drafts` still has 1 item with name 'Updated'

**T5: Deletes draft**
- Given: Draft with id '1' exists
- When: `deleteDraft('1')`
- Then: `drafts` is empty

**T6: Gets draft by ID**
- Given: Draft with id '1' exists
- When: `getDraft('1')`
- Then: Returns the draft

**T7: Returns null for unknown ID**
- Given: No draft with id '999'
- When: `getDraft('999')`
- Then: Returns `null`

**T8: Clears all drafts**
- Given: 3 drafts exist
- When: `clearAllDrafts()`
- Then: `drafts` is `[]`

**T9: Handles corrupted localStorage gracefully**
- Given: localStorage contains `"not-valid-json{{{"`
- When: Hook renders
- Then: `drafts` is `[]` (no crash)

**T10: Handles localStorage with wrong shape gracefully**
- Given: localStorage contains `"just a string"`
- When: Hook renders
- Then: `drafts` is `[]`

### Test Setup Notes

- Mock `localStorage` with `vi.spyOn(Storage.prototype, 'getItem')` and `vi.spyOn(Storage.prototype, 'setItem')`
- Use `renderHook` from `@testing-library/react` with `act()` for state updates
- Clean up mocks in `beforeEach`

---

## Integration Contract with Role Builder Wizard

The `role-builder-wizard` feature integrates with `useDrafts` as follows:

1. **`RoleBuilder.tsx`** calls `useDrafts()` to get `{ saveDraft, getDraft, deleteDraft, drafts }`
2. On mount, if editing a draft: `getDraft(draftId)` to restore state
3. On draft change: `saveDraft(currentDraft)` to auto-persist
4. On successful role creation: `deleteDraft(currentDraft.id)` to clean up
5. Draft list page (future): uses `drafts` array to show all WIP roles

This integration is implemented in the `role-builder-wizard` feature's Stage 7 (RoleBuilder page). The `local-draft-storage` feature only provides the hook — it does not create UI.

---

## Correctness & Edge Cases

- localStorage full (quota exceeded) → `setItem` may throw; wrap in try/catch, log warning
- Multiple tabs → each tab has its own React state; localStorage changes in another tab won't auto-sync (acceptable for MVP; `storage` event listener is future enhancement)
- Draft with no `id` → should never happen; `RoleDraft.id` is required per type definition
- Very large drafts → unlikely given role complexity; localStorage has ~5MB limit per origin

## Clean Design Checklist

- [ ] Single hook file — no external utilities
- [ ] `useCallback` on all exposed functions
- [ ] Error boundaries: JSON.parse wrapped in try/catch
- [ ] No side effects outside useEffect
- [ ] Storage key as module-level constant, not hardcoded in multiple places

---

*Last updated: March 26, 2026*
