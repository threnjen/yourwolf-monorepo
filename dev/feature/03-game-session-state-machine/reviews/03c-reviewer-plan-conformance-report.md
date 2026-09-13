# Plan-Conformance Review: 03 Game Session State Machine

## Review scope and initial evidence

This review covers the four feature files listed in the implementation record and
the plan's AC1–AC10 only. The code-review graph found four changed files, no
affected runtime flows, and no existing callers. The initial authoritative runs
were green:

- Frontend: `npm test -- --run --reporter=junit --outputFile=/tmp/phase04a-feature03-frontend-review-initial.xml`
  → `/tmp/phase04a-feature03-frontend-review-initial.xml`, 679 total, 679 passed,
  0 failed.
- Backend setup/transition oracle: `uv run pytest --no-cov tests/test_game_setup_validation.py tests/test_game_service.py --junitxml=/tmp/phase04a-feature03-backend-review-initial.xml`
  → `/tmp/phase04a-feature03-backend-review-initial.xml`, 55 total, 55 passed,
  0 failed.
- Lint: `npm run lint` exited 0 with zero warnings.
- Build: `npm run build` exited 0.

The baseline artifact `/tmp/phase04a-feature03-baseline.xml` records 629 passed
tests. The initial frontend artifact records 34 tests in
`gameSetupValidation.test.ts` and 16 tests in `gameSession.test.ts`.

## Acceptance-criterion map before repair

| AC | Status | Exact evidence |
|---|---|---|
| AC1 | Complete | `gameSetupValidation.ts:11-24` defines readonly setup, role, dependency, and sequence contracts. `gameSession.ts:20-35` adds the injected id generator and readonly session shape. `gameSession.test.ts:81-97,144-179` asserts the create shape and caller immutability. |
| AC2 | Partial | `gameSetupValidation.ts:30-97` visibly orders count, known ids, card counts, primary teams, dependencies, and wake sequence. `gameSession.ts:48-49` delegates create to it. The precedence cases at `gameSetupValidation.test.ts:123-165,204-209` call `validateGameSetup` directly, so the public create boundary is not exercised for those cases. |
| AC3 | Complete | `gameSetupValidation.ts:141-165` separates required errors from recommended warnings and preserves the exact strings. `gameSession.test.ts:120-141` asserts warning propagation. Backend source parity is at `game_setup_validation.py:183-192`. |
| AC4 | Partial | `gameSetupValidation.ts:92-105,168-218` implements sequence checks and omission. Tests cover extra, missing, duplicate, empty, non-waking, and omitted inputs at `gameSetupValidation.test.ts:303-355`. The Python oracle's `None` case at `test_game_setup_validation.py:797-812` has no explicit frontend equivalent, and a runtime `null` would reach the spread at `gameSetupValidation.ts:104`. |
| AC5 | Complete | `gameSession.ts:48-73` validates before invoking the injected generator and clones setup arrays. `gameSession.test.ts:81-97,144-157` asserts caller values, deterministic ids, and omitted sequence. Source search found no ambient `crypto`, time, random, persistence, network, or UI import. |
| AC6 | Complete | `gameSession.ts:77-86` enforces setup-only start and zero wake index. `gameSession.test.ts:183-199` asserts the successful and rejected paths without mutation. |
| AC7 | Complete | `gameSession.ts:89-104` rejects setup/complete and advances one declared phase. `gameSession.test.ts:201-254` covers all four valid table steps, terminal/setup rejection, full path, and new values. |
| AC8 | Partial | The backend oracle has 32 collected methods at `test_game_setup_validation.py:42-847`; the frontend has 34 cases and the duplicate precedence seam. The null/omitted backend case is represented only by omission, not an explicit null input. The error cases also bypass `createGameSession`, leaving the AC's stated create behavior less directly pinned. |
| AC9 | Complete | `gameSession.ts:1-104` and `gameSetupValidation.ts:1-218` contain only pure local validation/state code. A forbidden-capability search returned no shuffle, dealing, counters, persistence, routing, timestamps, ambient random/crypto, network, DOM, React, or logging dependency. |
| AC10 | Partial | Initial frontend and backend artifacts are green, and lint/build are green. The implementation record says 46 new tests at `03-game-session-state-machine-implementation.md:62-66`, but the artifacts prove 679−629 = 50 new tests, with 34 + 16 by feature suite. Coverage must be rerun after repair and the record corrected. |

## Findings recorded before repair

### Finding 1

- severity: medium
- lane: plan-conformance
- evidence: `yourwolf-backend/tests/test_game_setup_validation.py:797-812` accepts an omitted/`None` wake sequence. The frontend contract at `yourwolf-frontend/src/engine/gameSetupValidation.ts:16` has no nullable representation, and `validateGameSetup` spreads `input.wake_order_sequence` at line 104 whenever the runtime value is `null`, causing a `TypeError` instead of normalizing it to the omitted result. The frontend test file has no explicit null case (`gameSetupValidation.test.ts:332-347`).
- reviewer: 03c-reviewer-plan-conformance
- repair: add a failing null-input oracle case, accept nullable boundary input, and normalize null to the omitted output while preserving omitted-property behavior.

### Finding 2

- severity: low
- lane: plan-conformance
- evidence: `/tmp/phase04a-feature03-baseline.xml` reports 629 passed tests and `/tmp/phase04a-feature03-frontend-review-initial.xml` reports 679 passed tests, a delta of 50. The artifact reports 34 setup tests and 16 session tests, while `03-game-session-state-machine-implementation.md:54-55,64` says 34 + 12 and 46 total. The four additional cases are the `test.each` rows at `gameSession.test.ts:210-220`.
- reviewer: 03c-reviewer-plan-conformance
- repair: reconcile the implementation record to 50 total, 34 setup cases, and 16 session cases, with 12 ordinary session tests plus four table rows.

### Finding 3

- severity: medium
- lane: plan-conformance
- evidence: The plan's high-value checks require setup rejection and precedence to be observed when `create` runs (`03-game-session-state-machine-plan.md:86-92`). Most rejection cases use the direct helper `validateGameSetup` through `gameSetupValidation.test.ts:97-99`, while only the single count case at `gameSession.test.ts:159-179` proves create rejection. This leaves card-count, primary-team, dependency, and wake-sequence rejection behavior at the public create boundary unverified.
- reviewer: 03c-reviewer-plan-conformance
- repair: route the shared rejection assertion through `createGameSession` while retaining direct successful-result assertions for the validation result shape.

## Repair record

The review-and-repair round made these smallest-scope changes:

- `gameSetupValidation.ts:16,92-104` now accepts an explicit nullable sequence
  at the engine boundary and normalizes `null` to the same absent output as the
  backend. The new test at `gameSetupValidation.test.ts:338-343` was run red
  before this source change and green afterward.
- `gameSetupValidation.test.ts:98-104` routes the shared rejection assertion
  through `createGameSession`, so the precedence, exact-message, dependency,
  card-count, primary-team, and wake-sequence cases now exercise the public
  create boundary.
- `03-game-session-state-machine-implementation.md:54-66,73-84` now records
  50 new cases, the 34 + 16 suite split, corrected coverage, and the resolved
  review round.

No sibling source, backend source, transport types, configuration, or unrelated
tests changed. No finding remains unfixed.

## Final acceptance-criterion map

| AC | Status | Exact final evidence |
|---|---|---|
| AC1 | Complete | Readonly contracts: `gameSetupValidation.ts:11-19` and `gameSession.ts:20-35`. Create shape and immutability: `gameSession.test.ts:81-179`. |
| AC2 | Complete | Ordered checks: `gameSetupValidation.ts:30-97`. Create delegates before id generation: `gameSession.ts:48-61`. All rejection assertions now call create through `gameSetupValidation.test.ts:98-104`, with precedence cases at `:128-171`. |
| AC3 | Complete | Separate error/warning channels and exact strings: `gameSetupValidation.ts:141-165`. Exact warning propagation through session: `gameSession.test.ts:105-142`. |
| AC4 | Complete | Duplicate, extra, non-waking, missing, empty, valid, null, and omitted cases: `gameSetupValidation.test.ts:309-363,338-343`; null is normalized by `gameSetupValidation.ts:92-105`. |
| AC5 | Complete | Setup construction and injected id: `gameSession.ts:48-73`; deterministic and caller-preservation cases: `gameSession.test.ts:81-179`. Forbidden ambient references are absent from both engine modules. |
| AC6 | Complete | Setup-only start and zero index: `gameSession.ts:77-86`; success/rejection immutability: `gameSession.test.ts:182-199`. |
| AC7 | Complete | One-step phase order and terminal/setup guards: `gameSession.ts:38-45,89-104`; transition table and full-path tests: `gameSession.test.ts:201-254`. |
| AC8 | Complete | Backend source has 32 methods at `test_game_setup_validation.py:42-847`. Frontend has 34 cases, including both duplicate precedence seams, explicit null parity, and two extra team paths: `gameSetupValidation.test.ts:107-379`. Rejection cases run through create at `:98-104`. |
| AC9 | Complete | Engine source remains pure and local in `gameSession.ts:1-104` and `gameSetupValidation.ts:1-218`. No runtime integrations or excluded capability references are present. |
| AC10 | Complete | Final frontend artifact `/tmp/phase04a-feature03-frontend-final.xml` records 679 total, 679 passed, 0 failed for `npm test -- --run --reporter=junit --outputFile=/tmp/phase04a-feature03-frontend-final.xml`. Coverage artifact `/tmp/phase04a-feature03-coverage-final.xml` records 679 total, 679 passed, 0 failed. Engine coverage is gameSession 96.22% statements, 92.85% branches, 100% functions, 96.22% lines and gameSetupValidation 98.85%, 95.23%, 100%, 98.85%. Backend artifact `/tmp/phase04a-feature03-backend.xml` records 55 total, 55 passed, 0 failed for the manifest oracle command. `npm run lint` and `npm run build` exited 0. |

## Final test evidence

- `executed-green` — `npm test -- --run --reporter=junit --outputFile=/tmp/phase04a-feature03-frontend-final.xml`; artifact `/tmp/phase04a-feature03-frontend-final.xml`; 679 total, 679 passed, 0 failed.
- `executed-green` — `npm run test:coverage -- --reporter=junit --outputFile=/tmp/phase04a-feature03-coverage-final.xml`; artifact `/tmp/phase04a-feature03-coverage-final.xml`; 679 total, 679 passed, 0 failed.
- `executed-green` — `uv run pytest --no-cov tests/test_game_setup_validation.py tests/test_game_service.py --junitxml=/tmp/phase04a-feature03-backend.xml`; artifact `/tmp/phase04a-feature03-backend.xml`; 55 total, 55 passed, 0 failed.
- `N/A` — `npm run lint` is a static gate, not a test suite, and produces no test artifact. It exited 0 with zero warnings.
- `N/A` — `npm run build` is a build gate, not a test suite, and produces no test artifact. It exited 0.

## Final verdict

Approved for plan conformance. All three findings were repaired in the single
review round, and the integrated frontend plus manifest backend suites are
green.
