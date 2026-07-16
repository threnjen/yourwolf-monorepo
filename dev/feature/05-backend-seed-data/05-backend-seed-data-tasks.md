# Tasks: Backend Seed Role Data Files

## Stage 1: Data extraction + loader

- [x] Create `app/seed/data/` and extract the 30 role definitions from `ROLES_DATA` in `app/seed/roles.py` into a data file (`app/seed/data/roles.json`; JSON chosen per audit preference). Serialize `Team` enum values as their string values (AC1)
- [x] Include the 9 `ROLE_DEPENDENCIES_DATA` entries (source role name, target role name, `DependencyType` string) in the data file — as the `role_dependencies` section of `app/seed/data/roles.json` (AC1)
- [x] Rewrite `app/seed/roles.py` as a thin loader: read the data file, validate it, reconstruct enum values (`Team`, `DependencyType`), and produce objects identical to the previous in-memory `ROLES_DATA` / `ROLE_DEPENDENCIES_DATA` structures (AC2) — 1091 → 393 lines
- [x] Preserve public module surface: `seed_roles(db)`, `seed_role_dependencies(db)`, and module-level `ROLES_DATA` keep working unchanged; seed-time DB behavior, idempotency checks, and existing log messages left untouched (AC2)
- [x] Implement fail-fast loader validation: missing file, malformed JSON, unknown enum value, or dangling role-dependency/ability-type reference raises `SeedDataError` before any seeding occurs — no partial seed (edge cases, Section B)
- [x] Verify packaging: confirmed no `.dockerignore` exists in the backend build context, the data file is not git-ignored, and `Dockerfile`'s `COPY . .` ships `app/seed/data/` into the image (AC5)

## Stage 2: Verification hardening

- [x] Add AC3 equality evidence: `test_fresh_seed_matches_pre_refactor_snapshot` seeds a fresh database and compares against `tests/data/expected_seed_snapshot.json`, generated from the pre-refactor code path before `roles.py` was modified (AC3)
- [x] Strengthen `tests/test_seed.py`: assert role count == 30 (AC4)
- [x] Strengthen `tests/test_seed.py`: assert full field-level equality for at least one role, including ability steps and win conditions (`test_werewolf_role_field_equality`) (AC4)
- [x] Strengthen `tests/test_seed.py`: assert referential integrity — every dependency source/target resolves to a defined role, and every `ability_type` referenced by a role's ability steps exists in `ABILITIES_DATA` (AC4)
- [x] Confirm the two existing wake-order tests (`test_doppelganger_wake_order_is_1`, `test_copycat_wake_order_is_1`) still pass against the loader-produced `ROLES_DATA`
- [x] Run full suite — 319 passed, 0 failed, 94.21% coverage (gate 80% satisfied; baseline 282 passed / 89.83%)
- [ ] Manual QA: run the seed command inside the Docker environment (`docker compose` backend service) and verify the app lists 30 roles (AC5) — **deferred: Docker daemon unavailable in the implementation environment.** Partially mitigated by running the real CLI entry point `python -m app.seed` from a foreign cwd (seeded 30 roles / 9 deps successfully), which validates the `__file__`-relative data-file resolution used under `WORKDIR /app`
