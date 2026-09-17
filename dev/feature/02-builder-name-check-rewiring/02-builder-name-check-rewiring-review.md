# Review: 02 Builder and Name Check Rewiring

## Verdict

**PASS.** All nine planned acceptance criteria are satisfied by the selected six files. The review found four plan-conformance defects or coverage gaps. All four were repaired in one review round. No unfixed findings remain.

The review covered implementation commit `9c82097` against the plan, selection delta, execution manifest, and baseline commit `8bbe2b5`. The review stayed in the `plan-conformance` lane.

## Acceptance Criteria Evidence

| AC | Status | Exact evidence |
|----|--------|----------------|
| AC1 | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx:41-75` calls `buildPreview` and `validateRoleDraft` from the local path under one 1000 ms timer. `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:87-104` proves the 999 ms boundary and local preview output. |
| AC2 | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx:36-39` requires both catalogs to be ready. `yourwolf-frontend/src/pages/RoleBuilder.tsx:63-89` suppresses validation while unavailable, clears stale validation on a readiness loss, and validates the current draft on readiness. `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:114-160` covers startup gating, latest-draft readiness, and preview independence during a catalog loss. |
| AC3 | Complete | `yourwolf-frontend/src/pages/RoleBuilder.tsx:68-73` composes the collision with the domain result and suppresses it outside the trimmed 2–50 range. `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:162-178` covers combined errors, while `:203-238` covers padded 51-character and one-character collision precedence. |
| AC4 | Complete, with planned frontend divergences | `yourwolf-frontend/src/domain/roleValidation.ts:28-32` supplies the literal lower and frontend-only upper name errors. `yourwolf-frontend/src/pages/RoleBuilder.tsx:68-73` preserves domain errors and warnings and contains no service-unavailable fallback. `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:180-201` proves warning propagation. The 23-test oracle at `dev/feature/test-results/PHASE_05B-02-builder-oracle-review-frontend.xml` covers the literal error and warning contract. The local collision wording and 50-character rule are the plan's documented divergences. |
| AC5 | Complete | `yourwolf-frontend/src/hooks/useNameCheck.ts:20-58` derives `NameStatus` from the supplied local list with the shared trimmed, case-insensitive collision helper. `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts:37-53` covers private and official collisions, and `:88-105` covers catalog changes. |
| AC6 | Complete | `yourwolf-frontend/src/hooks/useNameCheck.ts:46-58` retains the 500 ms debounce, request-id invalidation, and cleanup. `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts:74-147` covers rapid names, short and disabled states, catalog changes, and unmount cleanup. Page preview freshness and unmount cleanup are covered at `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:106-112` and `:308-317`. |
| AC7 | Complete | `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx:1-12,75-81` has no runtime hook or repository import and requires the supplied status. `yourwolf-frontend/src/pages/RoleBuilder.tsx:39,138-147` is the production owner. `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx:58-70` covers every supplied status. |
| AC8 | Complete | `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx:178-183` retains the button gate. `yourwolf-frontend/src/pages/RoleBuilder.tsx:100-125` retains the handler gate and the immediate list collision recheck. `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:240-298` covers all three defenses, persistence failure, and success. The consumer gate suite also covers invalid, null, omitted-status, and saving states at `yourwolf-frontend/src/test/components/RoleBuilder/Wizard.test.tsx:142-220`. |
| AC9 | Complete | The focused, consumer, oracle, full, and coverage suites all finished `executed-green` in the evidence table below. The Wizard and ReviewStep sources remained read-only regression anchors. |

Missing criteria: none. Partial criteria: none. Unverified criteria: none for this feature's automated scope. The optional manual browser QA was disabled by the caller and remains a later phase deliverable. Planned divergences are limited to AC4's frontend upper-bound message and AC5's local collision semantics.

## Findings and Repairs

### F-01 — Debounced validation used stale catalog readiness

- **severity:** medium
- **lane:** plan-conformance
- **evidence:** The implementation callback captured `catalogsReady`, `roles`, and `abilities`. A draft timer scheduled while catalogs were ready could validate after a catalog became unavailable, violating AC2. The regression at `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:146-160` reproduced the invalid result before repair.
- **reviewer:** `03c-reviewer-plan-conformance`
- **repair:** `yourwolf-frontend/src/pages/RoleBuilder.tsx:32-35,63-89` now reads the latest catalogs through refs, checks the current readiness ref inside the timer, and clears published validation when readiness is lost. The timer remains shared with preview so preview generation stays independent.
- **proof:** The focused suite is `executed-green`, including the catalog-loss regression and latest-draft readiness test.

### F-02 — The page rewrite dropped retained local behavior and failure-power checks

- **severity:** medium
- **lane:** plan-conformance
- **evidence:** The three page tests fell from 12 cases at baseline to 8 at implementation commit `9c82097`. The server fallback, 422 body, and late server-response cases were correctly obsolete, but the rewrite also omitted the retained local persistence failure, non-waking preview, rapid newest preview, warning propagation, lower-bound collision precedence, repeated handler gate, and timer cleanup checks. Baseline persistence behavior is visible at `git show 8bbe2b5:yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:134-145`.
- **reviewer:** `03c-reviewer-plan-conformance`
- **repair:** Added the retained persistence and preview checks at `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx:277-317`, warning propagation at `:180-201`, lower-bound precedence at `:221-238`, repeated handler gating at `:254-275`, and unmount/readiness checks at `:106-160`. The source guard and collision bounds remain at `yourwolf-frontend/src/pages/RoleBuilder.tsx:63-73`.
- **proof:** Temporary negative probes removing the readiness guard, changing the lower bound from `>= 2` to `>= 1`, and changing the upper bound from `<= 50` to `<= 51` each failed the new regression assertions. The original guards were restored before the final suites.

### F-03 — The local name-check rewrite lacked catalog-change and cleanup guards

- **severity:** medium
- **lane:** plan-conformance
- **evidence:** The hook rewrite removed server-only request and promise cases, but its implementation test at `9c82097` did not prove that a changed local role catalog rechecks a settled name, that disabling checking removes pending work, or that unmount removes the timer. Those are required by AC5 and AC6.
- **reviewer:** `03c-reviewer-plan-conformance`
- **repair:** Added catalog-key rechecking, disabled-state timer invalidation, and explicit timer-count cleanup assertions at `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts:88-147`. The implementation uses `rolesKey` and cleanup at `yourwolf-frontend/src/hooks/useNameCheck.ts:30-58`.
- **proof:** A mutation removing `rolesKey` from the effect dependencies left the catalog-change test at `available` instead of `taken`. The dependency was restored, and the final hook suite is green.

### F-04 — The BasicInfo rewrite collapsed retained field coverage and shared mock state

- **severity:** low
- **lane:** plan-conformance
- **evidence:** The step suite fell from 28 baseline cases to 9 implementation cases. It no longer independently pinned all five team buttons and selections, current draft values, the wake-order range label, all eligible and ineligible primary-role states, wake-order clearing, or every wake hint. Its shared `mockOnChange` was not cleared between tests, allowing a prior call to satisfy a later assertion.
- **reviewer:** `03c-reviewer-plan-conformance`
- **repair:** Restored the retained behavior assertions at `yourwolf-frontend/src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx:23-167` and clears the shared mock in `:9-11`. The presentational source remains unchanged and requires the page-owned status at `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx:8-12`.
- **proof:** The final step suite returns to 28 cases and passes. The range-label assertion is at `BasicInfoStep.test.tsx:53-56`, all team selections at `:90-104`, and wake hints at `:156-167`.

## Test-Count Reconciliation

The baseline artifact at commit `8bbe2b5` reports 738 frontend tests. The implementation artifact reports 712. The review final reports 741. The 26-test implementation drop exactly matches the three rewritten suites' drop from 53 to 27 cases. The review adds 29 cases, restoring retained behavior and adding the missing guards, so the final count is baseline plus three rather than a loss of coverage.

| Suite | Baseline at `8bbe2b5` | Implementation `9c82097` | Review final | Reconciliation |
|-------|-----------------------|---------------------------|--------------|----------------|
| `RoleBuilder.test.tsx` | 12 | 8 | 16 | The 2 server-validation, 1 late-server-response, and other obsolete request assertions were removed. Persistence, local preview, readiness, warning, collision-precedence, save-gate, and cleanup checks were restored or added. |
| `useNameCheck.test.ts` | 13 | 10 | 12 | API-call, request-failure, and late-server-promise cases were removed. Local 500 ms status, private/official collisions, rapid input, readiness, catalog changes, disabled state, and cleanup remain. |
| `BasicInfoStep.test.tsx` | 28 | 9 | 28 | Fallback-hook request cases were replaced with supplied-status cases. Field, team, toggle, range, clearing, and hint contracts were restored. |
| Three rewritten suites | 53 | 27 | 56 | `27 - 53 = -26`, then `56 - 27 = +29`. |
| Full frontend suite | 738 | 712 | 741 | `712 - 738 = -26`, then `741 - 712 = +29`, for a net `+3`. |

The removed server-only cases were not silently discarded. The RoleBuilder fallback, 422 parser, and late server-response tests no longer describe the local contract. The hook's API request, request failure, and server promise cases likewise no longer apply. The BasicInfo fallback-hook cases were replaced by explicit `NameStatus` cases. The retained behavior contracts are covered by the final 56 focused tests and the 34 consumer tests.

## Test Evidence

Every authoritative frontend suite was rerun after repairs. Each result artifact reports zero failures and zero errors.

| Status | Exact command | Results artifact | Total | Passed | Failed |
|--------|---------------|------------------|-------|--------|--------|
| executed-green | `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-focused-review-frontend.xml src/test/pages/RoleBuilder.test.tsx src/test/hooks/useNameCheck.test.ts src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-focused-review-frontend.xml` | 56 | 56 | 0 |
| executed-green | `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-consumer-review-frontend.xml src/test/components/RoleBuilder/Wizard.test.tsx src/test/components/RoleBuilder/steps/ReviewStep.test.tsx` | `dev/feature/test-results/PHASE_05B-02-builder-consumer-review-frontend.xml` | 34 | 34 | 0 |
| executed-green | `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-oracle-review-frontend.xml src/test/domain/roleValidation.test.ts` | `dev/feature/test-results/PHASE_05B-02-builder-oracle-review-frontend.xml` | 23 | 23 | 0 |
| executed-green | `npm test -- --run --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-full-review-frontend.xml` | `dev/feature/test-results/PHASE_05B-02-builder-full-review-frontend.xml` | 741 | 741 | 0 |
| executed-green | `npm run test:coverage -- --reporter=junit --outputFile=../dev/feature/test-results/PHASE_05B-02-builder-coverage-review-frontend.xml` | `dev/feature/test-results/PHASE_05B-02-builder-coverage-review-frontend.xml` | 741 | 741 | 0 |

Coverage from the final coverage run is 92.69% statements and lines, 92.79% branches, and 94.16% functions. `npm run lint` exited 0. `npm run build` exited 0. No test suite was left unrun within the feature's verification assets.

## Unfixed findings

None.

## Phase Document Sync

No phase document required an edit. The repairs only refresh callback data and strengthen tests. They preserve the behavior, scope, deliverables, and planned divergences already stated in `docs/phases/PHASE_05B/PHASE_05B_SUMMARY.md:24-36,89-117`.
