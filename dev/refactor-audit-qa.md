# QA Plan: Refactor Audit Remediation (Features 01–12)

**Date:** 2026-07-16
**Mode:** Release QA Plan
**Scope:** A pure refactor of YourWolf (backend + frontend). **No new user-facing features.** The job of this QA pass is to confirm behavior did **not** change, and to close the four gaps automation provably could not.
**Environment:** Local Docker stack (Postgres 16 + FastAPI + Vite), plus a real browser.

## Prerequisites

```bash
# Full stack. Run from yourwolf-backend/ — compose lives there, not at repo root.
cd yourwolf-backend
docker compose up --build

# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API docs:  http://localhost:8000/docs   (useful for the contract checks below)
```

Compose already runs `alembic upgrade head && python -m app.seed` on backend startup, so a
successful `up` seeds 30 roles automatically. API base path is `/api/v1`.

For a clean database (needed for the seed checks): `docker compose down -v` before `up`.

## Features Covered

All twelve bundles under `dev/feature/`: `01-backend-schema-surface`, `02-backend-config-database`,
`03-frontend-domain-foundation`, `04-backend-domain-exceptions`, `05-backend-seed-data`,
`06-frontend-game-rules`, `07-backend-validation-consolidation`, `08-frontend-abilities-step`,
`09-backend-service-validators`, `10-backend-narration-package`, `11-frontend-type-split`,
`12-frontend-dead-code-and-tests`. Each has `-plan.md`, `-context.md`, `-tasks.md`,
`-implementation.md`, and `-review.md` in its folder.

## Coverage Map

`dev/refactor-audit-coverage-map-qa.md` — 62 ACs classified, 51 fully covered by automation.

---

## Automated Test Coverage — What NOT To Re-Test

- **Backend:** 492 passed / 96.08% coverage.
- **Frontend:** 535 passed / 0 failed; `npm run build` PASS; `npm run lint` PASS. All three frontend gates were RED at the phase baseline and are now green.

Specifically, **do not spend tester time on these** — they already have evidence stronger than a human could produce:

- **Narrator script copy (feature 10).** An old-vs-new harness diffed **all 30 seed roles** plus default, custom, and partial wake orders — byte-identical. 66 exact-equality template cases are pinned and were verified against *both* the pre- and post-refactor implementations. Reading scripts by eye is strictly weaker. Only the HTTP round-trip is unobserved.
- **Seed data content (feature 05 AC3).** Compared against a golden snapshot captured from the **pre-refactor** code path. Do not eyeball role fields. Only *packaging* is unverified.
- **Domain logic (features 03, 06, 09, 11).** Cascades, wake-order shuffle with injected RNG, renumbering, coercion, pagination, validators — all pure functions with direct unit tests.
- **Status codes and error bodies.** Asserted at the HTTP level throughout. The checks below confirm *intent*, not correctness.

---

## Manual QA Checklist

### 1. Container Packaging & Seeding — **HIGHEST PRIORITY**

**Features:** 05 (AC5), 02 (AC6)
**Covers ACs:** 05/AC5, 02/AC6
**Why manual:** **Feature 05 AC5 is explicitly UNVERIFIED, not met.** The Docker daemon was unavailable in the implementer's environment. `app/seed/roles.py` resolves its data file relative to `__file__` (`DATA_FILE = Path(__file__).parent / "data" / "roles.json"`), and correctness under the image's `WORKDIR /app` is unproven. If this is wrong, **seeding fails in the real deployment** — the single highest-value check in this plan. Feature 02's boot smoke was uvicorn + SQLite, never Postgres in a container.

> **Trap — read before testing.** `docker-compose.yml` bind-mounts the backend source (`volumes: - .:/app`). That mount **masks the image's copy of `app/seed/data/`**, so a passing `docker compose up` does **not** prove the file was baked into the image. The first check below deliberately runs the image with **no bind mount**. Do not skip it in favor of the compose run.

#### Image-only packaging check (the actual AC5 gate)

- [ ] **Verify `roles.json` is inside the built image** — Build and inspect the image without any volume mount:
  ```bash
  cd yourwolf-backend
  docker build -t yourwolf-backend:qa .
  docker run --rm yourwolf-backend:qa ls -l /app/app/seed/data/roles.json
  ```
  **Expected:** the file is listed with a non-zero size. A "No such file or directory" error means AC5 has **failed** and seeding is broken in any deployment that does not bind-mount source.

- [ ] **Verify the loader resolves its path from an unrelated working directory inside the image** — This is the `__file__`-vs-`WORKDIR` risk in isolation:
  ```bash
  docker run --rm -w /tmp yourwolf-backend:qa python -c "from app.seed.roles import ROLES_DATA; print(len(ROLES_DATA))"
  ```
  **Expected:** prints `30`. Any `SeedDataError` or `FileNotFoundError` means the loader's path resolution does not survive packaging.

#### Fresh-database seed check

- [ ] **Seed a genuinely fresh database and count roles** — Destroy volumes, bring the stack up, and count:
  ```bash
  cd yourwolf-backend
  docker compose down -v
  docker compose up --build -d
  # wait for the backend log to show seeding complete, then:
  docker compose exec db psql -U yourwolf -d yourwolf -c "SELECT count(*) FROM roles;"
  ```
  **Expected:** `30`. Backend logs show `alembic upgrade head` then the seed run, with no `SeedDataError` and no traceback.

- [ ] **Confirm seed idempotency against real Postgres** — Run the seed a second time against the already-seeded database:
  ```bash
  docker compose exec backend python -m app.seed
  docker compose exec db psql -U yourwolf -d yourwolf -c "SELECT count(*) FROM roles;"
  ```
  **Expected:** still `30`, no duplicates, no error. (Idempotency is unit-tested; this confirms it under Postgres rather than SQLite.)

- [ ] **Confirm 30 roles are served over HTTP** — `curl -s "http://localhost:8000/api/v1/roles/?limit=100" | python3 -c "import sys,json; print(json.load(sys.stdin)['total'])"`
  **Expected:** `30`. This also exercises feature 02's lazy engine against Postgres and feature 09's shared `paginate()` helper.

---

### 2. Backend HTTP Contract Through the Real Routers

**Features:** 04, 10, 01, 07
**Covers ACs:** 04/AC3, 10/AC4, 01/AC3, 07/AC3, 07/AC4
**Why manual:** Feature 10's record notes "Manual QA not performed — no app instance available"; an HTTP round-trip through the real routers to a real database was never observed. Feature 04's 404-vs-400 split is on the manifest and had **zero** HTTP coverage before feature 04 wrote it. The remaining items are **sign-off on recorded contract changes**, not re-testing.

Get a game id first: create a game via the UI (Section 4) or `POST /api/v1/games/`.

#### Manifest checks

- [ ] **Invalid game start returns 404 vs 400 exactly as before (feature 04)** — Against a running stack:
  ```bash
  # Nonexistent game
  curl -s -o /dev/null -w "%{http_code}\n" -X POST \
    http://localhost:8000/api/v1/games/00000000-0000-0000-0000-000000000000/start
  # Real game that is not in the setup phase (start it twice)
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/api/v1/games/<GAME_ID>/start
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/api/v1/games/<GAME_ID>/start
  ```
  **Expected:** `404` for the nonexistent game; `200` then `400` for the double-start. Response `detail` is a plain string in both cases (not an array). The substring `"not found" in str(e)` routing is gone — these must still land on the same codes.

- [ ] **Night script generates over HTTP through the real routers (feature 10)** — For a started game: `curl -s http://localhost:8000/api/v1/games/<GAME_ID>/script | python3 -m json.tool | head -40`
  **Expected:** `200` with a populated `actions` array and a `total_duration_seconds`. **Do not proofread the copy** — byte-parity across all 30 seed roles is already proven and is stronger evidence. You are only confirming the router → `ScriptService` → narration package wiring survives a real request against a real DB.

- [ ] **Preview script round-trips through the real router (feature 10)** — Use the Role Builder's preview in Section 3, or `POST /api/v1/roles/preview-script` from `http://localhost:8000/docs`.
  **Expected:** `200` with narrator actions; `perform_immediately` / `perform_as` section headers render.

#### Contract-change sign-off (confirm intent, do not re-test correctness)

- [ ] **Sign off: invalid ability-step `modifier` now returns 422, not 400 (feature 01)** — `POST /api/v1/roles/` with `"modifier": "bogus"` on an ability step.
  **Expected:** `422`, and `detail` is an **array** (`[{loc: ["ability_steps", 0, "modifier"], msg, type: "enum"}]`) where it was previously the string `"'bogus' is not a valid StepModifier"`. Confirm no consumer depends on the old string shape. No test depended on the old behavior.

- [ ] **Sign off: role-name length violations now return 422, including on `/roles/validate` (feature 07)** — `curl -s -X POST http://localhost:8000/api/v1/roles/validate -H 'Content-Type: application/json' -d '{"name":"'"$(python3 -c 'print("x"*51)')"'","team":"village","win_conditions":[]}'`
  **Expected:** `422`. Previously this returned `200 {"is_valid": false, "errors": ["Role name must be…"]}`. Bounds are now 2–50 (all 30 seed names verified inside that bound). Confirm this is acceptable. The `/roles/validate` response shape is unchanged for every payload that still parses.

- [ ] **Sign off: `POST /roles` now requires at least one win condition (feature 07)** — This was **not anticipated by the plan** and the implementer requested explicit sign-off. `POST /api/v1/roles/` with a valid name and team but `"win_conditions": []`.
  **Expected:** `400` with `detail` "At least one win condition is required." Payloads that previously succeeded now fail. Confirm this is intended, then verify via Section 3 that **no client path can reach it** — the wizard gates Save on validation, so a real user should never see this.

---

### 3. Role Builder Wizard — Full Walkthrough

**Features:** 03, 06, 08, 11, 12
**Covers ACs:** 08/AC5, 06/AC7, 07/AC3 (client-path confirmation), 12/AC9
**Why manual:** **Feature 08 AC5 is only partially verified.** Suite parity is proven by execution (474→520 passed, same 3 pre-existing failures) and the 29-test regression anchor is byte-for-byte unmodified — but "the wizard renders and operates identically" is a visual/interaction claim JSDOM cannot make. The implementer explicitly asks for a human walk. `AbilitiesStep` went from one 492-line component to a 160-line container plus three extracted components; every rendering seam moved.

Open `http://localhost:3000/roles/new`.

#### Happy path (manifest walk)

- [ ] **Build a role using abilities from ≥3 categories** — In the Abilities step, click through the category tabs and add at least one ability from three or more different categories.
  **Expected:** each tab switch swaps the ability grid; every added ability appends to the step list with a sequential order number. No flicker, no layout shift, no duplicated or blank tabs.

- [ ] **Edit every parameter input kind** — For the added steps, exercise each input type the schema produces: an **enum select**, a **string-target select**, an **integer input** (try clearing it — min is 1), and an **array input** (comma-separated).
  **Expected:** each input renders the correct control for its type, accepts input, and persists its value when you navigate away from and back to the step. Required vs optional labels display correctly.

- [ ] **Reorder and remove steps** — Use move-up / move-down on a middle step, then on the first and last steps, then remove a step from the middle.
  **Expected:** order numbers renumber contiguously (1, 2, 3…) after every operation. Move-up is disabled on the first step and move-down on the last. The `Then:` modifier label appears on every step except the first; the modifier dropdown never offers `none`.

- [ ] **Preview the narrator script from the wizard** — Reach the Review step and trigger the narrator preview.
  **Expected:** preview renders with narrator actions for the role you built. This is the frontend half of feature 10's unobserved HTTP round-trip.

- [ ] **Save the role** — Complete the wizard and save.
  **Expected:** role saves, `201`, and appears in `/roles`.

#### Contract confirmation

- [ ] **Confirm the wizard gates Save so no client can hit the win-condition 400 (feature 07)** — Try to reach Save with zero win conditions defined.
  **Expected:** the wizard blocks advancement or Save with its own validation message — you should **not** be able to submit and receive the backend's "At least one win condition is required." 400. If you *can* reach it, that is a real finding: feature 07 tightened `POST /roles` beyond what the client was built for.

#### Error handling — feature 12's 422 fix

- [ ] **Over-long role name shows a real validation message, not "Validation service unavailable"** — Enter a role name **longer than 50 characters** and attempt to save.
  **Expected:** a specific, field-level message derived from the backend's 422 `detail` array (e.g. `name: String should have at most 50 characters`). **It must NOT say "Validation service unavailable"** — that generic fallback is reserved for real outages and its appearance here is the exact regression feature 12 fixed. This is the only place a real backend 422 meets feature 12's new `extractApiErrorMessages` reader over the wire; the unit tests use hand-written fixtures.

> **Do not test the 1-character name case.** It is **unreachable** — the wizard gates advancement at name length ≥ 2, so no client path produces it.

- [ ] **Confirm the generic fallback still works for real outages** — Stop the backend (`docker compose stop backend`) and attempt to save a role.
  **Expected:** a generic connectivity/unavailable message — the fallback is correctly retained for genuine failures, not eliminated. Restart with `docker compose start backend`.

---

### 4. Game Setup → Wake Order → Facilitator

**Features:** 06, 12
**Covers ACs:** 06/AC7, 06/AC4, 06/AC5, 12/AC5
**Why manual:** Feature 06 extracted cascade selection, wake-group construction, shuffle, and flattening out of the pages, and moved navigation ownership from `useGameSetup` to the page (the hook no longer receives a `NavigateFunction` or hardcodes the route). The pure functions are unit-tested; the **route chain and `location.state` handoff between the three pages** are not. Feature 12 renamed page components and route registrations.

Open `http://localhost:3000/games/new`.

- [ ] **Select roles that trigger a dependency cascade** — Choose a role with a dependency (the seed set has 9 role dependencies — e.g. a Werewolf-dependent or Mason-style pairing).
  **Expected:** dependent roles are auto-selected in the UI as soon as the parent is picked, and the card count updates accordingly.

- [ ] **Remove a role that others depend on** — Deselect the parent role.
  **Expected:** the cascade removal is reflected visually — dependents deselect together, count updates. No orphaned selections left highlighted.

- [ ] **Advance to wake-order review** — Proceed when the setup is valid.
  **Expected:** navigation lands on `/games/new/wake-order` and the page renders the wake groups populated from the selection. A blank page or a crash here means the `location.state` / `WakeOrderRouterState` handoff broke when navigation ownership moved to the page.

- [ ] **Reload the wake-order page directly** — Press browser refresh on `/games/new/wake-order`.
  **Expected:** whatever the pre-refactor behavior was (`location.state` is lost on reload — likely a redirect or an empty state). **Confirm it is not a raw crash / white screen.** The full `location.state` fix is a recorded Phase 04 deferral, not a bug to file here.

- [ ] **Complete the flow into the facilitator view** — Confirm the wake order and start the game.
  **Expected:** navigation reaches `/games/:gameId`, the facilitator view renders the night script, and the roles appear in the wake order you confirmed. Routes still resolve after feature 12's `HomePage`/`RolesPage` renames.

- [ ] **Visit the renamed pages** — Navigate to `/` and `/roles`.
  **Expected:** both render normally. `Home` → `HomePage` and `Roles` → `RolesPage` were renamed along with their route registrations.

---

### 5. Lint Boundary Gate — Verify the Green Is Real

**Features:** 03, 12
**Covers ACs:** 03/AC6, 12/AC3, 12/AC8
**Why manual:** The manifest requires confirming the import-boundary rule is **active with zero exemptions** after feature 12 — i.e. that the passing lint is enforcement, not a vacuous green from a disabled rule. Feature 03 shipped the rule with a tracked exemption in `BasicInfoStep`; feature 12 removed it by extracting `useNameCheck`.

- [ ] **Lint passes with zero boundary exemptions** — Run and grep for leftover suppressions:
  ```bash
  cd yourwolf-frontend
  npm run lint
  grep -rn "eslint-disable" src/ --include=*.ts --include=*.tsx
  ```
  **Expected:** `npm run lint` exits `0`. The grep returns **no** `no-restricted-imports` suppressions — in particular none in `src/components/RoleBuilder/steps/BasicInfoStep.tsx`, whose exemption feature 12 was required to remove.

- [ ] **Confirm the boundary rule actually fires** — Temporarily add `import {rolesApi} from '../../../api/roles';` to `src/components/RoleBuilder/steps/BasicInfoStep.tsx`, run `npm run lint`, then revert.
  **Expected:** lint **fails** with a `no-restricted-imports` error. A pass here means the rule is not enforcing and the green is meaningless. **Revert the edit.**

---

## Notes

### Known bug — deliberately frozen. Do not report as new.

The narrator says **"Werewolfs"** (not "Werewolves") on the `thumbs_up` step, produced by a naive `title() + "s"` pluralization in `_thumbs_up_instruction`. The wake instruction correctly says "Werewolves", so the inconsistency is visible.

**This is pre-existing, byte-identical to pre-refactor output, and was frozen deliberately.** Feature 10's parity oracle depends on it — the string is explicitly pinned in `tests/test_narration_templates.py` with an explanatory comment. Fixing it here would have violated AC4 and corrupted the Phase 04 port oracle. **It needs its own follow-up copy-fix feature.** If you see it, do not file it.

### Recorded contract changes (Section 2 covers sign-off)

1. `POST /roles` now requires at least one win condition (feature 07) — unplanned; implementer requested sign-off.
2. Role-name length violations return **422** rather than 400, including on `/roles/validate` (feature 07).
3. Invalid ability-step `modifier` values return **422** rather than 400, with an array `detail` instead of a string (feature 01).
4. Role-name bounds tightened to **2–50**. All 30 seed names verified inside that bound and pinned by a regression test.

### Recorded deferrals — out of scope, do not file

- `location.state` handoff replacement (frontend audit 4.1 full fix) — deferred to Phase 04.
- `gamesApi.delete` retained despite having no caller — per directive, pending Phase 04's decision on `api/games.ts`.
- `GameSessionListItem` is now unreferenced but deliberately kept — it describes a live `GET /games` endpoint.
- `@/` alias + per-layer barrels, styling consolidation, `SelectableRoleCard` / facilitator-view extraction — deferred to Phase 04 or later.
- Preview-schema relocation (feature 10 AC6) — move explicitly **rejected** with recorded rationale.

### Scope reminder

Anything that looks like a missing feature, awkward UX, or odd copy is almost certainly pre-existing. This phase changed structure, not behavior. File a finding only where behavior **differs from before the refactor**, or where one of the four gaps above fails.
