# Phase 3.5: Narrator Preview Fixes

> **Fix the narrator preview panel and complete all missing instruction templates**

## Overview

**Goal**: Fix two bugs preventing the narrator preview panel from displaying generated text, and add the 5 missing ability instruction templates so that all 15 ability types produce narrator text in both the preview and the full game script.

**Prerequisites**: Phase 3 (Role Builder MVP) complete; narrator preview feature implemented on `narrator-preview` branch

---

## Problem Statement

### Bug 1: Preview endpoint rejects every request with 422 (Critical)

`POST /api/roles/preview-script` uses `RoleCreate` as its request schema. `RoleCreate` inherits from `RoleBase`, which enforces `description: str = Field(..., min_length=1)`. The initial draft starts with `description: ''`, so every preview API call returns a 422 until the user fills in a description — and even after that, other `RoleBase` constraints (like `name: str = Field(..., min_length=1)`) block the preview before the user has finished filling out Basic Info.

The preview endpoint only reads `name`, `wake_order`, `wake_target`, and `ability_steps`. It never touches `description`, `team`, `votes`, or any other `RoleBase` field.

**Impact**: The `Promise.allSettled` in `RoleBuilder.tsx` catches the 422 rejection and falls through to `setPreview(null)`. The `NarratorPreview` component receives `preview?.actions ?? []` which evaluates to `[]`, triggering the empty-state message on every render.

**Key files**:
- `yourwolf-backend/app/schemas/role.py` — `RoleBase` / `RoleCreate` with strict field constraints
- `yourwolf-backend/app/routers/roles.py` — `preview_script` endpoint accepting `RoleCreate`
- `yourwolf-frontend/src/pages/RoleBuilder.tsx` — error fallback setting `preview` to `null`

### Bug 2: `wake_order == 0` not treated as non-waking (Medium)

`preview_role_script()` checks `if data.wake_order is None:` and returns empty actions. But `wake_order == 0` means non-waking — the initial draft defaults to `wake_order: 0`. When the preview endpoint isn't blocked by Bug 1, a role with `wake_order: 0` would incorrectly generate a full narrator turn (wake + close eyes) instead of returning empty actions.

**Key file**: `yourwolf-backend/app/services/script_service.py` — `preview_role_script()` method

### Bug 3: 5 ability types silently produce no narrator text (Medium)

`_generate_step_instruction()` has templates for 10 of 15 ability types. The remaining 5 — `change_to_team`, `perform_as`, `perform_immediately`, `stop`, `random_num_players` — return `None`, so they are silently skipped in both the narrator preview and the full game night script. This means roles like Doppelganger, Paranormal Investigator, and Blob show incomplete narrator instructions.

**Key file**: `yourwolf-backend/app/services/script_service.py` — `_generate_step_instruction()` templates dict

**Roles affected by missing templates**:
- **Doppelganger** (`perform_immediately`) — wake_order 1, view_card → copy_role → perform_immediately
- **Apprentice Seer** and similar (`perform_as`) — view_card → copy_role → perform_as
- **Paranormal Investigator** (`change_to_team`, `stop`) — view_card → change_to_team (if werewolf) → stop
- **Blob** (`random_num_players`) — random_num_players with options [2, 3, 4]

---

## In Scope

### Preview endpoint fix
- Create a lightweight `PreviewScriptRequest` Pydantic schema with only the fields the preview reads (`name`, `wake_order`, `wake_target`, `ability_steps`), with relaxed constraints (e.g., `name` defaults to empty string)
- Update the `POST /roles/preview-script` endpoint to use `PreviewScriptRequest` instead of `RoleCreate`
- Update `preview_role_script()` to accept the new schema and treat `wake_order == 0` as non-waking (same as `None`)
- Update the frontend `previewScript()` API method to send only the fields the new schema expects
- Verify `generate_night_script()` (the full game script) also treats `wake_order == 0` correctly (it filters on `Role.wake_order.isnot(None)` in the DB query — `0` would pass that filter, so this may need a fix too)

### Missing instruction templates
- Add `_change_to_team_instruction()` — e.g., "If you see a werewolf, you are now on the werewolf team."
- Add `_perform_as_instruction()` — e.g., "At the copied role's normal wake time, perform their night actions."
- Add `_perform_immediately_instruction()` — e.g., "Now perform the copied role's night actions."
- Add `_stop_instruction()` — e.g., "Stop. Do not perform any further actions." (or silent/no-op depending on game design)
- Add `_random_num_players_instruction()` — e.g., "A random number of adjacent players (2, 3, or 4) are now part of your blob."
- Register all 5 in the `templates` dict in `_generate_step_instruction()`

### Tests
- Update existing tests for new preview schema
- Add regression tests for both preview bugs
- Add unit tests for each new instruction template (with parameter variations)
- Verify `generate_night_script()` behavior with `wake_order == 0`

## Out of Scope

- Distinct "Preview unavailable" fallback when the API errors (vs. "does not wake up" for genuinely non-waking roles) — nice-to-have, not blocking
- Audio narration preview
- Multi-role game script preview
- Conditional step rendering (e.g., showing "IF you see a werewolf:" prefix) — the `condition_type` and `condition_params` fields on steps are stored but not yet interpreted by any template. This is a separate concern from having a basic template for the ability type itself.

---

## Dependencies

- **Phase 3 complete**: The Role Builder wizard, `ScriptService`, and all narrator preview implementation files must exist on the branch
- **No external dependencies**: No new libraries, no migrations, no infrastructure changes

---

## Success Criteria

| # | Criterion | Testable Via |
|---|-----------|-------------|
| SC1 | Preview shows wake + ability instructions + close eyes once user enters a name (≥2 chars) and sets `wake_order > 0` | Manual QA |
| SC2 | Preview updates live as user adds/removes ability steps | Manual QA |
| SC3 | Preview shows empty state ("does not wake up") when `wake_order` is 0 | Manual QA |
| SC4 | Preview works before description is filled in | Manual QA |
| SC5 | `POST /api/roles/preview-script` returns 200 with minimal payload (name + wake_order + ability_steps) | Backend test |
| SC6 | `preview_role_script()` returns empty actions for `wake_order == 0` | Backend test |
| SC7 | `generate_night_script()` does not generate a turn for roles with `wake_order == 0` | Backend test |
| SC8 | All 15 ability types produce non-None instruction text from `_generate_step_instruction()` | Backend test |
| SC9 | Doppelganger preview shows view_card + copy_role + perform_immediately instructions (not just wake + close eyes) | Backend test |
| SC10 | Paranormal Investigator preview shows view_card + change_to_team + stop instructions | Backend test |
| SC11 | Blob preview shows random_num_players instruction with options from parameters | Backend test |
| SC12 | All existing narrator preview tests pass (adjusted for new schema) | Automated test suite |

---

## Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Empty name + `wake_order > 0` | Preview generates with placeholder (e.g., `", wake up."`) — does not 422 |
| `wake_order == 0` with ability steps configured | Preview shows "does not wake up" — steps are irrelevant for non-waking roles |
| `change_to_team` step without `team` parameter | Template uses sensible default (e.g., "You change teams.") |
| `random_num_players` step without `options` parameter | Template uses sensible default (e.g., "A random number of players are selected.") |
| `stop` step | Template produces text (e.g., "Stop. Do not perform any further actions.") — not silently skipped |
| API network failure | Preview area shows empty state — does not block wizard (existing behavior, unchanged) |

---

## Technical Context

| Area | Key Files |
|------|-----------|
| Backend schema | `yourwolf-backend/app/schemas/role.py` — `RoleCreate`, `RoleBase`, `NarratorPreviewResponse` |
| Backend endpoint | `yourwolf-backend/app/routers/roles.py` — `preview_script()` |
| Backend service | `yourwolf-backend/app/services/script_service.py` — `preview_role_script()`, `_generate_role_script()`, `_generate_step_instruction()`, `generate_night_script()` |
| Ability seed data | `yourwolf-backend/app/seed/abilities.py` — all 15 ability definitions with `parameters_schema` |
| Role seed data | `yourwolf-backend/app/seed/roles.py` — reference roles using the 5 missing ability types |
| Frontend API | `yourwolf-frontend/src/api/roles.ts` — `previewScript()`, `draftToPayload()` |
| Frontend state | `yourwolf-frontend/src/pages/RoleBuilder.tsx` — preview debounce + error handling |
| Frontend component | `yourwolf-frontend/src/components/RoleBuilder/NarratorPreview.tsx` |
| Backend tests | `yourwolf-backend/tests/test_script_service.py` |
| Frontend tests | `yourwolf-frontend/src/test/NarratorPreview.test.tsx`, `src/test/RoleBuilder.test.tsx` |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Changing the endpoint schema breaks existing frontend preview tests | High | Tests must be updated in the same pass — the old schema never worked anyway |
| `generate_night_script()` DB query passes `wake_order == 0` roles through `isnot(None)` | Medium | Verify and fix the query filter if needed; add a test |
| New `PreviewScriptRequest` schema drifts from `RoleCreate` as fields are added | Low | Document that the preview schema only needs the fields `ScriptService` reads |
| Instruction text for missing ability types doesn't match game design intent | Medium | Review template text against role descriptions in seed data; templates are easy to adjust later |

---

## Notes for Feature Decomposer

This phase has two natural features:

**Feature 1: Preview endpoint fix** — New `PreviewScriptRequest` schema, update endpoint signature, update `preview_role_script()` wake_order check, update frontend API client, update tests. This is the critical path — the preview is fully non-functional without it.

**Feature 2: Missing instruction templates** — Add 5 `_*_instruction()` methods to `ScriptService`, register them in the templates dict, add unit tests for each. This can be done independently of Feature 1, but the results will only be visible in the preview once Feature 1 is complete.

Feature 1 should be implemented first. Feature 2 can follow immediately after or in parallel if working in separate files.
