# QA Coverage Map: Refactor Audit Remediation

**Date:** 2026-07-16
**Scope:** All 12 features in `dev/feature/01-…` through `dev/feature/12-…`
**QA plan:** `dev/refactor-audit-qa.md`

## Automated baseline (given, not re-derived)

- Backend: 492 passed / 96.08% coverage
- Frontend: 535 passed / 0 failed; `npm run build` PASS; `npm run lint` PASS
- All three frontend gates were RED at the phase baseline and are now green.

## Filtering principle for this phase

This is a pure refactor of a working app. Every AC is of the form "behavior is unchanged
and structure improved." Structure is verified by code review; behavior is verified by
tests. Manual QA is therefore justified only where (a) an implementer recorded that the
verification could not be executed, or (b) the evidence exists only outside a real runtime
(no container, no browser, no HTTP round-trip). Everything else defaults to **No**.

## Coverage Map

| Feature | AC | Automated Coverage | Manual QA Needed? | Reason |
|---|---|---|---|---|
| 01-backend-schema-surface | AC1 barrel exports preview schemas | `tests/test_schemas.py` import assertions | No | Import graph, assertable |
| 01 | AC2 dead schema classes deleted | Suite green; grep evidence | No | Deletion of unreferenced code |
| 01 | AC3 `modifier` typed `StepModifier`; invalid → 422 | `test_invalid_modifier_returns_422_at_api_boundary` pins status + `loc` + `type` through a real HTTP response | **Yes — confirm intent only** | Status/body assertable and asserted; the **contract change 400→422 and string→array `detail`** needs human sign-off that no client depends on the old shape |
| 01 | AC4 serialization unchanged | `test_modifier_serializes_to_bare_string_in_api_response` | No | Wire format asserted |
| 02-backend-config-database | AC1 `Base` relocated; import triggers no engine | `tests/test_database.py` | No | Import-time behavior, assertable |
| 02 | AC2 lazy `get_settings()` | Unit tests | No | Pure logic |
| 02 | AC3 lazy engine/`SessionLocal` | `TestLazyEngine` (6 tests) | No | Assertable |
| 02 | AC4 conftest env hack removed | Suite passes without it | No | Self-proving |
| 02 | AC5 `import app.models.role` with no `DATABASE_URL` | Scripted check | No | Assertable |
| 02 | AC6 app boots and serves | Suite + uvicorn/SQLite smoke boot (`/`, `/health`, `/api/v1/roles/`, CORS preflight) | **Yes — Postgres/container only** | Smoke was uvicorn + SQLite, **not** `docker compose`. Postgres + alembic + lazy engine under the real deployment topology never observed |
| 03-frontend-domain-foundation | AC1 single-source `TEAMS` | `tsc` + domain tests | No | Type/graph, assertable |
| 03 | AC2 `MODIFIER_LABELS` defined once | `tsc` + component tests | No | Assertable |
| 03 | AC3 constants moved to domain | `tsc` + tests | No | Assertable |
| 03 | AC4 `createEmptyDraft()` relocated | Domain tests | No | Pure function |
| 03 | AC5 `capitalize()` moved; 5 importers | `tsc` | No | Compile-time |
| 03 | AC6 ESLint import-boundary rule | `npm run lint` PASS | No | Gate is green; superseded by 12/AC3 |
| 03 | AC7 build + suite no new failures | Gates green | No | Suite-level |
| 04-backend-domain-exceptions | AC1 exception vocabulary | `tests/test_exceptions.py` | No | Class hierarchy, assertable |
| 04 | AC2 handlers map 404/400/403 | `tests/test_exceptions.py`, router tests | No | Status codes asserted |
| 04 | AC3 substring `"not found"` routing removed | `TestStartGameEndpoint` / `TestAdvancePhaseEndpoint` (**newly written — the planned anchor did not exist**) | **Yes** | Manifest requires it, and this was the feature's central change with **zero** HTTP coverage before this feature wrote it. Cheap to confirm against a live server |
| 04 | AC4 try/except blocks removed | Suite green | No | Structural |
| 04 | AC5 status codes + bodies unchanged | Router tests | No | Assertable (covered by the AC3 walk above) |
| 05-backend-seed-data | AC1 roles → `data/roles.json` | AC3 snapshot test | No | Data equality asserted |
| 05 | AC2 thin loader | `TestSeedDataShape` | No | Assertable |
| 05 | AC3 byte-identical seed outcome | `test_fresh_seed_matches_pre_refactor_snapshot` vs a snapshot captured from the **pre-refactor** code path | No | Strongest possible evidence; already programmatic |
| 05 | AC4 `test_seed.py` strengthened | 2 → 28 tests | No | Self-proving |
| 05 | **AC5 data file ships with the package** | **NONE. Status in the record: "Done (container QA deferred)". Docker daemon unavailable.** Mitigated only by static reasoning (`COPY . .`, no `.dockerignore`, not git-ignored) and a host-side `python -m app.seed` from a foreign cwd | **YES — HIGHEST PRIORITY** | **Explicitly UNVERIFIED, not met.** The loader resolves `DATA_FILE = Path(__file__).parent / "data" / "roles.json"`; correctness under `WORKDIR /app` in the built image is unproven. A miss here means seeding fails in the real deployment. Requires a container build + run |
| 06-frontend-game-rules | AC1 cascade logic extracted | Domain unit tests | No | Pure function |
| 06 | AC2 wake-order group/shuffle/flatten, injectable RNG | Domain tests, deterministic RNG | No | Pure function |
| 06 | AC3 renumber/modifier/coercion extracted | Domain tests | No | Pure function |
| 06 | AC4 hook drops `NavigateFunction` | Hook tests + `tsc` | No | Assertable |
| 06 | AC5 shared `WakeOrderRouterState` type | `tsc` | No | Compile-time |
| 06 | AC6 domain modules unit-tested | Tests exist | No | Self-proving |
| 06 | AC7 page tests pass; **observable UI unchanged** | Suite green | **Yes — partial** | Suite proves the JSDOM contract; "observable UI unchanged" across the real cascade → wake-order → facilitator route chain is a browser judgement |
| 07-backend-validation-consolidation | AC1 count rule → service | Service + router tests | No | Assertable |
| 07 | AC2 name bounds reconciled to 2-50 | Schema tests; `test_role_names_respect_length_bounds` pins all 30 seed names inside the bound | No | Assertable; seed compatibility proven |
| 07 | **AC3 create invokes full `validate_role` rule set** | `TestCreateValidateAgreement` (9 tests) proves create/validate agreement | **Yes — confirm intent only** | **Unplanned contract change:** `POST /roles` now **requires ≥1 win condition** and rejects payloads that previously succeeded. Implementer requested explicit sign-off. Rule is asserted; the question "can a real client hit this?" is a UI walk |
| 07 | AC4 status codes preserved w/ recorded shifts | `test_validate_endpoint_422s_on_out_of_bounds_name` | **Yes — confirm intent only** | Recorded shift: name-length violations now **422** (not 400/error-list), **including on `/roles/validate`**. Needs human sign-off, not re-testing |
| 07 | AC5 tests moved not deleted | Suite green | No | Structural |
| 08-frontend-abilities-step | AC1 decomposition | 3 new per-seam suites (46 tests) | No | Structural + rendered |
| 08 | AC2 rules delegate to `domain/abilitySteps` | Grep + isolation tests | No | Structural |
| 08 | AC3 files < ~200 lines | `wc -l` | No | Mechanical |
| 08 | AC4 test split, no assertion loss | 29 → 75 tests; anchor byte-for-byte unmodified | No | Counted |
| 08 | **AC5 "wizard renders and operates identically"** | **PARTIAL.** Suite parity proven by execution (474→520 passed, same 3 pre-existing failures); the unmodified 29-test anchor is strong drift evidence. Record: "Manual QA not performed — I cannot drive a browser" | **YES** | The **"renders and operates identically"** half of AC5 is a visual/interaction claim JSDOM cannot make. Implementer explicitly asks for a human walk |
| 09-backend-service-validators | AC1 game validators extracted | Relocated tests | No | Assertable |
| 09 | AC2 role validators extracted | `tests/test_role_validation.py` | No | Assertable |
| 09 | AC3 shared `paginate()` helper | List-endpoint tests | No | Return values assertable |
| 09 | AC4 services < ~400 lines; signatures unchanged | `wc -l` + suite | No | Mechanical |
| 09 | AC5 test split; assertions ≥ before | Counted | No | Self-proving |
| 10-backend-narration-package | AC1 pure templates module | `tests/test_narration_templates.py`, 100% coverage | No | Pure functions, exact-equality |
| 10 | AC2 input dataclasses; stand-ins deleted | Adapter tests | No | Assertable |
| 10 | AC3 builder owns assembly; API frozen | `test_narration_script_builder.py`; routers needed **0 edits** | No | Assertable |
| 10 | **AC4 byte-identical scripts, 30 seed roles** | **STRONG.** Old-vs-new harness diffed **30/30 real seed roles** + default/custom/partial wake order + previews — all byte-identical. Durable oracle: 66 exact-equality template cases verified against **both** old and new implementations | **Yes — thin HTTP check only** | Record gap: "Manual QA not performed — no app instance available." Byte-parity beats a spot check, so do **not** re-verify copy by eye. The one thing never observed is an **HTTP round-trip through the real routers** to a real DB |
| 10 | AC5 test split; assertions ≥ before | 83 → 139 asserts | No | Counted |
| 10 | AC6 preview schemas relocated OR rejected | Move rejected, rationale recorded | No | Documented decision |
| 11-frontend-type-split | AC1 transport vs domain types split | `tsc` | No | Compile-time |
| 11 | AC2 degenerate aliases resolved | `tsc` | No | Compile-time |
| 11 | AC3 domain imports zero transport types | Lint boundary rule + `tsc` | No | Enforced by gate |
| 11 | AC4 30 importers updated; no `any`-bridging | `npm run build` PASS | No | Compile-time |
| 11 | AC5 suite passes | 535 passed | No | Suite-level |
| 12-frontend-dead-code-and-tests | AC1 `useDrafts` deleted | Grep + suite green | No | Deletion of orphan |
| 12 | AC2 dead API methods deleted | `roles.api.test.ts`, `games.api.test.ts` | No | Assertable |
| 12 | AC3 `BasicInfoStep` layer violation fixed; zero exemptions | `useNameCheck.test.ts` (11 tests); `npm run lint` PASS | **Yes — thin** | Manifest requires confirming the **boundary rule is active with zero exemptions**, i.e. the green is real and not vacuous. One command |
| 12 | AC4 `src/test/` mirrors source | Name-level parity 535 → 535 | No | Counted |
| 12 | AC5 page-suffix naming | `routes.test.tsx` + `tsc` | No | Compile-time |
| 12 | AC6 suite GREEN + lint clean | All gates green | No | Gate output |
| 12 | AC7 `npm run build` GREEN | `tsc --noEmit` exit 0 | No | Gate output |
| 12 | AC8 `react-hooks` plugin enforced | Rule probe (verified, not assumed) | No | Probed |
| 12 | **AC9 422 detail arrays parsed** | `errors.api.test.ts` (15 tests) + a 422 test in `RoleBuilder.test.tsx` — both with **mocked** axios rejections | **YES** | The unit tests assert the reader handles a **hand-written** 422 body. Nothing proves the **real backend's** 422 shape matches that fixture. This is the exact seam where feature 07's contract change meets feature 12's parser — a real 422 must travel the wire |

## Summary

- Total ACs classified: 62
- Manual QA needed: 11 (2 highest-priority, 4 confirm-intent-only, 5 walkthrough/thin)
- Manual QA not needed: 51
