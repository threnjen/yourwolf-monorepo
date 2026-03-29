# QA Readiness Analysis: Phase 3.6 — Review Wake Order

**Date:** 2026-03-28
**Analyst:** Phase - Final Review (automated)
**Verdict:** GO WITH CONDITIONS
**Documents Analyzed:** 13
**Findings:** 8 (0 blockers, 0 high, 2 medium, 6 low)

---

## Executive Summary

Phase 3.6 is ready for manual QA with minor conditions. Both backend (wake order sequence support) and frontend (Review Wake Order page) features are fully implemented and pass their test suites — backend 241 passed, frontend 340 passed with 3 pre-existing unrelated failures in `useRoles.test.ts`. All 16 success criteria from the phase specification are covered by implementation and verifiable through automated tests or the QA plan. Two medium-severity findings relate to documentation gaps (frontend tasks file not updated to reflect completion) and one untested frontend task stage checklist reconciliation. The QA plan is well-structured, actionable, and appropriately scoped to manual-only concerns (drag-and-drop interaction, visual styling, end-to-end flow). Confidence is high that the QA plan will catch any remaining issues.

---

## Document Inventory

| Document | File | Source | Present | Notes |
|----------|------|--------|---------|-------|
| Phase Specification | `docs/phases/PHASE_3.6/PHASE_3.6_WAKE_ORDER_RESOLUTION.md` | Phase Author | Yes | 16 success criteria (SC1–SC16), comprehensive edge cases |
| Backend Plan | `dev/wake-order-backend/wake-order-backend-plan.md` | Feature - Decomposer | Yes | 13 ACs, 5 stages |
| Backend Context | `dev/wake-order-backend/wake-order-backend-context.md` | Feature - Decomposer | Yes | Key files, decisions, constraints |
| Backend Tasks | `dev/wake-order-backend/wake-order-backend-tasks.md` | Feature - Decomposer | Yes | All tasks checked complete |
| Backend Implementation Record | — | Feature - Implementer | **No** | Backend was pre-implemented; no formal implementation record exists. Context doc notes "all backend work appears already implemented." |
| Backend Review Record | — | Feature - Reviewer | **No** | No formal review record. Backend pre-existed this pipeline run. |
| Backend QA Plan | — | Feature - QA Writer | **No** | No separate backend QA plan. Backend is tested via automated tests only. |
| Frontend Plan | `dev/wake-order-frontend/wake-order-frontend-plan.md` | Feature - Decomposer | Yes | 14 ACs, 6 stages (0–5) |
| Frontend Context | `dev/wake-order-frontend/wake-order-frontend-context.md` | Feature - Decomposer | Yes | Current vs desired state analysis |
| Frontend Tasks | `dev/wake-order-frontend/wake-order-frontend-tasks.md` | Feature - Decomposer | Yes | Stages 1–5 tasks unchecked — see Finding #1 |
| Frontend Implementation Record | `dev/wake-order-frontend/wake-order-frontend-implementation.md` | Feature - Implementer | Yes | All 14 ACs "Done", 340 passed |
| Frontend Review Record | `dev/wake-order-frontend/wake-order-frontend-review.md` | Feature - Reviewer | Yes | Verdict: Approved, 3 Low issues (all Open) |
| Frontend QA Plan | `dev/wake-order-frontend/wake-order-frontend-qa.md` | Feature - QA Writer | Yes | Release version with manual QA checklist |
| Frontend Coverage Map | `dev/wake-order-frontend/wake-order-frontend-coverage-map-qa.md` | Feature - QA Writer | Yes | AC → automated/manual coverage mapping |

**Note on backend documents**: The backend feature was fully implemented before this pipeline run. The plan, context, and tasks documents serve as the specification and implementation record. No formal implementation record, review record, or QA plan were produced by the pipeline for the backend — verification relies on automated tests (241 passing) and direct code inspection during this analysis.

---

## Traceability Matrix: Phase SC → Implementation

| SC | Description | Plan AC | Impl Status | Code Verified | Tests Pass | QA Coverage | Verdict |
|----|-------------|---------|-------------|---------------|------------|-------------|---------|
| SC1 | GameSetup "Next" navigates to `/games/new/wake-order` with state | FE-AC1 | Done (pre-existing) | `useGameSetup.ts:106-115`, `GameSetup.tsx:276-284` | ✓ | Automated | **OK** |
| SC2 | Only waking roles shown (`wake_order > 0`) | FE-AC3 | Done | `WakeOrderResolution.tsx:101` | ✓ | Automated | **OK** |
| SC3 | Roles grouped by `wake_order` with group headers | FE-AC5 | Done | `WakeOrderResolution.tsx:187-203` | ✓ | Automated + Manual (visual) | **OK** |
| SC4 | Duplicate copies → one tile | FE-AC4 | Done | `WakeOrderResolution.tsx:97-99` | ✓ | Automated | **OK** |
| SC5 | Random shuffle within groups on load | FE-AC6 | Done | `WakeOrderResolution.tsx:43-49, 118` | ✓ | Automated (20-render probabilistic) | **OK** |
| SC6 | Users can drag to reorder within group | FE-AC7 | Done | `WakeOrderResolution.tsx:127-137, 197-203` | Manual only | QA Plan item 2 | **OK** |
| SC7 | Tiles cannot drag across group boundaries | FE-AC8 | Done | `WakeOrderResolution.tsx:127-137` (separate SortableContext per group) | Structural ✓ | QA Plan item 2 | **OK** |
| SC8 | "Start Game" enabled immediately | FE-AC9 | Done | `WakeOrderResolution.tsx:168` | ✓ | Automated | **OK** |
| SC9 | "Start Game" creates game with `wake_order_sequence` and navigates | FE-AC10 | Done | `WakeOrderResolution.tsx:146-162` | ✓ | Automated + QA Plan item 3 | **OK** |
| SC10 | Tiles show role name + team-colored border | FE-AC11 | Done | `WakeOrderResolution.tsx:55-76` | Partial ✓ (border presence) | QA Plan item 1 (visual) | **OK** |
| SC11 | `POST /api/games` accepts `wake_order_sequence` | BE-AC5 | Done | `game_service.py:185-191`, `game.py:18` | ✓ (241 backend) | Automated | **OK** |
| SC12 | `POST /api/games` rejects invalid sequences | BE-AC6,7,8,13 | Done | `game_service.py:137-183` | ✓ | Automated | **OK** |
| SC13 | `generate_night_script()` uses sequence when present | BE-AC10 | Done | `script_service.py:107-124` | ✓ | Automated | **OK** |
| SC14 | `generate_night_script()` falls back when null | BE-AC11 | Done | `script_service.py:126-138` | ✓ | Automated | **OK** |
| SC15 | Doppelganger/Copycat seed `wake_order: 1` | BE-AC4 | Done | `seed/roles.py:419` (Doppelganger), `seed/roles.py:482` (Copycat) | ✓ | Automated | **OK** |
| SC16 | Direct nav without state → redirect | FE-AC12 | Done | `WakeOrderResolution.tsx:87-89` | ✓ | Automated | **OK** |

**Result: All 16 SCs are implemented, code-verified, and covered.**

---

## Findings

### Cross-Document Issues

| # | Finding | Severity | Documents Involved | Evidence | Recommendation |
|---|---------|----------|--------------------|----------|----------------|
| 1 | Frontend tasks file (`wake-order-frontend-tasks.md`) shows Stages 1–5 items as unchecked `[ ]`, despite implementation record confirming all ACs as "Done" and tests passing | Medium | Tasks, Implementation Record | Tasks file Stage 1 items all `[ ]`; impl record shows all "Done"; code matches impl record | Update tasks file to check all completed items |
| 2 | No formal implementation record, review record, or QA plan exists for backend feature | Medium | Backend plan, context, tasks | Backend was pre-implemented; pipeline only produced plan/context/tasks docs | Acceptable — backend is fully tested (241 passing). Document this as a known pipeline gap for pre-existing features. |
| 3 | Review open issue #1 (single-item groups show `cursor: grab`) not explicitly called out in QA plan | Low | Review, QA Plan | Review issue #1 references `WakeOrderResolution.tsx:68`; QA plan Note mentions it but QA item "Single-role group drag attempt" covers the scenario | No action needed — QA plan covers the behavioral aspect |
| 4 | Review open issue #2 (redundant Wake #N badge on tiles alongside group headers) not tested | Low | Review, QA Plan | Review mentions each tile shows badge + group header shows same info | Defer — reviewer classified as Low, QA plan item 1 "Verify tile content" covers visual inspection |

### Implementation Issues

| # | Finding | Severity | File:Line | Evidence | Recommendation |
|---|---------|----------|-----------|----------|----------------|
| 5 | `cursor: grab` on single-item group tiles (no reordering possible) | Low | `WakeOrderResolution.tsx:68` | `SortableTile` always sets `cursor: 'grab'`, even when it's the only tile in its group | Cosmetic; defer to next cleanup (acknowledged in review) |
| 6 | No `useMemo` on `wakingRoles`, `roleById`, `sortedGroupKeys` derivations | Low | `WakeOrderResolution.tsx:91-117` | All three are recomputed on every render from immutable Router state | No performance impact for small datasets; reviewer acknowledged and accepted |

### QA Plan Issues

| # | Finding | Severity | QA Item | Evidence | Recommendation |
|---|---------|----------|---------|----------|----------------|
| 7 | QA plan does not include a test for verifying the Alembic data migration (Doppelganger/Copycat fix) on an existing database | Low | — | Phase spec calls for Alembic data migration; QA plan only covers frontend manual testing | Backend migration is covered by automated seed tests (`test_seed.py`). No manual QA needed. |
| 8 | QA plan item 3 ("Verify wake order in facilitator") may be difficult to verify — facilitator page shows the night script, which requires reading action order | Low | QA item 3: "Verify wake order in facilitator" | No explicit instruction on how to verify ordering on the facilitator page | Add a note: check the narrator script action list order matches the Review Wake Order page sequence |

---

## Risk Register

| # | Risk | Likelihood | Impact | QA Detection | Recommendation |
|---|------|-----------|--------|--------------|----------------|
| 1 | Cross-group drag not properly constrained at runtime | Low | Medium | Yes (QA Plan item 2) | Covered by manual QA "Cross-Group Constraint" checklist item |
| 2 | `shuffleArray` produces identical results across loads (poor randomness) | Very Low | Low | Yes (automated: 20-render test) | No action — Fisher-Yates with Math.random() is sufficient |
| 3 | Router state lost on page refresh → redirect loop | Low | Low | Yes (QA Plan item 3: "Direct URL access") | Covered — this is documented as expected MVP behavior |
| 4 | Game creation payload `wake_order_sequence` format mismatch with backend | Very Low | High | Yes (automated: both frontend and backend tests verify UUID string format) | No action — both sides tested |
| 5 | Tasks file not updated → confusion for future contributors | Medium | Low | No | Update tasks file (see Finding #1) |

---

## Conditions (GO WITH CONDITIONS)

1. **Tasks file documentation gap** — `dev/wake-order-frontend/wake-order-frontend-tasks.md` should be updated to check off completed items (Stages 1–5) to match implementation reality. This is a documentation-only fix and does not block QA execution. Monitor during QA to ensure no one is confused by the incomplete checklist.

2. **QA item 3 clarification** — When executing QA Plan item 3 ("Verify wake order in facilitator"), the tester should verify the night script action order by comparing it against the tile order on the Review Wake Order page. The facilitator's narrator script should call roles in the same sequence shown on the review page (within-group reordering preserved, groups in ascending wake_order order).

---

## Recommendations

Ordered by priority:

1. **Update frontend tasks file** — Check off all completed items in `dev/wake-order-frontend/wake-order-frontend-tasks.md` Stages 1–5 to match the implementation record. (Low effort, prevents confusion.)

2. **Proceed to manual QA** — Execute the QA plan at `dev/wake-order-frontend/wake-order-frontend-qa.md`. Focus on drag-and-drop interactions (Section 2), the end-to-end flow (Section 3), and visual appearance (Section 1).

3. **When executing QA item 3** ("Verify wake order in facilitator"), navigate through the full flow: GameSetup → Review Wake Order → reorder at least one tile → Start Game → verify the night script action order matches the reordered sequence.

4. **Defer review open issues #1–#3** to the next cleanup pass, as classified by the reviewer. None affect functionality.
