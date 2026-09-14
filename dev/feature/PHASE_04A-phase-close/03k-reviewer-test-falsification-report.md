# Phase 04A test-falsification review

verdict: needs-fix

The changed engine tests pass, but the suite has concrete gaps in failure power. The targeted run passed 4 files and 144 tests. The full frontend run passed 46 files and 679 tests.

## Must-pass observable assertions

- `gameSession.test.ts` covers session fields, omitted wake-sequence presence, warning propagation, invalid setup rejection, phase transitions, transition immutability, and new-value identity. See lines 81-253.
- `gameSetupValidation.test.ts` covers valid output, role counts, unknown IDs, card limits, required and recommended dependencies, primary-team rules, and wake-sequence invariants. See lines 108-381.
- `narration.test.ts` covers sorting, duplicate-role handling, action ordering and flags, no-step and no-wake paths, preview output, input immutability, and the checked-in night-script and preview outputs. See lines 61-272.
- `templates.test.ts` covers wake-target rendering, instruction branches, unknown and inherited keys, modifiers, and duration defaults. See lines 209-271.

## Findings

### TF-001 — public-shape test does not observe production output

severity: high  
lane: test-falsification  
reviewer: 03k-reviewer-test-falsification  
evidence:

- `yourwolf-frontend/src/test/engine/templates.test.ts:275-320` constructs `engineRole`, `engineStep`, `action`, and `previewAction` as object literals inside the test, then compares each object’s own keys with hard-coded arrays.
- This test calls no production function and checks no value returned by the engine. Removing runtime construction or output fields while leaving the exported types available leaves these locally created objects unchanged, so the test remains green.
- The `Object.keys(...).toEqual(...)` assertions also pin JavaScript object insertion order. They do not prove a structural public shape independently of the test’s own literals.

### TF-002 — “normalizes ... to strings” is exercised only with strings

severity: medium  
lane: test-falsification  
reviewer: 03k-reviewer-test-falsification  
evidence:

- `yourwolf-frontend/src/test/engine/gameSetupValidation.test.ts:112-118` names the behavior as normalization, but supplies `['ww', 'robber', 'seer', 'insomniac']` and expects the identical string array.
- A mutation that removes string coercion or any normalization step survives this test because the input already has the expected representation. The test does not exercise a runtime non-string sequence or assert that the returned values were transformed.

### TF-003 — injected ID dependency is a self-configured mock without a call assertion

severity: medium  
lane: test-falsification  
reviewer: 03k-reviewer-test-falsification  
evidence:

- `yourwolf-frontend/src/test/engine/gameSession.test.ts:153-157` passes two callbacks that both return the same literal and asserts only that the two resulting sessions are equal.
- The test never records invocation, checks the callback’s returned ID directly, or makes the callback fail if unused. An implementation that ignores `id_generator` and emits any deterministic constant can satisfy the assertion. The test therefore cannot prove the injected dependency is used or that ambient ID generation is absent.

### TF-004 — caller-mutation checks use incomplete and shallow snapshots

severity: medium  
lane: test-falsification  
reviewer: 03k-reviewer-test-falsification  
evidence:

- `yourwolf-frontend/src/test/engine/gameSession.test.ts:144-151` snapshots only `role_ids` and `wake_order_sequence`, although the input also owns `roles` and `dependencies`. A valid-session mutation of either omitted collection survives the test.
- `yourwolf-frontend/src/test/engine/gameSession.test.ts:192-208` uses `{...started}` and `{...setup}` snapshots. Nested arrays such as `warnings` and `role_ids` remain shared references, so a rejected transition that mutates nested state can still compare equal to its snapshot.
- The invalid-create test at lines 159-179 serializes more fields, but it does not close the valid-path gap at lines 144-151.

## Test-run evidence

- Targeted command: `npm exec vitest run src/test/engine/gameSession.test.ts src/test/engine/gameSetupValidation.test.ts src/test/engine/narration.test.ts src/test/engine/templates.test.ts --reporter=verbose`.
- Result: 4 test files passed, 144 tests passed.
- Full command: `npm exec vitest run`.
- Result: 46 test files passed, 679 tests passed.
- Focused command: `npm exec -- vitest run src/test/engine/templates.test.ts src/test/engine/gameSetupValidation.test.ts src/test/engine/gameSession.test.ts -t 'public shape|normalizes a valid wake order sequence|uses a deterministic id generator' --reporter=verbose`.
- Result: the three cited weak tests passed, with 128 unrelated tests skipped.

## Mutation evidence

- A transient-copy negation mutation changed the expected started phase from `night` to `MUTATED`. The targeted game-session run exited nonzero, confirming that ordinary phase assertions can fail. No repository test or production file was changed.
