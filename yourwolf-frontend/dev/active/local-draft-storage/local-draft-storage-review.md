# Review Record: Local Draft Storage

## Summary
Implementation is solid and well-structured. One high-severity race condition was found and fixed (sync effect clobbering localStorage on mount). A missing quota-exceeded test was added. Overall confidence: High.

## Verdict
Approved with Reservations (reservations now resolved — all fixes applied)

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `src/hooks/useDrafts.ts` | Hook exposes CRUD operations |
| AC2 | Verified | `src/hooks/useDrafts.ts:32-43` | `saveDraft` replaces or appends |
| AC3 | Verified | `src/hooks/useDrafts.ts:45-47` | `deleteDraft` filters by id |
| AC4 | Verified | `src/hooks/useDrafts.ts:7-20` | Fixed: lazy initializer now reads from localStorage synchronously |
| AC5 | Verified | `src/hooks/useDrafts.ts:49-53` | Returns draft or null |
| AC6 | Verified | `src/hooks/useDrafts.ts:55-57` | Sets state to `[]` |
| AC7 | Verified | `src/hooks/useDrafts.ts:17-19` | try/catch + Array.isArray guard |
| AC8 | Verified | `src/types/role.ts:57-67` | `RoleDraft` type used throughout |
| AC9 | Verified | `src/hooks/useDrafts.ts:59` | `drafts` array returned |
| AC10 | N/A | — | Integration contract; implemented by role-builder-wizard |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Sync effect overwrites localStorage on mount with `[]` (race condition) | High | `src/hooks/useDrafts.ts:7-22` | AC4 | Fixed |
| 2 | `getDraft` depends on `[drafts]` closure (minor inconsistency with updater pattern) | Low | `src/hooks/useDrafts.ts:49-53` | AC5 | Wont-Fix |
| 3 | No test for localStorage quota exceeded | Medium | `src/test/useDrafts.test.ts` | — | Fixed |
| 4 | localStorage mock uses `Object.defineProperty` at module scope | Low | `src/test/useDrafts.test.ts:40` | — | Open |
| 5 | `clearAllDrafts` writes `"[]"` to localStorage instead of removing the key | Low | `src/hooks/useDrafts.ts:26-29` | AC6 | Wont-Fix |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `src/hooks/useDrafts.ts` | Replaced mount `useEffect` + `useState([])` with lazy `useState` initializer that reads from localStorage synchronously, eliminating the race condition | 1 |
| `src/test/useDrafts.test.ts` | Added T11: quota-exceeded test — mocks `setItem` to throw `DOMException`, verifies hook doesn't crash | 3 |

## Remaining Concerns
- Issue #4: localStorage mock global override — low severity, acceptable given vitest worker isolation
- Issue #2: `getDraft` closure dependency — functionally correct for normal usage; only relevant if caller holds stale reference across renders
- Issue #5: `clearAllDrafts` leaves `"[]"` in storage — no functional impact, cosmetic only

## Test Coverage Assessment
- Covered: AC1–AC9 via T1–T11
- AC10: Integration contract, tested by role-builder-wizard feature
- Missing: No remaining high-value untested paths

## Risk Summary
- The lazy initializer fix (Issue #1) is the most impactful change — eliminates a data-loss race condition that could wipe drafts on mount
- localStorage mock scope (Issue #4) is low risk today but could cause flaky tests if test suite grows and shares workers
- No server-side persistence means drafts are lost if browser storage is cleared — acceptable per non-goals

---

*Reviewed: March 27, 2026*
