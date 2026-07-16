# Review Record: AbilitiesStep Component Decomposition

## Summary

Reviewed the decomposition of `AbilitiesStep.tsx` (440 → 160 lines) into `AbilityPalette`, `StepList`/`ReadOnlyStepList`, and `StepParameterInputs`, committed at `132e9fd`.

The implementation is faithful. Every claim in the implementation record was verified, and the two highest-risk ones were verified **by execution and mutation testing** rather than by reading. All seven handlers are byte-identical to the post-06 parent (`907d2bb`), all five UI guards moved intact, no memoization was introduced, and the anchor is provably unmodified.

One real gap was found and fixed: the reference-identity no-op contract — the single highest-risk regression in this feature — had **zero execution coverage**. A mutation test proved the guard could be deleted entirely with all 46 existing tests still green. That hole is now closed.

**Note on baseline**: the orchestrator's stated baseline `19b4520` is *pre-feature-06* and has the guards inline (`if (index === 0) return;`). The correct comparison point for this feature is the post-06 parent `907d2bb`, which is what behavior parity was judged against.

## Verdict

**Approved**

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Met | `AbilityPalette.tsx`, `StepList.tsx`, `StepParameterInputs.tsx`, `AbilitiesStep.tsx:130-159` | Three seams extracted; container is early-returns + 7 handlers + composition. `StepParameterInputs` name preserved per plan. |
| AC2 | Met (verified) | `AbilitiesStep.tsx:3-10` sole importer | Grep confirms only the container imports `domain/abilitySteps`; children import only readonly `domain/constants`. Boundary rule fires (see Issue #2). |
| AC3 | Met (verified) | all four `steps/*.tsx` | `wc -l`: 160 / 104 / 158 / 120. All under 200. |
| AC4 | Met, deviated | anchor + 3 new files | Anchor byte-identical (blob `c095f30` at both `19b4520` and `132e9fd`). 29 → 75 tests, zero assertions lost. Satisfied by addition not relocation — deviation judged **correct**, with a caveat (see Issue #1). |
| AC5 | **Partially verified** | `Wizard.tsx` unchanged | Suite parity verified by execution: 524 passed / 3 failed, the 3 being the known `useRoles` baseline failures. **The "renders and operates identically" clause remains unverified** — it requires a manual wizard walkthrough that static review and RTL cannot supply. See Remaining Concerns. |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | Reference-identity no-op contract had zero execution coverage; guard deletable with all 46 tests green | High | `AbilitiesStep.tsx:101-111` | AC4/AC5 | **Fixed** |
| 2 | feature-03 `no-restricted-imports` boundary rule fires on new files | — (verified, no defect) | `eslint.config.js:56-70` | AC2 | Verified |
| 3 | `ReadOnlyStepList` as second export rather than `readOnly` prop | — (judged coherent) | `StepList.tsx:146` | AC1 | Wont-Fix |
| 4 | AC5 manual QA not performed | Low | — | AC5 | Open |

### Issue #1 detail — the one real finding

The container signals no-ops via reference identity (`if (steps === draft.ability_steps) return;`). The implementer preserved this correctly. But it was untested, and the buttons that would trigger it are `disabled`, so the guard is unreachable through the DOM — meaning nothing in the suite pinned it.

Proven by mutation: deleting the `handleMoveUp` guard produced **46/46 passing** across the anchor (29) and `StepList.test.tsx` (17). A future refactor could drop the guard or add a `useMemo` and fire spurious `onChange` calls — dirtying the draft on every no-op click — with a fully green suite.

This materially qualifies the premise that the unmodified anchor is the strongest drift evidence. It is strong evidence for *rendered behavior* parity; it is **no evidence at all** for the no-op contract.

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-frontend/src/test/AbilitiesStepNoOpContract.test.tsx` | **New file, 4 tests.** Mocks `StepList` to capture container props and invoke `onMoveUp(0)` / `onMoveDown(last)` directly — reaching the guard the DOM cannot. Asserts zero `onChange` on both no-op paths, and that real reorders still fire exactly one `onChange` with correctly renumbered steps (so the test cannot pass by simply never firing). Mutation-verified: fails when the guard is removed, passes when restored. | #1 |

No source files were modified. The anchor was not touched. Both mutation probes were reverted and the working tree confirmed clean (`git status` shows only the new test file).

## Judgements Requested by the Orchestrator

**#3 — anchor deviation (addition vs. relocation): correct call, agree.** An unmodified anchor with a matching blob hash is a stronger, cheaper-to-audit parity signal than a split one, and relocation would have risked exactly the assertion loss AC4 guards against. The AC's measurable bar (per-seam files exist, count ≥ baseline, zero assertions lost) is met and exceeded. Caveat: its evidentiary strength is narrower than assumed — see Issue #1. Recommend not relocating.

**#5 — `ReadOnlyStepList` as a second export: coherent, keep.** A `readOnly` prop would force all seven interactive callbacks optional, weakening the type contract on the common path to serve the rare one, and would push a conditional through the render body. Two small components sharing file-local styles is the simpler shape and is behavior-identical. This also matches how the container consumes them: two distinct call sites on two mutually exclusive branches.

**#4 — the 46 new tests have teeth.** They assert rendered behavior via role queries, exact callback payloads (`toHaveBeenCalledWith(1, 'or')`, `(0, 'count', '5')`), reflected input values, and negative assertions (`queryBy...not.toBeInTheDocument`). Notably they pin the raw-uncoerced-value contract at the seam — `onParameterChange(0, 'count', '5')` as a string — which is what keeps coercion in the domain layer. No shape/smoke checks found.

## Remaining Concerns

- **Issue #4 (AC5 manual QA)** — Low. The wizard "renders and operates identically" clause is **unverified**; it needs a human walkthrough (create a role, 3+ categories, edit each input kind, reorder/remove, check the review step). Proxy evidence is strong (unmodified anchor, unchanged `Wizard.tsx`, identical props contract) but proxy is not observation.
- **Domain sharp edges remain unhardened** by design (owned by feature 06). Verified all are UI-unreachable: out-of-range indices cannot occur because every index originates from `steps.map((step, index))`; `handleParameterChange`'s unguarded `draft.ability_steps[stepIndex]` read is baseline and in-range by construction. The readonly cast in `moveStepUp`/`moveStepDown` *is* the no-op signal and must not be "fixed" without updating the container.

## Test Coverage Assessment

- **Covered**: AC1 (per-seam isolation suites), AC2 (raw-value emission at seams + grep + lint rule), AC3 (line counts), AC4 (75 tests, anchor intact), AC5 (suite parity).
- **Newly covered by this review**: the container's no-op reference-identity contract (AC4/AC5) — previously zero coverage.
- **Missing**: manual wizard QA (AC5). No integration test asserts the palette tab state survives step add/remove (plan §B calls this out); the container owns `activeCategory` and the anchor exercises tabs and adds separately, but not the interaction between them.

## Risk Summary

- `AbilitiesStep.tsx:101-111` — the no-op guards are load-bearing, DOM-unreachable, and invisible to type checking. Now pinned by `AbilitiesStepNoOpContract.test.tsx`; that test must not be deleted as "redundant."
- The `domain/abilitySteps` reference-identity convention is an implicit contract between two files with no type-level expression. Any future memoization in this tree can silently break it.
- `StepList.tsx:114` now reads `steps.length` (prop) rather than `draft.ability_steps.length` — same array, same value, verified equivalent. Benign, but it is the one place the split changed an expression rather than moving it.
- Feature 12 owns test structure and may consolidate the new test files; the no-op contract test should survive any such consolidation.
