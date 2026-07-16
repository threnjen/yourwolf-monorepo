# Review Record: Frontend Transport/Domain Type Split

## Summary

A genuinely clean type-only refactor. The central claim — zero runtime change across a 36-file mechanical migration — **holds under mechanical verification, not just reading**: every changed line in `components/`, `pages/`, `hooks/`, `utils/`, `styles/`, and all 17 test files is an import line. No logic, no reordering, no defaults changed. No new `as` assertions and no `any`-bridging (verified: 0 → 0 real assertions; the 9 new " as " grep hits are all prose inside doc comments).

The `RoleListItem` contradiction was the one piece of real work, and it was solved honestly. `SelectableRole`/`WakeCandidateRole` are consumer-defined projections, and I **proved structural satisfaction by compiling a type-level probe** rather than accepting the assertion — `RoleListItem` is assignable to both with no cast. This is textbook dependency inversion.

Four ESLint probes were run against a mutated tree (restored by file copy; no git state touched). Three confirmed the implementer's claims. **The fourth disproved one**: the stated rationale for the `no-restricted-imports` → `@typescript-eslint/no-restricted-imports` swap is factually false. The base rule catches `import type` fine; the actual cause of the DTO leak was that `types` was absent from the restricted groups — exactly what feature 03's reviewer had said. The rule swap is harmless and the rule fires correctly; only the comment was wrong. Fixed.

Baseline discrepancy worth recording: the brief named `3627df9` as the parent of `aba7cde`; the actual parent is `c6f601e` (`3627df9` is three commits back). Since 09/10 are backend-only, `git diff 3627df9..c6f601e -- yourwolf-frontend/` is empty, so the two baselines are equivalent for this review and no conclusion is affected.

## Verdict

**Approved** — with one Medium comment-accuracy issue fixed during review.

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Met | `src/types/transport.ts` (new), `src/domain/roleDraft.ts`, `src/types/role.ts` (deleted) | Verified: zero dangling `types/role` refs repo-wide. Name deviation (`transport.ts`) verified sound — see AC1 note below. |
| AC2 | Met | `src/domain/roleDraft.ts:11-45` | "Distinct types with documented intent" branch. **Justified, not asserted**: `api/roles.ts:99-115` verified to drop `id` from both `ability_steps` and `win_conditions`, and to normalize `condition_params ?? null`. Probe confirmed draft/transport step shapes are *currently* mutually assignable — drift is undetectable by tsc, which the record documents rather than hides. |
| AC3 | Met | all 6 `src/domain/*.ts`, `eslint.config.js:34-68` | **Stronger than claimed.** `grep` confirms `src/domain/` imports *nothing* outside `./` — not merely no transport. Boundary rule verified **by probe** (injected violating import → rule fired). |
| AC4 | Met | 36 importers + `types/routerState.ts` | `npx tsc --noEmit` → only the baseline `Wizard.test.tsx(242)` TS6133. Assertion count 0 → 0; `any` count 0 → 0. |
| AC5 | Met | 17 test files | `npx vitest run` → 524 passed / 3 failed, identical to baseline (same 3 `useRoles.test.ts` tests). Non-import diff across `src/test/` verified empty. |

### Directed-question findings

1. **Zero runtime change — VERIFIED.** Non-import diff across all UI/test layers is empty. Core diff (`domain/`, `api/`, `types/`) contains only type declarations, doc comments, and import rewrites.
2. **No `any`-bridging / new casts — VERIFIED.** 0 real `as` assertions at both baseline and head.
3. **`RoleListItem` projections — VERIFIED HONEST, not a cast in disguise.** Compiled probe proves `RoleListItem` → `SelectableRole` and → `WakeCandidateRole` structurally. Field-level confirmation: `RoleListItem.wake_order?: number` matches `WakeCandidateRole.wake_order?: number` (had it been `number | null`, this would have failed). `RoleDependency` → `RoleDependencyRule` is a valid width subtype.
4. **Whitespace incident — FULLY REMEDIATED.** `git diff --ignore-all-space --ignore-blank-lines --stat` is **byte-identical** to the plain `--stat` across all frontend files, proving every changed line is substantive and zero whitespace-only churn survives. `git diff --check` clean. The tsc error at line 242 (not 241) independently corroborates byte-parity.
5. **Retiring the seam — CORRECT; nothing broke.** Feature 03's reviewer's *substantive* goal ("`domain/` imports nothing from `types/`… lets the ESLint boundary rule be extended to restrict `types` from `domain`, closing the carve-out") is fully achieved, and their Open issue #3 (domain↔types bidirectional dependency) is now **closed**. Their reason to keep the seam was explicitly to defer the wide rewrite — which is AC4's mandate, so the seam's purpose was spent. Retaining it would have left "a pure downstream re-export surface", i.e. a barrel file, an explicit plan non-goal. Nothing broke: tsc clean, suite at baseline, zero dangling refs. The `import type`/`export type` concern is moot — no file re-exports `Team`. The implementer also correctly declined the 03 reviewer's suggestion to move `AbilityStep` into the domain; it is a genuine server shape nested in `Role`.
6. **`transport.ts` naming — RATIONALE VERIFIED REAL (by probe).** A component importing `../../types/api` genuinely trips the components block's `**/api` glob (`no-restricted-imports` fired with the "must not import src/api directly" message). The name is coherent and disambiguates from the `src/api/` HTTP layer.
7. **Boundary rules — VERIFIED BY PROBE, not by reading config.** Domain→transport fired; React and UI-layer restrictions still fire post-swap (not weakened); components `**/api` fired. Domain layer confirmed transport-free.
8. **"Imports both without converting" — ACCEPTABLE, not a leak.** See Issue #2 for the count error, but the architecture is sound: no shape *translation* occurs at those sites, only projection. `draftToPayload`/`draftToPreviewPayload` remain the sole conversion point, so AC3's actual requirement holds. `useGameSetup.ts:28` passing `RoleListItem[]` into `buildRoleMap` is dependency inversion working as designed — the domain declares the interface, the UI layer (which legitimately knows both) wires it, and any DTO drift breaks at the call site rather than silently. Self-policing.

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | ESLint rule-swap rationale is factually false. Comment claimed "the base rule's type-import handling is what let transport DTOs leak into the domain". Probe proves the base rule reports `import type` against path patterns correctly; the leak's real cause was `types` being absent from the restricted groups. Misleads maintainers into believing base `no-restricted-imports` is type-import-blind. | Medium | `eslint.config.js:37-41` | AC3 | **Fixed** |
| 2 | Implementation record's Gaps section says "4 files import from both modules… a reviewer grepping for the former will find 4 hits". Actual count is 11 (5 non-test). The omission includes `useGameSetup.ts` — the *most* architecturally interesting case, the only site where a transport DTO array flows into a domain function. | Low | record line 108 | AC3 | Open |
| 3 | Record's Gaps #2 claims "Nothing prevents a future transport type from importing a domain type cyclically (`types → domain → types`)". Understates its own protection: a cycle requires a `domain → types` edge, which the boundary rule now blocks (probe-confirmed). The rule *does* prevent this. | Low | record line 109 | AC3 | Open |
| 4 | Components block uses base `no-restricted-imports` while the domain block uses the typescript-eslint variant. Cosmetic inconsistency; both verified working. | Low | `eslint.config.js:71-83` | — | Open |

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-frontend/eslint.config.js` | Replaced the false rule-swap rationale with the verified cause (the `types` group was absent, not a type-import blind spot) and the real justification for the typescript-eslint variant (`allowTypeImports`, which the base rule lacks). Comment-only; rule behavior untouched. | 1 |

Post-fix gates re-run: lint 2 errors (baseline), tsc 1 error at `Wizard.test.tsx(242)` (baseline), vitest 524 passed / 3 failed (baseline), boundary rule still fires.

## Remaining Concerns

- Issues #2/#3 are accuracy defects in the implementation record's own Gaps section, not in code. Both are conservative-direction errors (the implementer undercounted its dual-importers and understated its own protection), so neither misleads toward risk. Left as documented findings.
- Issue #4: cosmetic; not worth churn.
- **Endorsing `buildRoleMap<T extends SelectableRole>`** (the implementer explicitly invited it to be argued down). Keep the generic. It is an identity-preserving indexing utility that performs no narrowing at runtime; returning `Record<string, SelectableRole>` would be gratuitous information loss in a function whose job is "index by id". Only one production caller exists (`useGameSetup.ts:28`) and it reads nothing beyond `SelectableRole` — so narrowing would also compile — but the generic costs nothing and is the standard shape for such helpers. Not YAGNI.
- `AbilityStepDraft` and transport `AbilityStep` are structurally identical today (probe-confirmed mutually assignable), so TypeScript cannot catch drift between them. Accepted and documented in `roleDraft.ts:15-19`, not overlooked. If the server contract diverges, the compiler will stay silent — the mapping in `api/roles.ts` is the only guard.

## Test Coverage Assessment

- **Covered**: AC1, AC2, AC3, AC4, AC5 — via tsc, the ESLint boundary rule, and the existing 527-test suite.
- **Zero new tests is correct here.** For a type-only feature the compile-level gates *are* the tests, and the boundary rule was mutation-tested. A vitest test re-checking the import graph would duplicate the linter.
- **Missing (low value)**: no automated guard that `types/role.ts` stays deleted or that the transport/domain split does not re-merge. The boundary rule covers the important direction.

## Risk Summary

- **Feature-attributable risk is very low.** No runtime surface was touched; every gate matches baseline exactly.
- `eslint.config.js:34-68` — the boundary rule is now the primary architectural guard for `src/domain` and the future `src/engine`. Verified firing on all three restricted groups. Worth re-probing whenever the rule is edited.
- `domain/roleDraft.ts` vs `types/transport.ts` — two structurally identical step/win-condition shapes intentionally kept distinct. Compiler-invisible drift is the accepted trade for the layer split; `api/roles.ts` is the only place drift would surface.
- Three baseline items (3 `useRoles.test.ts` failures, `Wizard.test.tsx(242)` TS6133, 2 lint errors) remain and belong to feature 12. Left strictly untouched, as instructed.
- No git-mutating commands were used at any point. All probes ran against file-copy backups, restored and diff-verified clean.
