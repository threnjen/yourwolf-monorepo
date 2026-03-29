# Narrator Preview — Tasks

> Checklist of all work items by stage

---

## Stage 1: Backend — Preview Endpoint

### Schemas
- [ ] Add `NarratorPreviewAction` schema to `app/schemas/role.py` with fields: `order: int`, `instruction: str`, `is_section_header: bool`
- [ ] Add `NarratorPreviewResponse` schema to `app/schemas/role.py` with field: `actions: list[NarratorPreviewAction]`

### Service
- [ ] Add `preview_role_script(data: RoleCreate) -> NarratorPreviewResponse` method to `ScriptService`
  - [ ] Construct lightweight stand-in objects for `Role` and `AbilityStep` from `RoleCreate` payload (no DB write)
  - [ ] Look up `Ability` records by `ability_type` to satisfy `step.ability` relationship needed by `_generate_step_instruction()`
  - [ ] Return empty actions list when `wake_order` is `None`
  - [ ] Call existing `_get_wake_instruction()` for wake text
  - [ ] Call existing `_generate_step_instruction()` for each ability step
  - [ ] Append close-eyes instruction
  - [ ] Handle `perform_immediately` / `perform_as` steps: add a section header action for the second wake section

### Router
- [ ] Add `POST /roles/preview-script` endpoint to `app/routers/roles.py`
  - [ ] Accept `RoleCreate` body
  - [ ] Instantiate `ScriptService` and call `preview_role_script()`
  - [ ] Return `NarratorPreviewResponse`

### Tests
- [ ] Add `TestPreviewRoleScript` class to `tests/test_script_service.py`
  - [ ] Test: Seer config returns wake + view card instruction + close eyes (AC2)
  - [ ] Test: Werewolf config returns team wake instruction + conditional step (AC2)
  - [ ] Test: Non-waking role (wake_order=None) returns empty actions (AC6)
  - [ ] Test: Doppelganger config returns multi-section output (AC4)
  - [ ] Test: Role with no ability steps returns wake + close eyes only
  - [ ] Test: OR modifier step prefixed with "OR" in instruction text
- [ ] Add preview endpoint integration test (AC5)
  - [ ] Test: `POST /roles/preview-script` returns 200 with valid payload
  - [ ] Test: `POST /roles/preview-script` returns 422 with invalid payload
- [ ] Verify all existing tests still pass

---

## Stage 2: Frontend — API Client & State Management

### Types
- [ ] Add `NarratorPreviewAction` type to `src/types/role.ts`: `{ order: number; instruction: string; is_section_header: boolean }`
- [ ] Add `NarratorPreviewResponse` type to `src/types/role.ts`: `{ actions: NarratorPreviewAction[] }`

### API Client
- [ ] Add `previewScript` method to `rolesApi` in `src/api/roles.ts`
  - [ ] `POST /roles/preview-script` with `draftToPayload(draft)` body
  - [ ] Returns `NarratorPreviewResponse`

### State Management
- [ ] In `src/pages/RoleBuilder.tsx`:
  - [ ] Add `preview` state: `useState<NarratorPreviewResponse | null>(null)`
  - [ ] Add `previewLoading` state: `useState<boolean>(false)`
  - [ ] Add debounced preview API call in `handleDraftChange` (using same pattern as validation — own ref + stale-request guard)
  - [ ] Pass `preview` and `previewLoading` as props to `Wizard`

### Wizard Props
- [ ] Update `WizardProps` interface in `src/components/RoleBuilder/Wizard.tsx` to accept `preview: NarratorPreviewResponse | null` and `previewLoading: boolean`
- [ ] Pass `preview` and `previewLoading` through to `NarratorPreview` component (Stage 3)

### Test Mocks
- [ ] Add `createMockPreviewResponse()` helper to `src/test/mocks.ts`

### Tests
- [ ] Test: `rolesApi.previewScript()` calls correct endpoint with draft payload
- [ ] Test: `RoleBuilder` calls preview API after debounce on draft change (AC3, AC7)
- [ ] Verify all existing tests still pass

---

## Stage 3: Frontend — NarratorPreview Component & Integration

### Component
- [ ] Create `src/components/RoleBuilder/NarratorPreview.tsx`
  - [ ] Props: `actions: NarratorPreviewAction[]`, `loading: boolean`, `roleName: string`
  - [ ] Renders a styled panel with all action instructions as a numbered list
  - [ ] Section headers (`is_section_header: true`) render as distinct visual separators
  - [ ] Loading state: show muted "Generating preview..." text
  - [ ] Empty state (no actions, non-waking role): show "This role does not wake up — no narrator instructions."
  - [ ] Error/null state: show "Narrator preview will appear as you build your role."
  - [ ] Style: use `theme.colors.surface` / `theme.colors.surfaceLight` background, `theme.colors.text` for instruction text, subtle left border or background to distinguish from step editor

### Wizard Integration
- [ ] In `Wizard.tsx`, render `NarratorPreview` below the step content area and above the nav buttons
  - [ ] Visible on all 4 tabs (basic, abilities, win, review)
  - [ ] Pass `preview.actions`, `previewLoading`, and `draft.name` as props

### Tests
- [ ] Test: `NarratorPreview` renders all action instructions when given actions (AC2)
- [ ] Test: `NarratorPreview` renders empty state for empty actions array (AC6)
- [ ] Test: `NarratorPreview` renders loading state when `loading=true`
- [ ] Test: `NarratorPreview` renders section headers distinctly for multi-wake roles (AC4)
- [ ] Test: Preview panel is rendered on all 4 wizard tabs (AC1)
- [ ] Verify all existing tests still pass
