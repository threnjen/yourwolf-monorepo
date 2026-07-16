# Tasks: Backend Seed Role Data Files

## Stage 1: Data extraction + loader

- [ ] Create `app/seed/data/` and extract the 30 role definitions from `ROLES_DATA` in `app/seed/roles.py` into a data file (`app/seed/data/roles.json` `[PROPOSED - name TBD]`; JSON preferred per audit, format is implementer's final call). Serialize `Team` enum values as their string values (AC1)
- [ ] Include the 9 `ROLE_DEPENDENCIES_DATA` entries (source role name, target role name, `DependencyType` string) in the data file — as a section of the same file or a clearly named sibling section (AC1)
- [ ] Rewrite `app/seed/roles.py` as a thin loader: read the data file, validate it, reconstruct enum values (`Team`, `DependencyType`), and produce objects identical to the previous in-memory `ROLES_DATA` / `ROLE_DEPENDENCIES_DATA` structures (AC2)
- [ ] Preserve public module surface: `seed_roles(db)`, `seed_role_dependencies(db)`, and module-level `ROLES_DATA` (imported by `app/seed/__init__.py` and `tests/test_seed.py`) keep working unchanged; leave seed-time DB behavior, idempotency checks, and existing log messages untouched (AC2)
- [ ] Implement fail-fast loader validation: missing file, malformed JSON, unknown enum value, or dangling role-dependency/ability-type reference raises a clear error before any seeding occurs — no partial seed (edge cases, Section B)
- [ ] Verify packaging: confirm no `.dockerignore` excludes the data file and that `Dockerfile`'s `COPY . .` ships `app/seed/data/` into the image (AC5)

## Stage 2: Verification hardening

- [ ] Add AC3 equality evidence: automated test or scripted comparison showing seeding a fresh database yields an identical outcome to the pre-refactor path — same 30 roles, same field values, same relationships (test name `[PROPOSED - name TBD]`) (AC3)
- [ ] Strengthen `tests/test_seed.py`: assert role count == 30 (AC4)
- [ ] Strengthen `tests/test_seed.py`: assert full field-level equality for at least one role, including ability steps and win conditions (AC4)
- [ ] Strengthen `tests/test_seed.py`: assert referential integrity — every dependency source/target resolves to a defined role, and every `ability_type` referenced by a role's ability steps exists in `ABILITIES_DATA` (AC4)
- [ ] Confirm the two existing wake-order tests (`test_doppelganger_wake_order_is_1`, `test_copycat_wake_order_is_1`) still pass against the loader-produced `ROLES_DATA`
- [ ] Run full suite: `uv run --no-project --python 3.14 --with-requirements requirements-dev.txt pytest -q` — all tests green, coverage gate (80%) still satisfied (baseline: 250 passed, 89.49%)
- [ ] Manual QA: run the seed command inside the Docker environment (`docker compose` backend service) and verify the app lists 30 roles (AC5)
