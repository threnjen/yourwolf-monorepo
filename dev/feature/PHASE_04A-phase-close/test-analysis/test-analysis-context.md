# Phase 04A Test Analysis Context

## Scope

Phase 04A adds five pure TypeScript engine modules, four engine test modules, and two static parity fixtures. It adds no runtime callers.

The detached baseline worktree resolved to `/tmp/baseline-yourwolf-monorepo-aa8c481` at `aa8c4814fa92395e75efd21d6764da0c4493e257`. Its status was clean before analysis. Coverage ran from separate writable exports so the baseline worktree remained unchanged. The worktree was removed after verification.

## Suite Delta

| Metric | Base | Remediated head | Delta |
|---|---:|---:|---:|
| Test files | 42 | 46 | +4 |
| Expanded tests | 535 | 679 | +144 |
| Failed tests | 0 | 0 | 0 |

Added suites:

- `templates.test.ts`: literal narration-template oracle and engine shape contracts.
- `narration.test.ts`: narration assembly, ordering, fixture parity, and input immutability.
- `gameSetupValidation.test.ts`: setup-rule parity, precedence, and create-boundary delegation.
- `gameSession.test.ts`: session creation, injected identity, transitions, and input immutability.

## Redundancy Assessment

No test is recommended for deletion.

- Repeated template test names come from distinct literal parameter rows. They cover different inputs and expected strings.
- Setup precedence appears at the rule seam and the `createGameSession()` boundary. The two layers defend different responsibilities.
- Four local role factories and two step factories repeat construction syntax. This is a Low maintenance issue, not redundant behavioral coverage. Consolidation could obscure suite-specific defaults and is not required for readiness.
- Fixture parity tests cover full seed output. Focused unit tests isolate error and edge behavior that a fixture mismatch would not diagnose.

## Flake Assessment

No Phase 04A flake candidate was found.

- The added suites use no clock, timer, random source, network, storage, process environment, concurrent test mode, or mutable global state.
- The only `crypto` match is descriptive text in an ID-generation test name.
- Static fixtures and injected identity make outputs deterministic.
- Ten consecutive complete engine-suite runs passed. Each run executed all 144 engine tests.

Pre-existing React Router notices and React `act(...)` warnings remain in unrelated frontend suites. They did not fail or vary during this analysis and are not introduced by Phase 04A.

## Test-Power Remediation

Mutation probes ran in the disposable remediated export:

- Replacing `input.id_generator()` with a literal failed the spy and returned-ID assertions.
- Mutating a nested ability parameter failed the create-input deep snapshot.
- Reversing a session wake-order array inside `startGame()` failed the transition deep snapshots.
- Removing required fields from real narration-builder results failed the public-output shape assertion.

The disposable mutations were removed, and the restored engine suite passed.
