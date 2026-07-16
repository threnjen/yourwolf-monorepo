# Review Record: Frontend Domain Module Foundation

## Summary

Reviewed commit `0213960` — creation of the `src/domain/` layer plus relocation of teams, ability constants, the empty-draft factory, and `capitalize` out of their previous homes, with `no-restricted-imports` boundary rules added to the flat ESLint config.

This is a disciplined, well-scoped refactor. The five teams are genuinely stated once; `MODIFIER_LABELS` duplication is gone; `theme.ts` is tokens-only. The implementation record is unusually honest — every claim I independently checked held up, including the ones that were inconvenient to the implementer (AC7 partial, build red at baseline, 4 importers not 5). I found one substantive latent issue (shared mutable domain singletons), which I fixed, and confirmed the implementer's `react-hooks` finding, which is real and more consequential than the record suggests.

**Verification honesty**: AC1–AC5 are verified at the static + unit/component-test level. I did not run the application. Runtime equivalence rests on the existing component tests (`AbilitiesStep`, `ReviewStep`, `RoleBuilder`, `RoleCard`, `Roles`, `GameSetup`), which do assert on rendered output — reasonably strong evidence for a constants-relocation change with no logic delta, but not a substitute for observing the app render. No AC here requires visual confirmation.

## Verdict

**Approved with Reservations**

Reservations are all *forward-looking notes for features 11 and 12*, not defects in this feature. Nothing here blocks. The one Medium issue found was fixed during review.

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Met | `src/domain/teams.ts:8-10`, `src/types/role.ts:1-4`, `src/utils/roleSort.ts:2-4`, `src/styles/theme.ts:1,44-52`, `BasicInfoStep.tsx:8` | Verified: five teams stated exactly once in production code. Remaining literal team arrays are test-only (`mocks.ts:38`, `BasicInfoStep.test.tsx:131`, and the intentional pins at `teams.test.ts:8` / `roleSort.test.ts:9`). `TEAM_COLORS: Record<TeamColor, string>` with `TeamColor = Team` does give tsc exhaustiveness. Order and transport strings preserved byte-for-byte. |
| AC2 | Met | `src/domain/constants.ts:36-41`, `AbilitiesStep.tsx:6`, `ReviewStep.tsx:2` | Verified by grep: exactly one definition, two importers. See "Assessment 4" re: placement. |
| AC3 | Met | `src/domain/constants.ts:3-32`, `AbilitiesStep.tsx:4,7` | Values preserved exactly and pinned by `domainConstants.test.ts`. |
| AC4 | Met | `src/domain/roleDraft.ts:4-19`, `RoleBuilder.tsx:5` | Moved verbatim. |
| AC5 | Met | `src/utils/format.ts:2-4`, `theme.ts` (no `capitalize`), 4 importers | Verified zero remaining `capitalize` imports from `styles/theme`. Implementer's "4 importers not 5" correction is right — `ReviewStep.tsx:44` is a CSS `textTransform: 'capitalize'` grep false positive. `theme.ts` exports only `theme`, `TeamColor`, `TEAM_COLORS`, `Theme`. |
| AC6 | Met — independently verified | `eslint.config.js:30-71`, `BasicInfoStep.tsx:3-7` | I did not take the record's word for this. Probed with a temp file in `src/domain/` — all 5 restricted categories fired (react, styles, api, hooks, components). Probed `src/components/` → api — fired. Both probes removed. Exemption is correctly narrow (see Assessment 2). |
| AC7 | **Partial — correctly characterized** | whole package | Test half **met**: 371 passed / 3 failed, same 3 pre-existing `useRoles.test.ts` failures, zero regressions — independently reproduced. Build half **cannot be met literally**: `npm run build` is red at *clean baseline* from `Wizard.test.tsx(242) TS6133`, independent of this work. `npx tsc --noEmit` returns that one error and nothing else — confirmed this feature's code compiles clean. Correctly deferred to feature 12. |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | De-duplication converted per-component private constant copies into **shared mutable module singletons**. `ABILITY_CATEGORIES`, `STRING_TARGET_OPTIONS`, `MODIFIERS`, and nested `AbilityCategory.types` were each typed as mutable arrays. Any in-place mutation (`.sort()`, `.push()`, index assign) by one consumer would now silently corrupt every other consumer — a failure mode that did not exist before the move, when each component owned its own copy. `AbilitiesStep.tsx:216` hands the shared nested `types` array straight out to `activeTypes`. Latent, not active: all consumers today only read (`.find`/`.map`/`.filter`/`.includes`). | Medium | `src/domain/constants.ts:3-34` | AC2, AC3 | **Fixed** |
| 2 | `teams.test.ts:11-13` — "derives TEAM_ORDER to cover exactly the TEAMS array" is a tautology. `TEAM_ORDER` *is* `TEAMS` (same object reference, via `export const TEAM_ORDER: readonly Team[] = TEAMS`), so `expect(TEAM_ORDER).toEqual([...TEAMS])` cannot fail regardless of correctness. The test name overstates what it guards. Coverage is nonetheless adequate — `teams.test.ts:8` pins the literal values and `roleSort.test.ts:9` independently pins `TEAM_ORDER`. | Low | `src/test/teams.test.ts:11-13` | AC1 | Open |
| 3 | Latent **domain↔types bidirectional layer dependency**. `domain/constants.ts:1` and `domain/roleDraft.ts:1` import from `types/role.ts`, which imports from `domain/teams.ts`. No module-level cycle exists today (verified: `teams.ts` imports nothing), but the direction is bidirectional at layer granularity, and the ESLint boundary rule deliberately does not restrict `types`. If `teams.ts` ever needs anything from `types/role.ts`, this becomes a true cycle. | Low | `src/domain/constants.ts:1`, `src/domain/roleDraft.ts:1`, `src/types/role.ts:1` | AC1, AC6 | Open — feature 11 |
| 4 | `createEmptyDraft()` depends on the ambient `crypto.randomUUID()` global inside a layer the ESLint rule advertises as "pure TypeScript". Moved verbatim, so **not a regression**, but it means `src/domain` is not environment-agnostic: `crypto.randomUUID` requires a secure context in browsers and Node ≥19. Phase 04's engine may want id generation injected rather than ambient. | Low | `src/domain/roleDraft.ts:7` | AC4 | Open — note for Phase 04 |
| 5 | **`eslint-plugin-react-hooks` is not installed at all** — confirmed absent from `package.json` devDependencies, absent from `node_modules`, and never registered in `eslint.config.js`. The sole reference repo-wide is the disable comment at `useRoles.ts:21`. Consequence: `react-hooks/exhaustive-deps` **and** `rules-of-hooks` are silently unenforced across the entire frontend — no hook dependency array or hook-ordering violation is caught anywhere. Pre-existing baseline; not introduced here. | High (repo-wide) — **not this feature's** | `package.json:25-39`, `eslint.config.js`, `src/hooks/useRoles.ts:21` | — | Open — escalate to feature 12 |

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-frontend/src/domain/constants.ts` | Tightened the shared domain singletons to `readonly`: `AbilityCategory` fields (`id`, `label`, `types: readonly string[]`), `ABILITY_CATEGORIES: readonly AbilityCategory[]`, `STRING_TARGET_OPTIONS: readonly string[]`, `MODIFIERS: readonly StepModifier[]`. Added a comment explaining the shared-singleton rationale. | 1 |

**Why this fix and not something larger**: it is type-level only, zero runtime change, and consistent with the `TEAM_ORDER: readonly Team[]` precedent this same feature already set. All consumers verified read-only before the change (`AbilitiesStep.tsx:155,216,217,358,415`). Post-fix: `tsc --noEmit` unchanged (only the pre-existing `Wizard.test.tsx` error), lint unchanged (only the 2 pre-existing errors), suite unchanged at 371 passed / 3 pre-existing failures.

## Requested Assessments

### 1. Is the `types/role.ts` `Team` re-export a reasonable seam or a smell? — **Reasonable seam. Keep it; invert the dependency in feature 11.**

The construct is correct and deliberate:

```ts
import type {Team} from '../domain/teams';
export type {Team};
```

The implementer's note is accurate — a bare `export type {Team} from '../domain/teams'` would re-export *without* binding `Team` locally, breaking the four interfaces in that file (`Role`, `RoleDraft`, `RoleListItem`, `TeamGroup`'s source) that reference it. The `import type` + `export type` pair makes both work, is `isolatedModules`-safe, and erases entirely at compile time (zero runtime cost, no barrel-file bundling hazard).

Strategically this is the right Wave 1 call: it converts what would have been a repo-wide import rewrite into a one-line change, and splitting `types/role.ts` is an *explicit non-goal* of this feature. A foundation feature that also rewrote every `Team` importer would have been the smell.

**My recommendation for feature 11**: keep the re-export as a *deliberate public API*, but **invert the direction**. Today the dependency is bidirectional (`domain → types` for `StepModifier`/`RoleDraft`, `types → domain` for `Team`). Feature 11 should move `Team`'s peers — `StepModifier`, `RoleDraft`, `AbilityStep` — into `src/domain/`, so that `domain/` imports *nothing* from `types/`, and `types/role.ts` becomes a pure downstream re-export surface for transport consumers. That resolves issue #3 as a side effect and lets the ESLint boundary rule be extended to restrict `types` from `domain`, closing the carve-out. If feature 11 instead deletes the re-export outright, it must rewrite every `Team` importer in one commit — mechanical, but wide and conflict-prone.

### 2. Is the `BasicInfoStep` eslint-disable narrowly scoped and does the TODO name feature 12? — **Yes to both. This is a well-constructed exemption.**

`BasicInfoStep.tsx:3-7`:
- It is `eslint-disable-next-line`, **not** a file-level `/* eslint-disable */` — scope is exactly one line.
- It names the specific rule `no-restricted-imports`, **not** a blanket disable — any *other* future violation on that line still errors.
- It applies to precisely the offending `rolesApi` import and nothing else.
- The TODO names feature 12 by full slug: `TODO(12-frontend-dead-code-and-tests)`, and states both the cause (direct API call for the name-availability check) and the remedy (move behind a hook).

The detail that elevates this: lint runs with `--report-unused-disable-directives --max-warnings 0`. So when feature 12 removes the API import, a forgotten directive **fails the build**. The exemption is self-cleaning and cannot rot silently. I verified the directive is live — lint reports the 2 pre-existing errors and no "unused disable directive", proving it is actively suppressing a real violation.

### 3. Is `react-hooks/exhaustive-deps` silently unenforced repo-wide? — **CONFIRMED. Real, and more consequential than the record states.**

Verified three independent ways:
- **Not in `package.json`** — no `eslint-plugin-react-hooks` in devDependencies (only `react-refresh` is present in `node_modules`, unrelated).
- **Not in `node_modules`** — `eslint-plugin-react-hooks` absent.
- **Never registered in `eslint.config.js`** — the flat config imports only `@eslint/js`, `typescript-eslint`, and `globals`.

The only reference repo-wide is the disable comment at `useRoles.ts:21`, which produces the baseline error `Definition for rule 'react-hooks/exhaustive-deps' was not found`.

The record undersells this. It is not only `exhaustive-deps` — **`react-hooks/rules-of-hooks` is equally unenforced**. Nothing in this repo checks conditional hook calls, hook call ordering, or stale dependency arrays. The `useRoles.ts:21` comment shows a developer *believed* they were suppressing a live rule that had never run. There is a real chance other hooks carry latent dependency bugs that no tool has ever flagged — and the 3 pre-existing `useRoles.test.ts` failures (feature 12's) are in exactly that file.

**Correctly not fixed here.** Installing the plugin would surface an unknown number of new errors across files this feature does not own, in a repo with concurrent agents. Escalated to feature 12 below.

### 4. Is `MODIFIER_LABELS` in `domain/constants.ts` coherent? — **Yes. Divergent in letter, compliant in spirit.**

AC2 says "defined once in the domain layer **next to the modifier type**". `StepModifier` lives in `types/role.ts`, and splitting that file is an explicit non-goal (feature 11). The implementer followed the context Key Files table instead. That is the right resolution of the conflict.

More importantly, the *purpose* of "next to" is preserved by type coupling rather than physical adjacency:

```ts
export const MODIFIER_LABELS: Record<StepModifier, string> = { ... };
```

`Record<StepModifier, string>` means tsc **errors** if `StepModifier` gains a variant without a label — which is exactly the drift that co-location was meant to prevent. `domainConstants.test.ts:19-23` adds a second guard that every `MODIFIERS` entry has a non-empty label. The co-locating of `MODIFIERS` alongside the labels (deviation #2) is also the right call — they must move in lockstep.

Feature 11 finishes the job: once `StepModifier` moves into `src/domain/`, `constants.ts:1` becomes a domain-internal import and the co-location is literal.

## Remaining Concerns

- **Issue #5 (react-hooks plugin absent)** — High impact, repo-wide, but pre-existing and out of this feature's scope. Feature 12 must install `eslint-plugin-react-hooks`, register it in the flat config, and triage the resulting errors. Expect fallout: enabling `exhaustive-deps` for the first time on a codebase that has never run it typically surfaces multiple real bugs. Budget for it.
- **Issue #3 (domain↔types bidirectional dependency)** — Low today, resolvable by feature 11 as described above. No cycle exists yet; worth closing before Phase 04's engine deepens the domain layer.
- **Issue #2 (tautological test)** — Low. Real coverage exists elsewhere; leave to the next cleanup pass.
- **Issue #4 (`crypto.randomUUID` in the "pure" domain layer)** — Low. Flag for Phase 04's engine design if determinism or Node-environment portability matters.
- **AC7 build half** — remains unmet for reasons entirely outside this feature. Feature 12 owns the one-line `Wizard.test.tsx:242` fix. Until then the frontend `npm run build` is red on `main`, which is worth knowing if any CI gate depends on it.
- **Boundary rule is path-string, not module-resolution, based** (`eslint.config.js:9-11`). It matches raw import strings, so it catches any relative depth but **would not catch an alias import** (e.g. `@/api/roles`) if aliases are ever introduced. No aliases are configured today. If Phase 04 adds `tsconfig` path aliases, the `layerPatterns()` groups must be extended or the rule silently stops protecting the domain layer. Recorded below as a cross-phase decision.

## Test Coverage Assessment

- **Covered**: AC1 (`teams.test.ts`, `roleSort.test.ts`), AC2/AC3 (`domainConstants.test.ts` + existing `AbilitiesStep.test.tsx`/`ReviewStep.test.tsx`), AC4 (`roleDraft.test.ts` + existing `RoleBuilder.test.tsx`), AC5 (`format.test.ts` + existing component tests), AC6 (lint evidence, independently re-verified by probe).
- **16 new tests**, all passing. 355 baseline + 16 = 371 confirms every new test passes with zero regressions — arithmetic verified against an independent suite run.
- **Test quality**: good. The exact-equality pins on constants are intentionally brittle and correctly so — these values are transport-adjacent and `AbilitiesStep.test.tsx` asserts on rendered option values. `format.test.ts:18` (`mcDONALD` → `McDONALD`) is a nice guard that `capitalize` does not lowercase the remainder.
- **Missing / weak**:
  - `teams.test.ts:11-13` is a tautology (issue #2) — no real gap, since `roleSort.test.ts:9` covers it independently.
  - No test asserts the **negative** case for AC1's headline claim (that tsc rejects a missing `TEAM_COLORS` key). That is a compile-time guarantee, not unit-testable without a type-level test harness (e.g. `expectTypeOf`/`tsd`). The `Record<TeamColor, string>` annotation makes it structurally certain; I accept it on inspection rather than execution.
  - No regression test locks the domain layer's import purity beyond the lint rule itself. That is appropriate — lint is the right tool.

## Risk Summary

- `src/domain/constants.ts` — shared mutable singletons were the one real defect introduced by this refactor (a genuine, if latent, consequence of de-duplication that per-component copies had masked). Fixed via `readonly` during review; verified no consumer required mutation.
- `eslint-plugin-react-hooks` absent repo-wide — the highest-impact finding of this review, but pre-existing and correctly out of scope. Unknown latent hook-dependency bugs across the frontend. Feature 12.
- `src/domain/` ↔ `src/types/role.ts` bidirectional layer dependency — acyclic today, but the boundary rule's `types` carve-out leaves it unguarded as Phase 04 deepens the domain layer. Feature 11.
- ESLint boundary rule matches import *strings*, not resolved modules — silently defeated by path aliases if Phase 04 introduces them.
- AC1–AC5 verified statically and via unit/component tests only; the app was not run. Acceptable for a no-logic-delta constants relocation whose component tests assert rendered output, but not runtime-observed.

## Ledger Note

No ledger infrastructure exists in this repo (no `ledger-events.jsonl`, `ledger-commits.jsonl`, or `dev/ledger*`), consistent with the implementation record's Gaps item 3. Issue #1 (discovered and fixed during this pass) and issue #5 (escalation) are recorded here rather than as ledger rows. I did not create ledger scaffolding unilaterally — other agents are working in this repo concurrently and that is a repo-wide structural decision, not a reviewer's call.
