# Project Learnings

## Nullable JSON fields need explicit engine parity tests

- **An optional TypeScript property does not model a runtime JSON `null` value.** When a backend schema accepts both omitted and `null`, add a null-input test and normalize it before spreading or iterating. The signal is a nullable transport field entering a pure engine contract that only declares `field?: T`.

## Coverage comparisons need clean source trees

- **Run paired V8 coverage from clean writable exports, not a development checkout with generated output.** Generated `dist/` or prior `coverage/` JavaScript can enter the measured file set and lower repository totals even when every source test passes. The signal is a coverage table that lists generated directories or configuration files as zero-percent application code.

## Focused Pytest Coverage

- **A single backend test file exits nonzero under the repository coverage gate even when every test passes.** The signal is a focused `uv run pytest tests/test_seed.py` run reporting all tests passed followed by `FAIL Required test coverage of 80% not reached`; use `--no-cov` for focused JUnit evidence and retain the full-suite coverage run as the gate.

## IndexedDB Transaction Failure Injection

- **Defer creating an IndexedDB request until after failure-injection checks.** Passing a request promise as an argument evaluates it before the helper can throw, leaving an unhandled abort when the transaction is intentionally rolled back. The signal is a green test with a Vitest unhandled `AbortError`.

## IndexedDB Snapshot Row Identity

- **Validate persistence metadata and embedded snapshot identity together on reads.** The signal is a row whose lookup key matches but whose wrapper timestamp or session id is corrupt, which a snapshot-only guard accepts.

## Async Snapshot UI Ordering

- **Await local snapshot writes before changing route or phase state.** The signal is a UI action that derives a next game phase and calls `refetch` or navigation before its asynchronous repository `put` resolves. Keep the previous rendered phase when the write rejects.

## Crypto Callback Binding

- **Pass `crypto.randomUUID` through a wrapper when an API invokes the generator as a callback.** The signal is a browser-only `TypeError` requiring `this` to be a `Crypto` instance, while direct `crypto.randomUUID()` calls work.
