# Refactor Audit — yourwolf-backend

**Date:** 2026-07-16
**Auditor:** Refactor Auditor (structural/architectural)
**Scope:** `yourwolf-backend/app/` (source) and `yourwolf-backend/tests/` (reduced lens). Excluded: `.venv/`, `alembic/` (migrations), config, Docker, docs per domain scope.

---

## 1. Executive Summary

- **Files audited:** 33 source files (`app/`), 14 test files (`tests/`) — ~4,000 app LOC, ~5,600 test LOC
- **Findings:** Critical: 0 · High: 2 · Medium: 9 · Low: 7

### Architectural Health Scores (1–5)

| Dimension | Score | Notes |
|---|---|---|
| Directory & module organization | 4.5 | Clean layer-based layout (routers/services/schemas/models/seed) |
| Import graph & dependency health | 3.5 | No cycles; but `database.py`/`config.py` import-time side effects create a fragile hub |
| Component decomposition | 3 | Three services >500 lines mixing multiple responsibilities |
| Coupling & cohesion | 3 | Global engine/settings singletons; services coupled to API DTOs |
| Separation of concerns | 3 | Validation split across router/schema/service; string-matched error routing; English narration copy in service layer |
| API surface & encapsulation | 3.5 | Barrels exist but are stale and mostly unused; dead schema classes |

### Top 5 Priority Items

1. **(High)** Import-time side effects in `app/database.py` and `app/config.py` — engine and settings created at module import, forcing the `os.environ` hack at `tests/conftest.py:8-14` and coupling every model import to a live engine.
2. **(High)** `app/services/script_service.py` (541 lines) is a god module: DB querying, wake-order sequencing, a 15-method narration template engine, durations table, and preview stand-in shims in one file.
3. **(Medium)** Domain error contract leaks: `app/routers/games.py:130` routes 404 vs 400 by substring-matching `"not found"` in a `ValueError` message.
4. **(Medium)** Game-creation validation is split across two layers: card-total rule in `app/routers/games.py:40-49`, all other rules in `GameService`.
5. **(Medium)** `app/schemas/__init__.py` barrel is stale — missing `NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest`; `AbilityStepCreate`/`AbilityStepRead` are exported but unused anywhere (dead API surface).

---

## 2. Findings by Category

### Category 1 — Directory & Module Organization

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 1.1 | `app/seed/roles.py` | L15–end | Low | 1,091-line data-as-code module | 30 role definitions embedded as Python literals inside the app package. Data belongs in JSON/YAML data files (or split per-team modules) with a thin loader; current form inflates the package and makes seed diffs noisy. |
| 1.2 | `app/database.py` | L21–L24 | Low | `Base` co-located with engine wiring | The declarative `Base` (a model-layer concern) lives in the same module as engine/session creation (infrastructure). Every model imports `database.py` and thereby triggers engine creation (see 2.1). `Base` belongs in `app/models/base.py`. |
| 1.3 | `app/schemas/role.py` | L219–L244 | Low | Script-preview schemas in `role.py` | `NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest` are script/narration DTOs consumed by `ScriptService`, while their siblings (`NarratorAction`, `NightScript`) live in `schemas/game.py`. Narration schemas are split across two modules by endpoint location rather than domain. |

### Category 2 — Import Graph & Dependency Health

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 2.1 | `app/database.py`, `app/config.py` | database L11–L15, config L26 | **High** | Import-time side effects on the highest fan-in modules | `settings = Settings()` and `engine = create_engine(...)` execute on import. Because every model imports `Base` from `database.py`, importing *any* model requires a valid `DATABASE_URL`. This forced the module-level `os.environ` workaround at `tests/conftest.py:8-14` (with an apologetic comment) and makes the app untestable/unimportable without env mutation ordering. Fragile change point with fan-in from all 8 models, 4 routers, seed, and tests. |
| 2.2 | `app/schemas/__init__.py`, `app/services/__init__.py`, `app/models/__init__.py` | — | Low | Barrels exist but are bypassed | Only `alembic/env.py:10-11` imports through `app.models`; no app code imports via `app.schemas` or `app.services` barrels. Not wrong, but the barrels don't currently define the public surface they claim to (see 6.1, 6.2). |
| 2.3 | `app/schemas/ability.py` | L38–L71 | Medium | Dead schema classes | `AbilityStepBase`, `AbilityStepCreate`, `AbilityStepRead` have zero importers outside the stale barrel re-export. The live step schemas are `AbilityStepInRole`/`AbilityStepCreateInRole` in `schemas/role.py`. Orphaned API surface invites drift and confusion about which step schema is canonical. |
| 2.4 | `app/models/user.py` | — | Low | Near-orphaned model | `User` is referenced only via relationships (`Role.creator`, `GameSession.facilitator`) and alembic metadata; no router, service, or schema exposes it. Acceptable as forward-looking scaffolding, but flag so it isn't presumed wired. |

### Category 3 — Component & Module Decomposition

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 3.1 | `app/services/script_service.py` | L1–L541 | **High** | God module: script service mixes 4 responsibilities | (a) DB queries + wake-order sequencing (`generate_night_script`, L100–L211); (b) a narration template engine — 15 `_*_instruction` methods (L408–L530) plus `STEP_DURATIONS` (L74–L90); (c) preview orchestration with `_StandIn*` shim dataclasses and Protocols (L23–L67, L213–L278); (d) instruction dispatch (L364–L406). The template engine is pure string generation with no DB dependency and should be a separate `narration`/`templates` module; the stand-in shims exist only because the generator is typed against ORM shapes. |
| 3.2 | `app/services/role_service.py` | L1–L519 | Medium | Multi-responsibility service >500 lines | CRUD (L49–L388), validation rule engine (`validate_role` L410–L485, `get_warnings` L487–L518), duplicate-name checks, and hand-rolled ORM→DTO mapping (L36–L47, L98–L127, L152–L199). Validation + warnings are a cohesive unit that could be `role_validation.py`; mapping could be schema-side (`model_validate` with computed fields) or a mapper module. |
| 3.3 | `app/services/game_service.py` | L1–L507 | Medium | Multi-responsibility service >500 lines | Game lifecycle (create/start/advance/delete), four private validators (`_validate_card_counts`, `_validate_primary_teams`, `_validate_dependencies`, `_validate_wake_sequence`, L128–L280), and response mapping (`_to_response`, L465–L506). The validator block (~150 lines) is a natural extraction (`game_setup_validation.py`) mirroring 3.2. |
| 3.4 | `tests/test_script_service.py` | L1–L1273 | Medium | Oversized test file | 1,273 lines covering night-script generation, per-ability instruction templates, and preview endpoint behavior. Split along the same seams as 3.1 (script orchestration vs. instruction templates vs. preview). |
| 3.5 | `tests/test_game_service.py`, `tests/conftest.py`, `tests/test_roles.py` | — | Low | Large test modules | 950 / 593 / 682 lines respectively. `test_game_service.py` mixes lifecycle and validation tests; `conftest.py` carries many entity fixtures that could move to a `tests/fixtures/` package if growth continues. Below the urgency of 3.4. |

### Category 4 — Coupling & Cohesion

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 4.1 | `app/config.py`, `app/database.py`, `tests/conftest.py` | config L26; database L11–L18; conftest L8–L14 | Medium | Hidden global singletons | `settings`, `engine`, `SessionLocal` are module-level globals consumed implicitly. Tests must mutate `os.environ` before any import and separately override `get_db`. A `get_settings()` (cached) + lazily created engine, or app-lifespan wiring, removes the ordering hazard. (Root cause of 2.1; listed here for the coupling dimension.) |
| 4.2 | `app/services/script_service.py` | L23–L67, L229–L249 | Medium | Duck-typed stand-in shims to bridge ORM coupling | `_StandInRole/_StandInStep/_StandInAbility` + `_RoleLike/_StepLike` Protocols exist solely because narration generation is written against ORM object shapes. If generation consumed a plain domain dataclass (built from either ORM or preview payload), the shims and Protocols disappear. |
| 4.3 | `app/services/*.py` | — | Low | Services return transport DTOs directly | All services construct and return Pydantic response schemas (`RoleRead`, `GameSessionResponse`, paginated wrappers). Standard FastAPI practice at this size, but it hard-couples business logic to the HTTP response shape — any API reshape ripples into services. Acceptable now; note if a non-HTTP consumer (websocket, worker) appears. |

### Category 5 — Separation of Concerns

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 5.1 | `app/routers/games.py` | L130–L136 | Medium | Error routing by exception-message substring | `start_game` decides 404 vs 400 by `"not found" in str(e).lower()`. `GameService` overloads `ValueError` for both "missing entity" and "invalid state". A wording change silently converts 404s into 400s. Needs distinct exception types (e.g., `NotFoundError` vs `ValidationError`) or a domain-exception → HTTP mapping layer. |
| 5.2 | `app/routers/games.py`, `app/services/game_service.py` | games L40–L49; game_service L61–L95 | Medium | Game-creation validation split across layers | The role-count-vs-players rule lives in the router; card counts, primary teams, dependencies, and wake-sequence rules live in the service. One rule set, two homes — a caller invoking `GameService.create_game` directly bypasses the count check. |
| 5.3 | `app/services/role_service.py`, `app/schemas/role.py` | role_service L422–L435; role.py L61 | Medium | Role name validation duplicated/contradictory across schema and service | Schema enforces `min_length=1, max_length=100` (L61); service's dry-run validator enforces 2–50 chars (L426–L429). `create_role` (service) never calls `validate_role`, so `POST /roles` accepts names the `/validate` endpoint rejects. Validation rules need a single home with consistent bounds. |
| 5.4 | `app/services/script_service.py` | L339–L530 | Low | Presentation copy embedded in business layer | All narrator English strings are hardcoded in the service. Fine for a single-locale MVP; extracting to a template/copy module (part of 3.1) also enables localization later. |
| 5.5 | `app/services/role_service.py`, `app/services/game_service.py` | role_service L79–L127; game_service L410–L427 | Low | Duplicated pagination mechanics | `count → math.ceil(total/limit) → offset` block repeated in both services. A small shared `paginate(query, page, limit)` helper (next to `schemas/base.py`'s `PaginatedResponse`) removes the duplication and keeps behavior consistent. |

### Category 6 — API Surface & Encapsulation

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 6.1 | `app/schemas/__init__.py` | L1–L59 | Medium | Stale barrel: missing live schemas, exporting dead ones | Missing `NarratorPreviewAction`, `NarratorPreviewResponse`, `PreviewScriptRequest` (used by `routers/roles.py` and `ScriptService`); still exporting unused `AbilityStepCreate`/`AbilityStepRead` (2.3). The barrel misrepresents the actual public surface. |
| 6.2 | `app/services/__init__.py`, `app/routers/__init__.py` | — | Low | Barrels defined but never used internally | Harmless, but decide the convention: either import through barrels consistently (and enforce) or drop them for services/routers. |
| 6.3 | `app/schemas/role.py`, `app/schemas/ability.py` | role.py L49, L109; ability.py L42 | Low | Enum leaked as plain `str` in DTOs | `modifier` is typed `str` in schemas while the model uses `StepModifier`. The valid value set ("none/and/or/if") is invisible in the OpenAPI contract, and `StepModifier(step_data["modifier"])` at `role_service.py:335` raises an unwrapped `ValueError` (→ 500) on bad input. Typing the field as `StepModifier` pushes validation to the boundary. |

### Category 7 — Migration & Restructuring Opportunities

See §5 (Recommended Restructuring Priority) and §6 (Risk Matrix) below for concrete moves.

---

## 3. Dependency Graph Observations

- **No circular imports detected.** Dependency direction is consistently routers → services → (schemas, models) → database; schemas → models (enums only); seed → models.
- **Highest fan-in (fragile change points):**
  - `app/database.py` — imported by all 8 models, 4 routers, seed, conftest (≈15 importers), and it has import-time side effects (2.1).
  - `app/models/role.py` — enums `Team`/`Visibility` imported by schemas, both major services, routers, seed, tests.
  - `app/schemas/role.py` — 13 public classes consumed by 2 services, 1 router, 4 test files.
- **Highest fan-out (potential god objects):** `app/services/role_service.py` (9 internal imports), `app/services/script_service.py` (8), `app/services/game_service.py` (7), `app/seed/roles.py` (6). Consistent with findings 3.1–3.3.
- **Layer violations:** none hard. Soft: business rule in router (`games.py:40-49`), transport DTOs constructed in services (4.3).
- **Orphaned/dead:** `AbilityStepBase/Create/Read` schemas (2.3); `User` model near-orphaned (2.4). No orphaned files.

---

## 4. Cross-Cutting Observations

1. **Import-time construction pattern** (`settings`, `engine`, `SessionLocal`) is the single structural decision with the widest blast radius — it dictates test bootstrapping, blocks alternate configuration, and couples the model layer to infrastructure.
2. **Validation has three homes** (Pydantic schema validators, router guard clauses, service rule methods) with no stated policy; findings 5.2 and 5.3 are symptoms. Adopt a rule: schemas validate shape/bounds, services validate cross-entity rules, routers validate nothing.
3. **Hand-rolled ORM→DTO mapping** recurs (`RoleService.get_role`/`list_roles`, `GameService._to_response`) — field-by-field constructors that must be touched on every model change, alongside `model_validate` used elsewhere. Standardize on `from_attributes` + computed/nested mappers.
4. **Exception vocabulary is stringly-typed** — `ValueError`/`PermissionError` with human sentences, mapped to HTTP codes ad hoc per router (worst case 5.1). A tiny `app/exceptions.py` + one FastAPI exception handler would centralize this.

---

## 5. Recommended Restructuring Priority

### 1. Quick wins (low risk, high benefit)

1. **Sync `app/schemas/__init__.py`** — add the three preview schemas, delete the two dead ability-step schemas (and their classes in `schemas/ability.py` after confirming no external consumer). Importers to update: 0.
2. **Move `Base` to `app/models/base.py`**, re-export from `app.database` for compatibility. 8 model files change one import line; breaks the models→engine coupling half of 2.1.
3. **Extract shared `paginate()` helper** used by `RoleService.list_roles` and `GameService.list_games` (5.5).
4. **Type `modifier` as `StepModifier`** in `schemas/role.py` / `schemas/ability.py` (6.3).

### 2. Important restructurings

5. **Eliminate import-time side effects** (2.1/4.1): `get_settings()` with `functools.cache`; engine/`SessionLocal` created lazily or in app lifespan; delete the env-var hack in `tests/conftest.py:8-14`. Touches `config.py`, `database.py`, `seed/__init__.py`, conftest.
6. **Introduce domain exceptions + handler** (5.1, cross-cutting #4): `app/exceptions.py` with `NotFoundError`/`DomainValidationError`/`LockedError`; register handlers in `main.py`; remove the string-match in `games.py:130` and repeated try/except blocks in both routers.
7. **Unify role/game validation placement** (5.2, 5.3): move the card-total check from `routers/games.py` into `GameService.create_game`; reconcile name-length bounds between `RoleBase` and `validate_role`; have `create_role` call `validate_role`.

### 3. Major reorganizations

8. **Decompose `ScriptService`** (3.1/4.2/5.4): `services/narration/templates.py` (instruction generators + `STEP_DURATIONS`, pure functions over a plain `RoleScriptInput` dataclass), `services/narration/script_builder.py` (ordering/assembly), thin `ScriptService` for DB access + preview adaptation. Deletes the `_StandIn*` shims. Split `tests/test_script_service.py` to match.
9. **Extract validators from `GameService` and `RoleService`** into `services/game_setup_validation.py` and `services/role_validation.py` (3.2/3.3), splitting their test files along the same seams.
10. **Move seed role data to data files** (1.1): `app/seed/data/roles.json` (+ dependencies), loader in `seed/roles.py`.

---

## 6. Risk Matrix

| Move | Files Affected | Importers to Update | Test Coverage | Risk |
|------|---------------|--------------------|---------------|------|
| Sync/clean `schemas/__init__.py` barrel | 2 | 0 | test_schemas.py | Low |
| `Base` → `app/models/base.py` (compat re-export) | 10 | 8 (one line each) | Full suite exercises models | Low |
| Shared `paginate()` helper | 3 | 2 | test_role_service, test_game_service | Low |
| `modifier: StepModifier` in schemas | 2 | 0 (values unchanged) | test_schemas, test_roles | Low |
| Lazy settings/engine (remove import side effects) | 4 | ~15 transitively, mostly unchanged call sites | conftest rewrite required | Medium |
| Domain exceptions + FastAPI handlers | 5 | 2 routers, 2 services | test_games_router, test_roles | Medium |
| Move card-total rule into `GameService` | 2 | 1 | test_games_router, test_game_service | Low |
| Decompose `ScriptService` into narration package | 1 → 3–4 new | 2 (routers/games.py, routers/roles.py) | test_script_service (1,273 lines) — strong | Medium |
| Extract game/role validators | 2 → 4 | 2 | test_game_service, test_role_validation | Medium |
| Seed data → JSON files | 2 | 1 | test_seed.py (thin, 17 lines) — weak | Medium |

---

*End of report.*
