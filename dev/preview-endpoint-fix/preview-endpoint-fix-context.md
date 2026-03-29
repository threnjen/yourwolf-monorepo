# Context: Preview Endpoint Fix

## Key Files

| File | Role | Lines of Interest |
|------|------|-------------------|
| `yourwolf-backend/app/schemas/role.py` | Schema definitions. `RoleBase` (L64–90) has strict `min_length` constraints that cause the 422 bug. `AbilityStepCreateInRole` (L107–117) is reused by the new schema. `NarratorPreviewAction` / `NarratorPreviewResponse` (L219–230) are unchanged. | L64–117, L219–230 |
| `yourwolf-backend/app/routers/roles.py` | `preview_script()` endpoint (L102–116) currently takes `RoleCreate`. | L1–17 (imports), L102–116 |
| `yourwolf-backend/app/services/script_service.py` | `preview_role_script()` (L188–248) checks `if data.wake_order is None:` but does **not** check for `0`. `generate_night_script()` (L99–176) uses `Role.wake_order.isnot(None)` — `0` passes that filter. Import of `RoleCreate` at L17. | L14–18, L99–131, L188–200 |
| `yourwolf-backend/tests/test_script_service.py` | `TestPreviewRoleScript` (L340+) uses `RoleCreate` payloads with `description`/`team` fields. `TestPreviewEndpoint` (L500+) sends full payloads. | L240–300 (helpers), L340–500, L500–540 |
| `yourwolf-frontend/src/api/roles.ts` | `previewScript()` (L55–58) calls `draftToPayload(draft)` which builds a full `RoleCreatePayload` with all fields. | L55–58, L60–100 |
| `yourwolf-frontend/src/test/roles.api.test.ts` | `previewScript` test (L230–250) asserts that the POST body contains all `RoleCreatePayload` fields. | L230–250 |
| `yourwolf-frontend/src/test/RoleBuilder.test.tsx` | Mocks `previewScript` and checks debounce behavior. | L15, L39, L67, L136–170 |

## Decisions Made

### D1: `PreviewScriptRequest` does not inherit from `RoleBase`

**Chose**: Standalone `BaseModel` with only preview-relevant fields.
**Why**: The entire bug exists because `RoleBase` enforces `description`, `team`, and other constraints that are irrelevant to preview generation. Inheriting from `RoleBase` and making fields optional would create a fragile schema that breaks whenever `RoleBase` adds new required fields.

### D2: `name` defaults to empty string (no `min_length`)

**Chose**: `name: str = ""` with no `min_length` constraint.
**Why**: The preview must work before the user has entered a name. An empty name produces a valid but cosmetically odd instruction (`", wake up."`) — this is acceptable per the phase doc's edge case table.

### D3: `wake_order` defaults to `0` (not `None`)

**Chose**: `wake_order: int | None = 0` — matches the frontend's initial draft state.
**Why**: The frontend draft initializes `wake_order: 0`. The backend treats `0` as non-waking (returns empty actions), consistent with the game rule that `wake_order == 0` means "does not wake". `None` is also supported for backwards compatibility.

### D4: Fix `generate_night_script()` query filter

**Chose**: Add `Role.wake_order != 0` alongside `Role.wake_order.isnot(None)`.
**Why**: A role stored with `wake_order == 0` would currently pass the `isnot(None)` filter and receive a narrator turn in a real game. The phase doc identifies this as a medium-risk issue; Doppelganger and Copycat both have `wake_order: 0` in seed data.

### D5: Frontend sends a minimal payload (not the full `RoleCreatePayload`)

**Chose**: Add a `draftToPreviewPayload()` helper or inline the minimal object in `previewScript()`.
**Why**: Sending unused fields is wasteful and, per the phase doc, was part of the original bug's surface area. Keeping the preview payload minimal means future `RoleBase` changes won't reintroduce the 422.

### D6: Existing preview test helpers (`_seer_create()`, etc.) stay as `RoleCreate`

**Chose**: Keep existing helpers for non-preview tests (e.g., future create/validate tests). Add new minimal preview-specific helpers or construct `PreviewScriptRequest` inline in preview tests.
**Why**: The helpers are useful beyond preview testing. Duplicating them as `PreviewScriptRequest` objects is straightforward.

## Constraints

- No database migrations — this is a schema + logic + test change only.
- No new Python dependencies.
- The `AbilityStepCreateInRole` schema is shared between `RoleCreate` and `PreviewScriptRequest` — it must not be modified.
- `StepModifier` enum values must remain consistent (`"none"`, `"and"`, `"or"`, `"if"`).

## Relationship to Sibling Plans

- **`missing-instruction-templates`** can be implemented independently but its results (instruction text for the 5 missing ability types) will only be visible in the narrator preview UI once this plan is complete.
- **Suggested order**: Implement `preview-endpoint-fix` first. The instruction template work touches different parts of `script_service.py` (template methods vs. endpoint/query logic) so conflicts are unlikely even if done in parallel.
