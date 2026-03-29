# Narrator Preview — Context

> Key files, decisions, constraints, and conventions for implementers

---

## Key Files

### Backend

| File | Relevance |
|------|-----------|
| `yourwolf-backend/app/services/script_service.py` | **Primary**. Contains all instruction generation logic: `_get_wake_instruction()`, `_generate_step_instruction()`, `_generate_role_script()`, and all 10 per-ability-type `_*_instruction()` methods. The new `preview_role_script()` method goes here. |
| `yourwolf-backend/app/routers/roles.py` | New `POST /roles/preview-script` endpoint goes here, alongside existing `POST /roles/validate`. |
| `yourwolf-backend/app/schemas/role.py` | New `NarratorPreviewAction` and `NarratorPreviewResponse` schemas go here. Existing `RoleCreate` and `AbilityStepCreateInRole` are the request schemas (reused, not duplicated). |
| `yourwolf-backend/app/schemas/game.py` | Reference for existing `NarratorAction` and `NightScript` schemas — the preview schemas are analogous but simpler. |
| `yourwolf-backend/app/seed/roles.py` | Reference for Seer, Werewolf, Doppelganger role configs used in tests. |
| `yourwolf-backend/app/seed/abilities.py` | Reference for all 15 ability type definitions and their `parameters_schema`. |
| `yourwolf-backend/app/models/ability_step.py` | `AbilityStep` model and `StepModifier` enum — used by `_generate_step_instruction()`. |
| `yourwolf-backend/tests/test_script_service.py` | Existing script service tests — new preview tests follow this pattern. |
| `yourwolf-backend/tests/conftest.py` | Test fixtures including `db_session` and `seeded_roles`. |

### Frontend

| File | Relevance |
|------|-----------|
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | **Primary**. Owns draft state, validation debounce, and `Wizard` rendering. New preview debounce + state management goes here. |
| `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` | Renders wizard tabs and step content. Must accept and display `NarratorPreview` on all tabs. |
| `yourwolf-frontend/src/api/roles.ts` | New `previewScript()` method goes here, alongside existing `validate()`. Uses `draftToPayload()`. |
| `yourwolf-frontend/src/types/role.ts` | New `NarratorPreviewAction` and `NarratorPreviewResponse` types go here. |
| `yourwolf-frontend/src/styles/theme.ts` | Theme tokens for styling the preview panel. |
| `yourwolf-frontend/src/styles/shared.ts` | Shared style constants. |
| `yourwolf-frontend/src/test/mocks.ts` | `createMockDraft()` and other test helpers — add preview mock helpers here. |
| `yourwolf-frontend/src/test/AbilitiesStep.test.tsx` | Reference for existing component test patterns. |
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Reference for how ability steps are structured in the UI. |

---

## Architecture Decisions

### Decision 1: Backend endpoint (not frontend-only generation)

**Choice**: `POST /roles/preview-script` backend endpoint
**Rationale**: Single source of truth. The `ScriptService` already has all instruction templates. Duplicating them in the frontend would create drift risk. The ~1s debounce makes latency acceptable.
**Trade-off**: Network dependency for preview (mitigated by graceful degradation on failure).

### Decision 2: Reuse `RoleCreate` as request schema

**Choice**: The preview endpoint accepts the same `RoleCreate` body used by `POST /roles` and `POST /roles/validate`.
**Rationale**: No new request schema to maintain. The frontend already has `draftToPayload()` that produces this shape.

### Decision 3: Lightweight stand-in object (not ORM persistence)

**Choice**: `preview_role_script()` constructs a simple object (dataclass or named tuple) that satisfies the interface expected by `_generate_role_script()` and `_get_wake_instruction()`, without touching the database.
**Rationale**: Preview is a pure computation — no state change, no DB write. The existing methods access `role.name`, `role.wake_target`, `role.ability_steps`, and `step.ability.type` / `step.parameters` / `step.modifier` / `step.is_required` / `step.order`.

### Decision 4: Preview panel persists across all wizard tabs

**Choice**: The `NarratorPreview` component renders inside `Wizard.tsx` below the step content area, above the navigation buttons, visible on every tab.
**Rationale**: The wake instruction depends on `wake_target` (Basic Info tab). Ability instructions depend on the Abilities tab. Users need to see how changes on any tab affect the narrator output.

### Decision 5: Multi-section preview for `perform_immediately` / `perform_as`

**Choice**: When the ability steps include `perform_immediately` or `perform_as`, the preview shows a second section with a header like "Then, at the copied role's wake time:" followed by a placeholder or the copied role's expected instructions.
**Rationale**: Doppelganger is a key reference role. Users building similar roles need to see that their role wakes twice. Since the copied role isn't known at creation time, a descriptive placeholder is shown for the second section.

---

## Constraints

- **Missing instruction templates**: 5 ability types (`change_to_team`, `perform_as`, `perform_immediately`, `stop`, `random_num_players`) currently return `None` from `_generate_step_instruction()`. The preview will show nothing for these steps — this is the **current backend behavior** and will be addressed in a separate feature. The preview should still render gracefully when these steps are present (skip them in the output).
- **No new dependencies**: Both backend and frontend must use only existing libraries.
- **Style convention**: Frontend uses inline `React.CSSProperties` with `theme` tokens — no CSS modules, no Tailwind, no styled-components.
- **Test convention**: Backend uses pytest with SQLAlchemy fixtures. Frontend uses Vitest + React Testing Library.

---

## Existing Debounce Pattern (Reference)

From `yourwolf-frontend/src/pages/RoleBuilder.tsx`, the validation debounce pattern:

```
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const validateIdRef = useRef(0);

const handleDraftChange = useCallback((updatedDraft: RoleDraft) => {
  setDraft(updatedDraft);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  const requestId = ++validateIdRef.current;
  debounceRef.current = setTimeout(async () => {
    const result = await rolesApi.validate(updatedDraft);
    if (requestId === validateIdRef.current) {
      setValidation(result);
    }
  }, 1000);
}, []);
```

The preview debounce should follow this identical pattern with its own ref and state, or share the same timer to co-fire both calls.

---

## Related Plans

- **Missing Instruction Templates** (not yet planned): A separate feature to add narrator text for `change_to_team`, `perform_as`, `perform_immediately`, `stop`, and `random_num_players`. Prerequisite for complete Phase 3 role creation but independent of the preview infrastructure.
