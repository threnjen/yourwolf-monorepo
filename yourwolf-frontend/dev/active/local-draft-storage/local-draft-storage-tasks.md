# Local Draft Storage — Task Checklist

> Work items ordered by stage. Each item should be completed and tested before moving on.

---

## Stage 0: Prerequisites

- [ ] **0.1** Confirm `RoleDraft` type exists in `src/types/role.ts` (from `role-builder-wizard` Stage 1)
  - If not yet implemented: coordinate with wizard feature or define a minimal version
- [ ] **0.2** Confirm vitest + `@testing-library/react` `renderHook` is available
- [ ] **0.3** Review `src/hooks/useRoles.ts` for hook pattern reference

---

## Stage 1: Implement useDrafts Hook

- [ ] **1.1** Create `src/hooks/useDrafts.ts`:
  - Define `STORAGE_KEY = 'yourwolf_drafts'` as module-level constant
  - `useState<RoleDraft[]>` initialized to `[]`
  - Mount effect (`useEffect([], ...)`) — read and parse `localStorage.getItem(STORAGE_KEY)`:
    - Wrap `JSON.parse()` in try/catch
    - Validate parsed value is an array (`Array.isArray`)
    - On failure: silently fall back to `[]`
  - Sync effect (`useEffect([drafts], ...)`) — `localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))`
    - Wrap `setItem` in try/catch for quota exceeded
- [ ] **1.2** Implement `saveDraft` with `useCallback`:
  - Find existing draft by `id` in state
  - If found: replace in-place
  - If not found: append to array
- [ ] **1.3** Implement `deleteDraft` with `useCallback`:
  - Filter out draft with matching `id`
- [ ] **1.4** Implement `getDraft` with `useCallback`:
  - `find` by `id`, return draft or `null`
- [ ] **1.5** Implement `clearAllDrafts` with `useCallback`:
  - Set state to `[]`
- [ ] **1.6** Return `{ drafts, saveDraft, deleteDraft, getDraft, clearAllDrafts }`

---

## Stage 2: Tests

- [ ] **2.1** Create `src/test/useDrafts.test.ts`
- [ ] **2.2** Set up localStorage mocks:
  - `vi.spyOn(Storage.prototype, 'getItem')`
  - `vi.spyOn(Storage.prototype, 'setItem')`
  - Clear mocks in `beforeEach`
- [ ] **2.3** Test: starts with empty drafts when localStorage is empty
- [ ] **2.4** Test: loads drafts from localStorage on mount
- [ ] **2.5** Test: saves new draft (drafts array grows by 1)
- [ ] **2.6** Test: updates existing draft with same ID (array length unchanged, data updated)
- [ ] **2.7** Test: deletes draft by ID
- [ ] **2.8** Test: gets draft by ID (returns draft)
- [ ] **2.9** Test: returns null for unknown draft ID
- [ ] **2.10** Test: clears all drafts
- [ ] **2.11** Test: handles corrupted localStorage JSON gracefully (falls back to `[]`)
- [ ] **2.12** Test: handles non-array localStorage value gracefully (falls back to `[]`)
- [ ] **2.13** Run tests — all pass

---

## Final Verification

- [ ] All acceptance criteria AC1–AC10 have at least one test (AC10 is integration, documented as contract)
- [ ] No existing tests broken
- [ ] No TypeScript errors
- [ ] Hook exports match the interface expected by `role-builder-wizard`

---

*Last updated: March 26, 2026*
