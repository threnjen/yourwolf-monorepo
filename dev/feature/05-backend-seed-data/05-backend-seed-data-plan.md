# Plan: Backend Seed Role Data Files

## Execution Metadata

- **Wave:** 2
- **Parallel safe:** yes
- **Depends on:** 02-backend-config-database
- **Key files modified:** `yourwolf-backend/app/seed/roles.py`, `yourwolf-backend/app/seed/data/roles.json` [PROPOSED - name TBD] (new), `yourwolf-backend/app/seed/abilities.py` (verify), `yourwolf-backend/tests/test_seed.py`
- **Sequential reason:** depends on 02 because seed modules consume the engine/session accessors 02 rewires (runtime dependency; file overlap limited to `app/seed/__init__.py` (verify)). Parallel-safe within Wave 2.

Source: refactor audit finding 1.1 (Low) and restructuring item 10 in `dev/refactor-audit-backend/refactor-audit-backend-report.md`.

## A. Requirements & Traceability

Acceptance criteria:

- **AC1**: The 30 role definitions embedded as Python literals in `app/seed/roles.py` (1,091 lines) move to a data file (JSON preferred per audit; format final call is the implementer's) under `app/seed/data/`, including role→ability/dependency relationships.
- **AC2**: `app/seed/roles.py` becomes a thin loader that reads and validates the data file and produces the same objects the seeding routine consumed before.
- **AC3**: Seeding a fresh database yields a byte-identical outcome to the previous code path: same 30 roles, same field values, same relationships (verified by test or scripted comparison, not by eye).
- **AC4**: `tests/test_seed.py` (currently 17 lines — audit flags coverage as weak) is strengthened to assert role count, at least one full role's field-level equality, and referential integrity of dependencies/abilities.
- **AC5**: The data file ships with the package (verify packaging/Docker copy includes `app/seed/data/`).

Non-goals: no changes to seed CLI entry point behavior (`app/seed/__main__.py` interface unchanged); no changes to ability seed structure unless required for relationships (verify `abilities.py` coupling).

| Acceptance Criteria | Code Areas/Modules | Test / Evidence Category |
|---|---|---|
| AC1–AC2 | `seed/roles.py`, `seed/data/` | Code-review evidence + AC3 test |
| AC3 | seeding path | Must-have automated test: seeded DB snapshot equality — scenario, name [PROPOSED - name TBD] |
| AC4 | `tests/test_seed.py` | New tests (this is the risk mitigation the audit demands — coverage is weak) |
| AC5 | Dockerfile / packaging (verify) | Manual QA: seed runs inside container |

## B. Correctness & Edge Cases

- Enum-valued fields (`Team`, `Visibility`, `StepModifier`) must round-trip through the data format exactly.
- Cross-references between roles (dependencies) and abilities must be expressed by stable keys (names or explicit ids) and resolved by the loader with a hard failure on dangling references.
- Loader failures (missing file, malformed JSON, unknown enum value) must fail fast with a clear error, not seed partially.

## C. Consistency & Architecture Fit

- Mirrors the roadmap's Phase 06 need for "bundled seed data" — a data file is directly reusable by the future desktop bundle; note this in loader docstring only if a docstring pattern exists.

## D. Clean Design & Maintainability

One data file + one loader. Do not build a generic data-loading framework; this loads exactly one known file.

## E. Observability, Security, Operability

- No new normal-path logs (seeding already reports whatever it reports today — preserve).
- Rollback: revert; seeding is idempotent/destructive per current behavior — do not change that behavior.

## F. Test Plan

- Must-have: AC3 equality test and AC4 integrity tests (scenarios; names [PROPOSED - name TBD]).
- Existing tests to update: `tests/test_seed.py` grows; no other suites affected.
- Manual QA: run seed command in the Docker environment; verify app lists 30 roles.

## Stage 1: Data extraction + loader
**Goal**: AC1, AC2, AC5
**Success Criteria**: Loader produces identical in-memory definitions; container packaging verified
**Status**: Not Started

## Stage 2: Verification hardening
**Goal**: AC3, AC4
**Success Criteria**: Equality + integrity tests green; full suite green
**Status**: Not Started
