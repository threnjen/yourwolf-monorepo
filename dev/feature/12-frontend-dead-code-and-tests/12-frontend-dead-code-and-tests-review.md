# Review Record: Frontend Dead-Code Resolution & Test Structure

## Summary

Final feature of the 12-feature remediation, and the one under the most pressure to fabricate: it had
to turn three red gates green. Every cheap illegitimate path to green was checked for and **none was
taken**. The green is honest.

I independently verified all three gates rather than accepting them: **535 passed / 42 files, `npm run
lint` exit 0, `npm run build` PASS**.

The eight briefed risks were each verified against primary evidence (`git show`, `git ls-tree`,
live probes, a mutation test, and a pydantic execution) rather than against the implementation
record's narrative. All eight resolved in the implementer's favour. Notably, the implementation
record is itself **accurate**, including its self-critical items — a departure from the four prior
features in this family that carried fabricated claims. Its Deviations 2, 3, 4, 5 and 6 all
reproduce exactly as written, and Deviation 3's self-correction of the *plan* is not only right but
understated (see Issue #2).

One Medium hardening applied (`exhaustive-deps` severity). No test was deleted, weakened, skipped or
uncollected to reach green.

## Verdict

**Approved**

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | **Met (verified)** | `src/hooks/useDrafts.ts` (deleted) | Orphan confirmed at baseline: `git grep useDrafts cf60b31` returns only the hook's own definition + its own test. Zero production callers. Deletion legitimate. |
| AC2 | **Met (verified)** | `src/api/roles.ts`, `src/api/games.ts` | All three deletions confirmed dead by grep at `cf60b31`. `rolesApi.getById` had no callers — the `useGame.ts:14` hit is `gamesApi.getById`, a *different, retained, live* method. `gamesApi.delete` retained per directive (Issue #2). |
| AC3 | **Met (verified)** | `src/hooks/useNameCheck.ts`, `BasicInfoStep.tsx` | `eslint-disable-next-line no-restricted-imports` genuinely **removed** (confirmed in diff). Debounce (500ms) and requestId race guard preserved exactly vs `cf60b31`. Boundary rule passes with zero exemptions. |
| AC4 | **Met (verified)** | `src/test/**` (40 relocated) | 42 files on disk == 42 collected by `vitest list`. No `include`/`exclude` override in `vite.config.ts` — vitest's recursive default collects all. Silent-uncollection risk disproven directly, not by count. |
| AC5 | **Met (verified)** | `HomePage.tsx`, `RolesPage.tsx`, `routes.tsx` | Clean rename; routes updated; tests renamed alongside. |
| AC6 | **Met (verified)** | `useRoles.test.ts`, `Wizard.test.tsx` | Suite green. The 3 failures were genuinely stale tests — see Issue #1. |
| AC7 | **Met (verified)** | `Wizard.test.tsx:242` | Fixed correctly: `const {rerender} = render(` → `render(`. File is 270 lines and 18 tests on **both** sides with zero assertion changes. Nothing deleted to fix the build. |
| AC8 | **Met (verified, hardened)** | `package.json`, `eslint.config.js` | Plugin independently probed: genuinely active. Zero fallout claim is airtight (see Issue #3 reasoning). Severity hardened by this review. |
| AC9 | **Met (verified)** | `src/api/errors.ts`, `RoleBuilder.tsx` | Both halves of the reachability analysis reproduce. See Issue #4. |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | `useRoles` "stale test" claim — **verified correct, no action** | — | `useRoles.ts:20` | AC6 | Verified |
| 2 | `gamesApi.delete` retained on evidence that does not support retention | Low | `src/api/games.ts` | AC2 | Open (retention upheld) |
| 3 | `react-hooks/exhaustive-deps` shipped as `warn`; enforcement coupled to the `--max-warnings 0` CLI flag | Medium | `eslint.config.js:32` | AC8 | **Fixed** |
| 4 | 422 reachability analysis — **verified correct, no action** | — | `Wizard.tsx:96` | AC9 | Verified |
| 5 | `useNameCheck` effect dep changed `[localName]` → `[trimmedName]` — undisclosed but benign behavior change | Low | `useNameCheck.ts:52` | AC3 | Open (no action) |
| 6 | `useRoles` `limit: 100` is a hard ceiling with no pagination — pre-existing, now enshrined in tests | Low | `useRoles.ts:20` | — | Open (Phase 04) |

### Issue #1 — `useRoles` stale-test claim: VERIFIED, and the implementer's call was correct

This was the highest-risk claim in the brief: if the hook were wrong and the tests right, "fixing the
tests" would silently cap role fetching. It is the reverse, and decisively so.

- `git show 1f49d96` confirms `limit: 100` was added deliberately in a Phase 3.6 feature commit,
  changing `rolesApi.list({visibility})` → `rolesApi.list({visibility, limit: 100})`. The tests were
  never updated. Claim verified against primary evidence.
- **The dispositive fact the record only asserts, which I confirmed:** the backend default is
  `limit: int = Query(default=20, ge=1, le=100)` (`app/routers/roles.py:33`). So `limit: 100` **raises**
  the fetch ceiling from 20 to the maximum permitted. Removing it to satisfy the tests would have
  capped role fetching at 20 — exactly the silent regression the implementer describes.
- The test changes are **strengthenings, not weakenings**: `toHaveBeenCalledWith()` (asserts nothing
  about args) → `toHaveBeenCalledWith({visibility: undefined, limit: 100})` (asserts exact args).

Fixing the tests was correct.

### Issue #2 — `gamesApi.delete`: retention upheld, but the evidence is weaker than *even the implementer argued*

The implementer flagged that the plan mischaracterises `PHASE_04_SUMMARY.md` L76. I confirm this, and
found the argument is **understated**:

- L36 (`## Out of Scope`) is indeed the only explicit retention language, and names only
  `rolesApi.create()`, `validate()` and the roles list endpoint. It does **not** mention `gamesApi.delete`. Confirmed.
- L76 sits under `## Technical Context` and reads *"Existing API clients: `src/api/games.ts` (game
  create/start/advance/script/delete)"* — a descriptive inventory. Confirmed.
- **New finding:** that same L76 sentence also omits `getById` — which is **demonstrably live**
  (`useGame.ts:14`). An inventory that omits a method in active production use cannot be a retention
  contract; it is simply incomplete. This independently proves the implementer's reading and removes
  the last basis for treating L76 as binding.

**Retention upheld anyway.** The directive was explicit, and the cost asymmetry is real (one dead
method vs. breaking a Phase 04 port). But the decision rests on the directive alone, not on evidence.
Recorded so Phase 04 can revisit without re-deriving this.

### Issue #3 — `exhaustive-deps` severity (FIXED)

I probed the plugin independently with a deliberate violation file rather than trust the record:

```
6:17  error    React Hook "useState" is called conditionally...   react-hooks/rules-of-hooks
13:6  warning  React Hook useEffect has a missing dependency...   react-hooks/exhaustive-deps
```

The plugin is **genuinely active** — this disproves the "inactive plugin looks identical to clean
codebase" concern directly. `--print-config` confirmed severities were `rules-of-hooks: [2]` (error)
but `exhaustive-deps: [1]` (warn).

**On the "zero fallout is surprising" concern:** it is not merely plausible, it is provable.
`--max-warnings 0` means *any* warning fails lint. Lint exits 0. Therefore there are mathematically
zero outstanding exhaustive-deps warnings repo-wide. The claim cannot be hiding suppressed findings.
Combined with the audits below (zero disables added, zero ignore patterns, zero config tampering),
the zero-fallout claim is airtight.

`warn` is upstream's own `recommended-latest` default — not a downgrade by the implementer, who
disclosed the fragility unprompted. But the brief asks that rules be error-not-warn, and coupling a
correctness rule to a CLI flag is genuine fragility. Promoted to `error`. Zero risk by the argument
above, and confirmed: re-probe now reports `error`, all three gates still green.

### Issue #4 — 422 reachability: BOTH halves verified

- **1-char path genuinely unreachable.** `Wizard.tsx:96` `canProceedFromStep` returns
  `draft.name.trim().length >= 2` for the basic step, and `validation.errors` render **only** in
  `ReviewStep.tsx:162` (grep-confirmed — no other render site). A 1-char name cannot reach the only
  surface that displays the error. The brief's reproduction is impossible.
- **>50 path genuinely reachable and genuinely fixed.** Backend is `name: str = Field(..., min_length=2,
  max_length=50)` (`app/schemas/role.py:63`). The wizard's `>= 2` gate mirrors `min_length=2` exactly —
  so the minimum can never be violated from the UI — while **nothing** gates the maximum (`grep maxLength`
  across components/pages: zero hits). An over-long name walks to Review and returns a 422.
- **The "verbatim pydantic body" claim is true.** I executed pydantic against the real bounds:
  `{"type": "string_too_long", "msg": "String should have at most 50 characters", "ctx": {"max_length": 50}}`
  — matching the fixture exactly. The fixture's `loc: ['body','name']` vs my bare-model `['name']` is
  precisely FastAPI's request-part prefix, which `formatDetail` correctly strips via `loc.slice(1)`.
- The 422 test is a real end-to-end drive (name input → 3× Next → ReviewStep) asserting the server
  message renders **and** that the generic fallback does not. The pre-existing outage-fallback test is
  retained and still asserts `Validation service unavailable`.

### Issue #5 — `useNameCheck` dep change (no action)

Old effect dep was `[localName]`; new is `[trimmedName]`. Undisclosed (the record discloses only the
`debounceRef` removal). Behavior delta: typing trailing whitespace (`"Seer"` → `"Seer "`) no longer
re-triggers a redundant status reset + 500ms timer + duplicate request. Same terminal status in all
cases; strictly fewer wasted round trips. An improvement, not a regression. Noted for completeness only.

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `yourwolf-frontend/eslint.config.js` | Promoted `react-hooks/exhaustive-deps` from `warn` (upstream default) to `error`, with a comment recording that it is currently a no-op and why it is set anyway. Decouples rule enforcement from the `--max-warnings 0` CLI flag. | #3 |

**Post-fix gate verification (all re-run by me):**
- `npx vitest run` → **535 passed / 42 files, 0 failed**
- `npm run lint` → **exit 0**
- `npm run build` → **PASS**
- `--print-config` → `rules-of-hooks: [2]`, `exhaustive-deps: [2]`
- Re-probe with violation file → `exhaustive-deps` now reports **error**
- `src/hooks/useRoles.ts` still lints clean → its disable directive remains load-bearing, not unused

## Anti-Fabrication Audit

The specific tactics that would have produced a dishonest green, and the evidence against each:

| Tactic | Evidence | Result |
|---|---|---|
| Test file silently uncollected | 42 on disk == 42 in `vitest list`; no `include`/`exclude` override in `vite.config.ts` | **Not found** |
| Test files deleted | `git ls-tree` basename diff `cf60b31`→`44777dd`: only **one** outright deletion (`useDrafts.test.ts`, AC1-legitimate). All others are disclosed renames (`domainConstants`→`constants`, `Home`→`HomePage`, `Roles`→`RolesPage`) or additions | **Not found** |
| Assertions weakened | `Wizard.test.tsx` 270→270 lines, 18→18 tests, only the unused `rerender` binding changed. `BasicInfoStep.test.tsx` **byte-identical** apart from import paths + deleted-mock cascades, 25→25 tests | **Not found** |
| Tests skipped | `grep it.skip\|describe.skip\|it.todo\|.only\|xit(\|xdescribe(` across `src/test/` | **Zero hits** |
| eslint-disable added to reach green | Full-diff grep: exactly one disable **removed** (`BasicInfoStep`), zero added. Only remaining disable in `src/` is `useRoles.ts:21`, byte-identical to parent (`git diff cf60b31 44777dd` empty), and `--report-unused-disable-directives` confirms it is necessary | **Not found** |
| Type checking bypassed | Full-diff grep for `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` | **Zero hits** |
| Build/test config loosened | `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` — **untouched** by the commit | **Not found** |
| Vacuous new tests | Mutation test: removed the requestId race guard from `useNameCheck.ts` (file-copy backup, per git constraint) → **stale-response test failed**. Restored → 11/11 pass, `git status` clean | **Not found** |

## Test Coverage Assessment

- **Covered:** AC1 (grep evidence), AC2 (grep evidence), AC3 (11 `useNameCheck` tests + 25 unchanged
  `BasicInfoStep` anchors), AC4 (collection parity), AC5 (page tests + routes test), AC6/AC7 (suite +
  build), AC8 (independent probe), AC9 (15 `errors.api` unit tests + 1 end-to-end 422 test)
- **Notably strong:** the AC3 extraction is validated by 25 **byte-identical** pre-existing tests
  exercising the component through the same `rolesApi` mock seam. That is a genuine behavior-preservation
  oracle — the tests predate the refactor and could not have been transcribed from the new code (the
  self-referential-oracle failure mode logged in `review-learnings.md`).
- **`errors.api.test.ts` edge coverage is thorough:** single/multi/nested/bare/malformed 422 arrays,
  string details (400/403/404), blank detail, and the four null cases (network, 5xx, HTML body, non-error).
- **Missing:** no test pins the `Wizard` `>= 2` gate as the reason the min-length 422 is unreachable. If
  someone later relaxes that gate to `>= 1`, the min-length 422 becomes reachable and no test notices.
  Low value — the 422 parser handles it correctly regardless; only the reachability *analysis* would go stale.

## Remaining Concerns

- **Issue #2** — `gamesApi.delete` is dead frontend surface retained on a directive whose cited evidence
  does not support it (and which I found is further undermined by L76 also omitting the live `getById`).
  Revisit in Phase 04. Low.
- **Issue #6** — `useRoles` fetches `limit: 100` with no pagination, and the backend caps at `le=100`.
  Past 100 roles, roles silently vanish from the UI. **Pre-existing** (from `1f49d96`), not introduced
  here, but this feature enshrines it in assertions. The now-deleted `rolesApi.listOfficial` pagination
  issue (`PHASE_02/PHASE_2_QA-review.md` #7) is moot, but this ceiling is the same class of problem and
  is live. Flag for Phase 04. Low.
- **Issue #5** — undisclosed (benign, improving) dep-array change in `useNameCheck`. No action.
- **`GameSessionListItem`** is now unreferenced (verified: only its own definition in `types/game.ts:40`).
  The implementer's justification for keeping it is accurate — `GET /games` genuinely exists
  (`app/routers/games.py:44`, `@router.get("/", response_model=GameSessionPaginatedResponse)`). Correctly
  deferred rather than deleted unilaterally.
- **Process:** the record self-discloses one prohibited `git checkout -- x` invocation that failed as a
  no-op. I confirmed `src/hooks/useRoles.ts` is byte-identical to the commit and the tree is clean. No
  impact. Disclosing it rather than hiding it is the correct behavior and I want it recorded as such.
- **No ledger annotation written:** this repo has no `ledger-events.jsonl` / `ledger-commits.jsonl` and no
  `remediation-ledger-contract` instruction file. There is no schema to append against, so I did not
  invent one. Verdict is Approved with no incoming remediation request, so no `remediation-request` row
  was owed regardless.

## Risk Summary

- **The green is honest.** This is the load-bearing conclusion. Eight independent audit tactics (table
  above) found zero instances of test deletion, weakening, skipping, suppression, config loosening, or
  silent uncollection. The three gates are green because the code is correct, not because the gates were
  bent.
- **`eslint.config.js`** — enforcement of a correctness rule was coupled to a CLI flag. Fixed. This was
  the only real defect found, and it was one the implementer had already disclosed rather than concealed.
- **`src/api/errors.ts`** — new logic, but well-bounded: pure function, no I/O, 15 unit tests covering
  every branch including four distinct null paths, plus one end-to-end test. The `null`-vs-`[]` contract
  (return `null` when unusable so the caller supplies its own fallback) is correctly honored at the single
  call site (`RoleBuilder.tsx`: `serverErrors ?? ['Validation service unavailable']`).
- **Implementation record accuracy** — every checkable claim reproduced. After four consecutive features
  with fabricated claims, this record's claims survived independent verification, *including* its
  self-critical ones. Its Deviation 3 correctly identifies a **plan** error; the plan remains the
  unreliable artifact in this family, not the implementation.
- **Deferred to Phase 04:** `gamesApi.delete` (dead), `GameSessionListItem` (unreferenced DTO),
  `useRoles` 100-role ceiling (live, pre-existing).
</content>
</invoke>
