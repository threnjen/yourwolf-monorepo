# Review Record: Frontend Pure Game-Rule Modules

## Summary

Reviewed commit `cfdda19` against baseline `19b4520`. This is a faithful extraction, not a redesign. I independently verified all six behavior-preservation claims the implementation record makes, including the two that carry the most risk (reference-identity no-ops and unmodified regression anchors). Both hold.

The extraction's correctness evidence rests on two legs, and both are sound:

1. **The three regression-anchor test files are genuinely unmodified.** `git diff 19b4520..cfdda19` over those three paths returns empty. They pass as-is. This is the strongest available evidence of zero behavior drift, and it is real.
2. **The domain code is a line-by-line mirror of the baseline React code.** I diffed every extracted rule against `git show 19b4520:<path>` and found no semantic divergence — including the parts that look like bugs (they are baseline bugs, faithfully preserved).

One genuine gap found and fixed: a **documented** cascade behavior ("one-way and single-level") had no test pinning it. That is precisely the kind of hole that lets Phase 04's engine silently diverge, since the docstring describes behavior a reasonable engine author might "improve." Added a test.

Verification performed (not inferred):
- Full suite executed: **474 passed / 3 failed** — the 3 are the known pre-existing `useRoles.test.ts` failures. No new failures.
- `npx tsc --noEmit` executed: only the known baseline `Wizard.test.tsx(242) TS6133`. Nothing else.
- `npm run lint` executed: 2 pre-existing errors, both in untouched files. `npx eslint src/domain src/types` clean.
- **Lint boundary proved empirically**, not just by config inspection: I wrote a throwaway `src/domain/__lintprobe.ts` importing `react`, `../api/games`, and `../styles/theme`; ESLint emitted 3 `no-restricted-imports` errors and exited 1. Probe deleted. The rule fires on these files — it does not silently skip them.

## Verdict

**Approved**

## Claim Verification

The review brief asked six claims to be checked. All six verified.

| # | Claim | Result | How verified |
|---|-------|--------|--------------|
| 1 | Domain no-ops return the same reference; components genuinely skip `onChange` | **Holds** | Enumerated *every* no-op path. `toggleRoleSelection` (unknown role), `adjustRoleCount` (unknown role, max reject), `moveStepUp` (index 0), `moveStepDown` (index length-1) all return the input reference — matching baseline's `return prev` / bare `return`. `AbilitiesStep.tsx:305-315` guards with `if (steps === draft.ability_steps) return;` before `updateSteps`, so no `onChange` fires. Not half-right: the identity contract is also **pinned by tests** (`toBe()` reference assertions at `roleSelection.test.ts:72,217,237` and `abilitySteps.test.ts:249,268`). |
| 2 | All three anchors pass unmodified | **Holds** | `git diff 19b4520..cfdda19 -- <3 anchor paths>` → empty. Only new test files added in range. Evidence is intact. |
| 3 | AC3's wider scope was necessary, rule now single-sourced | **Holds — necessary, not scope creep** | Baseline `AbilitiesStep.tsx` inlined the identical renumber map in `handleRemoveStep`, `handleMoveUp`, `handleMoveDown` (3 copies) plus the same rule as `nextOrder === 1 ? 'none' : 'and'` in `handleAddAbility`. Leaving add/remove inline would have left the AC3 rule duplicated in the component, defeating the AC. `grep -rE "order: i \+ 1\|modifier === 'none'"` outside `src/domain`/`src/test` → zero hits. Genuinely single-sourced. |
| 4 | `collectWakingRoles` marks seen before role-exists check, mirroring original | **Exact mirror** | Baseline: `seen.add(roleId)` then `state.roles.find(...)`. New (`wakeOrder.ts:41-43`): `seen.add(roleId)` then `roles.find(...)`. Identical ordering, identical skip conditions (`count <= 0`, `!role || !role.wake_order || role.wake_order <= 0`), identical projection and sort. |
| 5 | `shuffleArray` RNG injectable/deterministic; 102 tests are real | **Holds** | `shuffleArray(arr, rng: RandomFn = Math.random)`; `buildGroupOrders` threads `rng` through. Tests use a `scriptedRng([...])` replay stub and assert **hand-computed Fisher-Yates output** (`shuffleArray(['a','b','c'], () => 0)` → `['b','c','a']`), not shape checks. Also pins within-group-only shuffling, immutability, and the `Math.random` default. These are real assertions. |
| 6 | Boundary rules fire on the new domain files | **Holds — proved empirically** | Config resolves (`eslint --print-config src/domain/wakeOrder.ts` shows both patterns), *and* a live probe file triggered all 3 expected errors. Not a silent skip. |

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Met | `src/domain/roleSelection.ts`, `src/hooks/useGameSetup.ts:38-50` | Cascade/toggle/quantity rules mirror baseline exactly. Hook is a thin adapter; rule bodies gone. Verified against `git show 19b4520:src/hooks/useGameSetup.ts`. |
| AC2 | Met | `src/domain/wakeOrder.ts`, `src/pages/WakeOrderResolution.tsx:78-119` | Collect/group/shuffle/flatten/expand all extracted. `shuffleArray` out of the page with injectable RNG defaulting to `Math.random` (finding 1.4). |
| AC3 | Met | `src/domain/abilitySteps.ts`, `AbilitiesStep.tsx:283-331` | Renumber + modifier normalization + parameter coercion extracted; scope correctly widened (see claim 3). |
| AC4 | Met | `src/hooks/useGameSetup.ts:54-60`, `src/pages/GameSetup.tsx:106-109` | No `NavigateFunction` param, no `react-router` import in the hook, no hardcoded route. `wakeOrderPayload` null iff `!canStart`, so the page's `if (!wakeOrderPayload) return;` is exactly equivalent to baseline's `if (!canStart) return;`. |
| AC5 | Met | `src/types/routerState.ts` | Declared once; imported by producer (`useGameSetup`) and consumer (`WakeOrderResolution`). Local duplicate deleted from the page. Producer/consumer drift is now a compile error. Runtime validation remains out of scope (see Remaining Concerns). |
| AC6 | Met | 3 new test files | 102 tests + 1 added in review = 103. Zero RTL, zero React imports. Covers cascade add/remove, RNG-injected determinism, renumber/modifier rules — all three named scenarios. |
| AC7 | Met (scope note) | full suite | **Executed**: 474 passed / 3 failed, same 3 pre-existing failures. No new failures. "Observable UI behavior unchanged" is verified to the extent the three RTL anchor suites cover it (substantial — 485-line `GameSetup.test.tsx` among them) plus static mirror comparison. Not verified by running the app; no visual check was performed. Given the diff touches only handler bodies and no styling, I consider the residual risk low. |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Documented "one-way and single-level" cascade had no test. A transitive dependent is left orphaned (A requires B, C requires A; removing B drops A but keeps C). Docstring asserts this; nothing enforced it. Highest-value gap — Phase 04 could silently "fix" it into a transitive cascade. | Medium | `src/domain/roleSelection.ts:24-28` | AC1, AC6 | **Fixed** |
| 2 | `setStepModifier(steps, 0, 'or')` can set a non-`none` modifier on the first step, violating the invariant `renumberSteps` enforces. Mirrors baseline; unreachable in UI (`AbilitiesStep.tsx:386` guards the select with `index > 0`). | Low | `src/domain/abilitySteps.ts:131-137` | AC3 | Open (deliberate) |
| 3 | `moveStepUp`/`moveStepDown` with an out-of-range index corrupt the list rather than no-op (destructuring swap extends the array with `undefined` holes, which `renumberSteps` then spreads into junk steps). Mirrors baseline exactly; unreachable via UI. | Low | `src/domain/abilitySteps.ts:110-123` | AC3 | Open (deliberate) |
| 4 | `moveStepUp`/`moveStepDown` take `readonly AbilityStepDraft[]` but return `AbilityStepDraft[]` via an `as` cast, handing back a mutable-typed alias to the caller's readonly array. Type-level unsoundness, load-bearing for the identity contract. | Low | `src/domain/abilitySteps.ts:111,119` | AC3 | Open |
| 5 | `removeRoleWithCascade` returns a *new* object even when nothing changed (removing an unselected id), unlike its identity-preserving siblings. Mirrors baseline; costs one redundant re-render. | Low | `src/domain/roleSelection.ts:34-35` | AC1 | Open (deliberate) |

**On issues 2, 3, and 5 — why I did not "fix" them.** All three faithfully mirror baseline behavior and are unreachable through the current UI. This feature's entire correctness argument is that it is a bit-for-bit mirror, evidenced by unmodified anchors. Hardening these paths would diverge the domain from the baseline it is being validated against, weaken that evidence chain, and violate the plan's explicit directive in section D ("Extract, don't redesign. Resist adding engine features early."). They are contract notes for Phase 04 / feature 08 — recorded in `cross-phase-decisions.md` — not defects to patch here. Issue 1 was different and worth fixing precisely because it adds evidence without changing behavior.

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-frontend/src/test/roleSelection.test.ts` | Added `cascades one level only, leaving a transitive dependent orphaned` — pins the documented single-level cascade with an A→B / C→A chain, and comments *why* it is pinned so Phase 04 treats any change as a conscious decision. Behavior confirmed by execution before writing the assertion. | 1 |

Suite after fix: **474 passed / 3 failed** (3 known pre-existing). `tsc` and `lint` unchanged from baseline.

## Remaining Concerns

- **Issue 2, 3, 4** — latent contract sharp edges in `domain/abilitySteps.ts`, all unreachable today but consumed directly by feature 08 and Phase 04's engine, which have no UI guards. Recorded in `cross-phase-decisions.md`.
- **`WakeOrderRouterState` is compile-time only** (implementation record's own stated gap, accurately disclosed). The consumer's `as` cast is unvalidated, so malformed router state fails late. This is the audit's stated *minimum* fix for finding 4.1 and matches the plan's non-goals; deferred to Phase 04.
- **AC7's "observable UI behavior is unchanged"** is evidenced by the unmodified RTL anchors plus static mirror comparison, not by running the application. No visual confirmation was performed and none was required by the AC's test plan.
- Baseline debt untouched and correctly scoped to feature 12: 3 `useRoles.test.ts` failures, `Wizard.test.tsx` TS6133, `useRoles.ts` unknown-rule lint error.

## Test Coverage Assessment

- **Covered**: AC1 (cascade add/remove/quantity, incl. one-way, transitive-orphan, immutability, identity), AC2 (shuffle determinism with injected RNG, within-group-only, collect/group/flatten/expand), AC3 (renumber, modifier normalization, coercion, append/remove/move/set, identity no-ops, immutability), AC4 (page-level nav via unmodified `GameSetup.test.tsx:393-439`), AC5 (tsc), AC6, AC7 (full suite).
- **Missing / not applicable**:
  - The component-level `onChange`-skip guard (`AbilitiesStep.tsx:307,313`) is not covered by an RTL test because the buttons are `disabled` at the ends, making it unreachable through the UI. Verified by inspection; the underlying domain identity contract *is* unit-tested. Acceptable — testing it would require reaching past a disabled control.
  - No test injects an RNG into `WakeOrderResolution` itself (the page calls `buildGroupOrders(wakingRoles)` with the default). Correctly out of scope: AC2 asks for determinism in the *domain* tests, which is satisfied, and the anchor page test passes unmodified.

## Risk Summary

- **Low overall risk.** This is the cleanest kind of refactor: exact mirror, anchors untouched and passing, rules single-sourced, boundary enforcement empirically proven. The claims in the implementation record were accurate under scrutiny — including the subtle reference-identity one, which was implemented *and* test-pinned rather than half-done.
- `src/domain/abilitySteps.ts` carries three preserved baseline sharp edges (issues 2-4) that are inert behind UI guards today but become live surface the moment feature 08 or the Phase 04 engine calls these functions directly. Flagged forward rather than silently patched.
- The `renumberSteps` / `setStepModifier` invariant split is the single most likely source of future engine drift: one function enforces "first step is always `none`" and the other can break it. Documented.
- Deviations in the implementation record (shuffle home, wider AC3 scope, injectable `IdFactory`) were all checked and are well-reasoned; none is scope creep.
</content>
