# Tasks: Preview Endpoint Fix

## Stage 1: Backend Schema & Service

- [ ] **1.1** Add `PreviewScriptRequest` schema to `yourwolf-backend/app/schemas/role.py`
  - Fields: `name: str = ""`, `wake_order: int | None = 0`, `wake_target: str | None = None`, `ability_steps: list[AbilityStepCreateInRole] = Field(default_factory=list)`
  - Place it near `NarratorPreviewAction` / `NarratorPreviewResponse` (around L219)
  - Do NOT inherit from `RoleBase`
- [ ] **1.2** Export `PreviewScriptRequest` from the schema's `__init__` if applicable
- [ ] **1.3** Update `yourwolf-backend/app/routers/roles.py`
  - Change import: add `PreviewScriptRequest` to the import from `app.schemas.role`
  - Change `preview_script()` parameter type from `RoleCreate` to `PreviewScriptRequest`
- [ ] **1.4** Update `yourwolf-backend/app/services/script_service.py`
  - Change import: replace `RoleCreate` with `PreviewScriptRequest` (from `app.schemas.role`)
  - Change `preview_role_script()` type annotation from `RoleCreate` to `PreviewScriptRequest`
  - Fix the early-return guard: `if data.wake_order is None or data.wake_order == 0:`
- [ ] **1.5** Fix `generate_night_script()` query in `script_service.py`
  - Add `Role.wake_order != 0` to the `.filter()` clause alongside `Role.wake_order.isnot(None)`

## Stage 2: Backend Tests

- [ ] **2.1** Update `_seer_create()` / `_werewolf_create()` / `_doppelganger_create()` helper usage in `TestPreviewRoleScript`
  - Preview tests should construct `PreviewScriptRequest` objects (only `name`, `wake_order`, `wake_target`, `ability_steps`)
  - Keep the `RoleCreate` helpers for any non-preview tests that still need them
- [ ] **2.2** Update `test_non_waking_role_empty_actions` — use `PreviewScriptRequest(name="Villager", wake_order=None)`
- [ ] **2.3** Add `test_wake_order_zero_empty_actions` — `PreviewScriptRequest(name="Doppelganger", wake_order=0, ability_steps=[...])` → assert `actions == []`
- [ ] **2.4** Update `test_doppelganger_multi_section` — note: Doppelganger has `wake_order: 0`, so after the fix it returns empty actions. Either change the test to use a non-zero wake_order or split the test to verify both behaviors
- [ ] **2.5** Update `TestPreviewEndpoint.test_preview_returns_200_with_valid_payload` — remove `description`, `team`, `votes`, `win_conditions` from payload
- [ ] **2.6** Update `TestPreviewEndpoint.test_preview_returns_422_with_invalid_payload` — adjust for new schema constraints (e.g., `wake_order: -1` is invalid)
- [ ] **2.7** Add `test_preview_no_description_returns_200` — send `{"name": "X", "wake_order": 5, "ability_steps": []}` → 200
- [ ] **2.8** Add `test_night_script_excludes_wake_order_zero` — create a game with a `wake_order: 0` role assigned to a player, call `generate_night_script()`, assert that role's name does not appear in actions

## Stage 3: Frontend API Update

- [ ] **3.1** In `yourwolf-frontend/src/api/roles.ts`, update `previewScript()` to send `{ name, wake_order, wake_target, ability_steps }` from the draft instead of `draftToPayload(draft)`
  - Add a `draftToPreviewPayload()` helper or construct the object inline
  - `ability_steps` should map the same fields as `AbilityStepCreateInRole` expects

## Stage 4: Frontend Tests

- [ ] **4.1** Update `yourwolf-frontend/src/test/roles.api.test.ts` `previewScript` test — adjust the `expect.objectContaining(...)` assertion to match the new minimal payload shape
- [ ] **4.2** Verify `yourwolf-frontend/src/test/RoleBuilder.test.tsx` preview-related mocks still work — the mock returns `{actions: []}` which is schema-agnostic, so these likely need no changes
