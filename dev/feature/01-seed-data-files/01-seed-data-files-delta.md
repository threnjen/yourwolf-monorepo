# 01 Seed Data Files Selection Delta

## Key Files

| File | Verified symbols or content | Selected-feature role |
|---|---|---|
| `yourwolf-backend/app/seed/abilities.py` | `ABILITIES_DATA`, `seed_abilities()` | Replace the inline 15-record catalog with validated file loading while preserving both public names and existing idempotent persistence behavior. |
| `yourwolf-backend/app/seed/roles.py` | `SeedDataError`, `_read_data_file()`, `_require_list()`, `load_seed_data()`, `KNOWN_ABILITY_TYPES` | Read-only reference for fail-fast JSON handling. It also imports `ABILITIES_DATA`, so the ability catalog remains an import-time dependency of role validation. |
| `yourwolf-backend/app/seed/data/roles.json` | Top-level `roles` and `role_dependencies` collections | Canonical role catalog copied unchanged to the frontend. |
| `yourwolf-backend/app/seed/data/abilities.json` | Does not exist at validation commit `c124fb8e5b366333722586bba7e94752e1394a82` | Phase-required canonical ability catalog to create. |
| `yourwolf-backend/app/seed/__init__.py` | `run_seed()` calls `seed_abilities()` before role seeding | Read-only call-site evidence for preserving the entry point and seed order. |
| `yourwolf-backend/app/models/ability.py` | `Ability.type`, `name`, `description`, `parameters_schema` | Read-only persistence-shape reference for loader validation. |
| `yourwolf-backend/tests/test_seed.py` | `seeded_official_db`, `TestSeedReferentialIntegrity`, `TestSeedEquality`, `TestSeedDataLoader` | Existing seed behavior, idempotency, role-loader failure seams, and the fixture pattern to extend for abilities. |
| `yourwolf-frontend/src/data/seed/roles.json` | Does not exist at the validation commit | Exact frontend copy to create. |
| `yourwolf-frontend/src/data/seed/abilities.json` | Does not exist at the validation commit | Exact frontend copy to create. |
| `[PROPOSED - name TBD]` | No frontend seed parity test exists | New Vitest parity suite. The implementer chooses its idiomatic path under `yourwolf-frontend/src/test/`. |
| `yourwolf-frontend/package.json` | Existing scripts: `dev`, `build`, `lint`, `preview`, `test`, `test:ui`, `test:coverage` | Add the phase-required seed refresh script without adding a dependency. |
| `yourwolf-frontend/package-lock.json` | Existing npm lockfile | Keep synchronized if the package manifest update changes lockfile metadata. |

## Current Constraints

- Keep `yourwolf-backend/app/seed/data/` canonical. Both package Docker builds use package-local contexts, so a monorepo-root catalog would not ship reliably.
- Preserve `ABILITIES_DATA` because `yourwolf-backend/app/seed/roles.py` and `yourwolf-backend/tests/test_seed.py` import it directly.
- Preserve `seed_abilities()` and its idempotent lookup by ability `type`; `run_seed()` and the seeded database fixture call it directly.
- Validate the entire ability file before `seed_abilities()` begins database work. Missing files, unreadable files, malformed JSON, wrong top-level shape, non-object entries, missing required fields, and invalid field shapes must raise a seed-data error.
- The established `SeedDataError` currently lives in `roles.py`, while `roles.py` imports `ABILITIES_DATA` from `abilities.py`. Reusing that class through a reverse top-level import would create a circular import. The implementation must preserve top-level imports and avoid introducing a second parallel error vocabulary without resolving this dependency direction.
- Preserve every ability record's `type`, `name`, `description`, and `parameters_schema` content exactly. Do not normalize or reinterpret JSON Schema values.
- The frontend parity test must read the backend files by relative path and must not rewrite either canonical or copied file during the test.
- The refresh command copies both canonical files only. It must work from the `yourwolf-frontend` package context and must not require a new package.
- Existing seed assertions must remain at least as strong. The plan excludes repository interfaces, IndexedDB, API changes, role-seed semantic changes, and a monorepo-root data location.
- Apply relevant learnings: canonical seed data remains in the backend, parity must fail on drift, and official role JSON key absence must remain unchanged.

## Verification Assets

| Asset | What it verifies |
|---|---|
| `yourwolf-backend/tests/test_seed.py::TestSeedReferentialIntegrity.test_every_ability_type_exists_in_abilities_data` | Every role step still resolves through the public `ABILITIES_DATA` catalog. |
| `yourwolf-backend/tests/test_seed.py::TestSeedEquality.test_fresh_seed_matches_pre_refactor_snapshot` | The complete role and ability-backed seeded outcome remains equal to the pre-refactor snapshot. |
| `yourwolf-backend/tests/test_seed.py::TestSeedEquality.test_seed_is_idempotent` | Repeated seeding remains a no-op. |
| `yourwolf-backend/tests/test_seed.py::TestSeedDataLoader` | Existing temporary-file patterns and `SeedDataError` assertions for missing, malformed, and inconsistent seed data. |
| Backend focused command from the manifest | From `yourwolf-backend`: `uv run pytest tests/test_seed.py`. |
| Backend full baseline artifact | `dev/feature/PHASE_05A-baseline/backend-pytest.xml`: 492 passed, 0 failed at the validation commit. |
| Frontend full baseline artifact | `dev/feature/PHASE_05A-baseline/frontend-vitest.xml`: 685 passed, 0 failed at the validation commit. |
| Frontend parity suite at `[PROPOSED - name TBD]` | Must compare both frontend copies with both backend canonical files and include a mutation proof that makes the guard fail. |
| Refresh-script check | Run the new npm script from `yourwolf-frontend`, then run the parity suite and verify that no tracked seed file differs. |

No new test run was performed during selection. The manifest's executed-green baseline remains the current test evidence.

## Discoveries

| Finding | Impact | Action |
|---|---|---|
| `abilities.py` contains exactly 15 inline records and exposes only `seed_abilities()` as a graph-indexed function. | AC1 and AC2 target the correct implementation seam. | Keep `ABILITIES_DATA` as the loaded compatibility surface and preserve `seed_abilities()`. |
| `roles.py` derives `KNOWN_ABILITY_TYPES` from `ABILITIES_DATA` during module import. | Invalid canonical ability data can prevent role seed data from loading, which is consistent with fail-fast startup. It also makes loader import direction significant. | Validate the ability catalog before exposing `ABILITIES_DATA`; avoid a reverse `abilities.py` to `roles.py` import. |
| `SeedDataError` and the reusable JSON helpers are defined inside `roles.py`, not in a neutral seed-data module. | The plan's singular error contract cannot be reused from `abilities.py` through a direct top-level import without a cycle. | Resolve the dependency direction within the selected feature while retaining one coherent seed-data failure contract. This refines implementation constraints but does not change acceptance criteria. |
| The existing role loader validates container shape, required keys, enums, and references, but explicitly leaves most field values to database constraints. | Ability loading needs its own required type and shape checks because AC3 requires invalid field shapes to fail before database writes. | Add focused malformed ability-file cases instead of assuming role-loader validation is sufficient. |
| `test_seed.py` already has temporary-file helpers and clear failure-message assertions, but no ability-loader entry point or malformed ability-file cases exist. | The planned backend tests are additions to an established suite, not a new test framework. | Extend this suite without weakening the snapshot, referential-integrity, or idempotency tests. |
| Neither frontend seed directory nor a seed parity suite exists. | AC4 and AC5 are entirely new artifacts. | Create both copies and one failure-capable Vitest parity suite at an implementer-chosen path. |
| The frontend has no seed refresh script and no existing filesystem-test convention under `src/test/`. Transitive tooling already references Node types, but the project does not declare a direct filesystem helper dependency. | The refresh and parity mechanisms must use the existing Node/npm toolchain and stay dependency-free. | Use a package-local Node/npm mechanism and verify it under the existing TypeScript build and Vitest configuration. |
| The backend and frontend baseline suites were green at the validation commit. | Stage 0 remains unnecessary. | Use the focused seed suites first, then the existing full gates. |

## Selected Plan Patch

No plan patch was made. Verified source refines the import-direction constraint around `SeedDataError`, but it does not contradict the selected plan's acceptance criteria, scope, or stages.
