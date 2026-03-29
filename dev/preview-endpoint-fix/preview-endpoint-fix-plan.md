# Feature Plan: Preview Endpoint Fix

> **Critical path** — the narrator preview panel is completely non-functional without this fix.

## Source Phase

[PHASE_3.5_NARRATOR_PREVIEW_FIXES.md](../../yourwolf-docs/docs/phases/PHASE_3.5/PHASE_3.5_NARRATOR_PREVIEW_FIXES.md) — Bugs 1 & 2

---

## A. Requirements & Traceability

### Acceptance Criteria

| AC  | Description |
|-----|-------------|
| AC1 | A new `PreviewScriptRequest` Pydantic schema exists with only the fields the preview reads: `name` (default `""`), `wake_order` (default `0`), `wake_target` (optional), `ability_steps` (list, default empty). No strict `min_length` on `name`. |
| AC2 | `POST /api/roles/preview-script` accepts `PreviewScriptRequest` instead of `RoleCreate`. Payloads missing `description`, `team`, `votes`, etc. return 200, not 422. |
| AC3 | `preview_role_script()` returns `NarratorPreviewResponse(actions=[])` when `wake_order` is `0` **or** `None`. |
| AC4 | `generate_night_script()` DB query excludes roles with `wake_order == 0` (they must not produce a narrator turn in a real game). |
| AC5 | Frontend `previewScript()` sends only the fields in `PreviewScriptRequest` (no `description`, `team`, `votes`, `win_conditions`, etc.). |
| AC6 | All existing narrator preview backend tests still pass, updated for the new schema. |
| AC7 | All existing narrator preview frontend tests still pass, updated for the new payload shape. |

### Non-Goals

- Distinct "Preview unavailable" vs "does not wake up" fallback messaging in the frontend.
- Audio narration preview.
- Multi-role game script preview.
- Conditional step rendering (`condition_type`/`condition_params` interpretation).

### Traceability Matrix

| AC  | Code Areas | Planned Tests |
|-----|-----------|---------------|
| AC1 | `yourwolf-backend/app/schemas/role.py` | `test_preview_schema_*` |
| AC2 | `yourwolf-backend/app/routers/roles.py` | `test_preview_returns_200_minimal_payload`, `test_preview_no_description_returns_200` |
| AC3 | `yourwolf-backend/app/services/script_service.py` → `preview_role_script()` | `test_wake_order_zero_empty_actions`, `test_wake_order_none_empty_actions` |
| AC4 | `yourwolf-backend/app/services/script_service.py` → `generate_night_script()` | `test_night_script_excludes_wake_order_zero` |
| AC5 | `yourwolf-frontend/src/api/roles.ts` → `previewScript()` | `yourwolf-frontend/src/test/roles.api.test.ts` |
| AC6 | `yourwolf-backend/tests/test_script_service.py` | Existing `TestPreviewRoleScript`, `TestPreviewEndpoint` classes |
| AC7 | `yourwolf-frontend/src/test/RoleBuilder.test.tsx`, `yourwolf-frontend/src/test/roles.api.test.ts` | Existing preview-related tests |

---

## B. Correctness & Edge Cases

### Key Workflows

1. **Happy path**: User opens Role Builder → draft has `name: ""`, `wake_order: 0` → frontend calls `previewScript()` → backend returns empty actions → preview shows "does not wake up".
2. **Name entered + wake_order set**: User types a name and sets `wake_order > 0` → preview returns wake + steps + close eyes.
3. **Empty name + wake_order > 0**: Preview generates with placeholder (`", wake up."`) — does **not** 422.
4. **wake_order == 0 with ability steps**: Preview returns empty actions — steps are irrelevant for non-waking roles.

### Edge Cases

| Case | Expected |
|------|----------|
| Payload with no `description`, no `team`, no `votes` | 200, not 422 |
| `name: ""` + `wake_order: 5` | Returns actions with `", wake up."` — no validation error |
| `wake_order: 0` | Empty actions (same as `None`) |
| `wake_order: null` (JSON null) | Empty actions |
| `ability_steps: []` + `wake_order: 5` | Wake + close eyes only (2 actions) |

### Error-Handling Strategy

- Schema validation failures on `PreviewScriptRequest` → FastAPI 422 (only fires for truly invalid data, e.g. `wake_order: -1`).
- `generate_night_script()` query fix: add `Role.wake_order != 0` to the filter to prevent `wake_order == 0` roles from getting a narrator turn.

---

## C. Consistency & Architecture Fit

### Patterns to Follow

- Pydantic schemas live in `yourwolf-backend/app/schemas/role.py` alongside existing schemas.
- `AbilityStepCreateInRole` is already defined and should be reused in `PreviewScriptRequest`.
- Endpoint signatures in `yourwolf-backend/app/routers/roles.py` follow `async def fn(data: Schema, db: Session = Depends(get_db))`.
- `ScriptService` methods accept a schema/data object and convert to internal stand-in objects.
- Frontend API methods in `yourwolf-frontend/src/api/roles.ts` use `apiClient.post<T>()`.

### Deviations

- `PreviewScriptRequest` intentionally does **not** inherit from `RoleBase` — this is the fix. Document with a brief comment in the schema file.

### Interfaces / Contracts

**`PreviewScriptRequest` schema:**
```
name: str = ""                              # no min_length
wake_order: int | None = 0                  # 0 = non-waking
wake_target: str | None = None
ability_steps: list[AbilityStepCreateInRole] = []
```

**Frontend preview payload shape** (replaces the full `RoleCreatePayload`):
```
{ name, wake_order, wake_target, ability_steps }
```

---

## D. Clean Design & Maintainability

### Simplest Design

1. Add `PreviewScriptRequest` as a small standalone Pydantic model in `role.py`.
2. Change the type annotation on the endpoint from `RoleCreate` to `PreviewScriptRequest`.
3. Change the type annotation on `preview_role_script()` from `RoleCreate` to `PreviewScriptRequest`.
4. Add `or data.wake_order == 0` to the early-return check in `preview_role_script()`.
5. Add `Role.wake_order != 0` to the `generate_night_script()` DB query filter.
6. Add a new `draftToPreviewPayload()` helper in the frontend (or modify `previewScript()` to send only the needed fields).
7. Update tests.

### Complexity Risks

- **Import from `PreviewScriptRequest`**: `ScriptService` currently imports `RoleCreate`. The import must change to `PreviewScriptRequest`. This is a single-line change.
- **Frontend payload shape**: `draftToPayload()` builds a full `RoleCreatePayload`. The preview call must use a lighter payload. Best approach: inline the subset or add a `draftToPreviewPayload()` function.

### Keep-It-Clean Checklist

- [ ] `PreviewScriptRequest` does NOT inherit from `RoleBase`
- [ ] No new files created — changes go into existing files
- [ ] `AbilityStepCreateInRole` is reused, not duplicated
- [ ] Frontend sends the minimal payload; existing `draftToPayload()` is untouched

---

## E. Completeness: Observability, Security, Operability

### Logging

- `preview_role_script()` already logs at INFO level — no changes needed.
- `generate_night_script()` already logs role names and wake orders.

### Security

- The preview endpoint is read-only (generates text, no DB writes). The lighter schema reduces attack surface by not accepting unused fields.
- No auth changes required.

### Runbook

- **Deploy**: No migrations, no infra changes. Backend deploy + frontend deploy.
- **Verify**: Hit `POST /api/roles/preview-script` with `{"name": "", "wake_order": 5, "ability_steps": []}` — should return 200.
- **Rollback**: Revert the 4 changed files.

---

## F. Test Plan

### Test ↔ AC Mapping

| Test | AC |
|------|-----|
| `test_preview_schema_accepts_minimal_fields` | AC1 |
| `test_preview_schema_rejects_invalid_wake_order` | AC1 |
| `test_preview_returns_200_minimal_payload` (integration) | AC2 |
| `test_preview_no_description_returns_200` (integration) | AC2 |
| `test_wake_order_zero_empty_actions` | AC3 |
| `test_wake_order_none_empty_actions` | AC3 |
| `test_night_script_excludes_wake_order_zero` | AC4 |
| Updated existing `TestPreviewRoleScript` tests | AC6 |
| Updated existing `TestPreviewEndpoint` tests | AC6 |
| Updated frontend `previewScript` test | AC7 |

### Top 5 High-Value Test Cases

1. **Given** a payload with only `name`, `wake_order: 4`, and one `ability_step`, **When** `POST /api/roles/preview-script`, **Then** 200 with ≥ 3 actions (wake + step + close eyes).

2. **Given** a payload with `wake_order: 0` and ability steps, **When** `preview_role_script()` is called, **Then** returns `NarratorPreviewResponse(actions=[])`.

3. **Given** a payload with `name: ""` and `wake_order: 5`, **When** `preview_role_script()` is called, **Then** first action instruction contains `", wake up."` (no 422).

4. **Given** a game where one role has `wake_order == 0` and another has `wake_order == 1`, **When** `generate_night_script()` is called, **Then** only the `wake_order == 1` role appears in the script.

5. **Given** the existing Seer preview test payload, **When** updated to use `PreviewScriptRequest` shape (no `description`/`team`), **Then** all assertions still pass.

### Test Data / Fixtures

- Reuse existing `_seer_create()`, `_werewolf_create()`, `_doppelganger_create()` helpers — they will need updating to use `PreviewScriptRequest` for preview tests (or keep for non-preview tests and add new helpers).
- Existing `_ensure_abilities()` helper ensures ability records exist in the test DB.
- `conftest.py` already provides `db_session`, `client`, and `seeded_roles` fixtures.

---

## Stages

### Stage 1: Backend Schema & Service

**Goal**: Add `PreviewScriptRequest`, update `preview_role_script()` and `generate_night_script()`.

**Changes**:
- `yourwolf-backend/app/schemas/role.py` — add `PreviewScriptRequest`
- `yourwolf-backend/app/services/script_service.py` — change import, change type hint in `preview_role_script()`, fix `wake_order == 0` check, fix `generate_night_script()` query filter
- `yourwolf-backend/app/routers/roles.py` — change import, change endpoint parameter type

**Success Criteria**: `POST /api/roles/preview-script` with `{"name": "", "wake_order": 5, "ability_steps": []}` returns 200. `wake_order == 0` returns empty actions in both preview and full script.

**Status**: Not Started

### Stage 2: Backend Tests

**Goal**: Update existing tests and add regression tests.

**Changes**:
- `yourwolf-backend/tests/test_script_service.py` — update `TestPreviewRoleScript` and `TestPreviewEndpoint` to use new schema shape; add `test_wake_order_zero_empty_actions`, `test_night_script_excludes_wake_order_zero`

**Success Criteria**: All backend tests pass. AC3, AC4, AC6 verified.

**Status**: Not Started

### Stage 3: Frontend API Update

**Goal**: Send only preview-relevant fields from `previewScript()`.

**Changes**:
- `yourwolf-frontend/src/api/roles.ts` — update `previewScript()` to send `{ name, wake_order, wake_target, ability_steps }` instead of `draftToPayload(draft)`

**Success Criteria**: Frontend preview calls succeed without `description`/`team`/`votes`. AC5 verified.

**Status**: Not Started

### Stage 4: Frontend Tests

**Goal**: Update frontend tests for new payload shape.

**Changes**:
- `yourwolf-frontend/src/test/roles.api.test.ts` — update `previewScript` test expectations
- `yourwolf-frontend/src/test/RoleBuilder.test.tsx` — verify mock still works with new shape

**Success Criteria**: All frontend tests pass. AC7 verified.

**Status**: Not Started
