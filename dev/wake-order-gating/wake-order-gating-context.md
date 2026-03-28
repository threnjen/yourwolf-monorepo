# Wake Order Gating — Context

## Key Files

| File | Role |
|------|------|
| `yourwolf-frontend/src/pages/RoleBuilder.tsx` | `createEmptyDraft()` — change `wake_order: null` → `wake_order: 0` |
| `yourwolf-frontend/src/components/RoleBuilder/steps/BasicInfoStep.tsx` | Wake Order label + hint text; `handleWakeOrderChange` empty→0 behavior |
| `yourwolf-frontend/src/components/RoleBuilder/steps/AbilitiesStep.tsx` | Gating: disabled overlay when `draft.wake_order === 0` or `null` |
| `yourwolf-frontend/src/components/RoleBuilder/Wizard.tsx` | `canProceedFromStep` — no changes needed (name check sufficient) |
| `yourwolf-frontend/src/types/role.ts` | `RoleDraft.wake_order: number \| null` — no changes needed |
| `yourwolf-frontend/src/test/mocks.ts` | `createMockDraft()` default: `wake_order: null` → `0` |
| `yourwolf-frontend/src/test/BasicInfoStep.test.tsx` | Existing tests; add label/hint tests |
| `yourwolf-frontend/src/test/useDrafts.test.ts` | Update `wake_order: null` expectation → `0` |
| `yourwolf-backend/app/schemas/role.py` | `wake_order: int | None = Field(default=None, ge=0, le=40)` — no changes needed; 0 is valid |

## Key Decisions

1. **0 means "does not wake"**: This is a semantic convention enforced by the frontend. Backend doesn't distinguish 0 from any other valid wake_order — it's the frontend that gates ability editing.
2. **`handleWakeOrderChange('')` → 0 not null**: Clearing the input should produce 0, matching the "does not wake" default. Previously it produced `null`.
3. **Ability steps are preserved, not deleted**: When wake_order goes to 0 after steps were already added, we show a warning but don't auto-remove them. This prevents accidental data loss if the user toggled by mistake.
4. **`null` in legacy drafts**: `RoleDraft.wake_order` remains typed as `number | null`. AbilitiesStep treats both `0` and `null` as "does not wake". This ensures backward compat with any localStorage drafts that have `null`.

## Constraints

- Frontend-only changes; no backend deploy required
- Must not break existing RoleBuilder tests (184 backend + 283 frontend all green)
- The `createMockDraft()` default change will cascade to any test that relies on the implicit `wake_order` value — audit all usages

## Sibling Plans

- **`roles-listing-filters`**: Independent. No shared prerequisites. Can be implemented in any order.
