# PHASE_05B Manual QA Checklist

**Status:** Manual browser checks pending
**Scope:** Offline role authoring, local validation and name checks, local preview, and local role save.
**Environment:** Stop the backend. From `yourwolf-frontend/`, run `npm run dev` and open `http://localhost:3000/roles/new`. Use DevTools Network with Preserve log enabled.
**Rule:** Every browser row remains `Pending` until a human or browser-capable runner records evidence. Automated evidence does not mark manual rows passed.

## 1. Backend-offline startup

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 1.1 | Stop the backend before starting only the frontend. Open `/roles/new` and wait for the builder to load. | **Create New Role** appears and the builder is usable. | Pending | — |
| 1.2 | Inspect the preserved Network log from page load. | No request path contains `/api/v1`. | Pending | — |

## 2. Local validation errors

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 2.1 | Enter a name with 51 characters, set **Wake Order (0–40)** to `1`, click **Next** through **Abilities** and **Win Conditions**, then open **Review**. | `Role name must be at most 50 characters.` appears. | Pending | — |
| 2.2 | Enter a valid name, leave win conditions empty, and open **Review**. | `At least one win condition is required.` appears. | Pending | — |
| 2.3 | Add one win condition without marking it primary and open **Review**. | `Exactly one win condition must be marked as primary.` appears. | Pending | — |

## 3. Local validation warnings

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 3.1 | Set **Wake Order (0–40)** to `1`, open **Abilities**, and add six ability steps. Open **Review**. | The warning `This role has more than 5 ability steps, which may make it complex to balance.` appears. | Pending | — |
| 3.2 | Add **Copy Role** and **Change to Team** ability steps, then open **Review**. | The warning `Using both 'copy_role' and 'change_to_team' abilities may cause conflicts.` appears. | Pending | — |

## 4. Local name status and save

| # | Action | Expected | Status | Evidence |
|---|---|---|---|---|
| 4.1 | Enter `sEeR` as the role name and wait for the form to settle. | `Taken ✗` appears for the official role, with no network request. | Pending | — |
| 4.2 | Enter a unique name, add exactly one primary win condition, and open **Review**. | `Available ✓` appears and **Create Role** is enabled. | Pending | — |
| 4.3 | Click **Create Role**. Open `/roles` and keep **My Roles** selected. | The saved private role appears in the local role list. | Pending | — |
| 4.4 | Return to `/roles/new` and enter the saved private role name with different casing. | `Taken ✗` appears and no network request occurs. | Pending | — |

## Automated evidence for validator states blocked by shipped controls

The following states cannot be produced through the current wizard controls. They remain automated evidence, not manual rows.

| State | Automated evidence |
|---|---|
| Name shorter than two characters | `yourwolf-frontend/src/test/domain/roleValidation.test.ts` |
| First step modifier is not `none` | `yourwolf-frontend/src/test/domain/roleValidation.test.ts` |
| Ability is absent or inactive | `yourwolf-frontend/src/test/domain/roleValidation.test.ts` |
| Duplicate or gapped step order | `yourwolf-frontend/src/test/domain/roleValidation.test.ts` |
| More than one primary condition | `yourwolf-frontend/src/test/domain/roleValidation.test.ts` |
| Ability steps with `wake_order: null` | `yourwolf-frontend/src/test/domain/roleValidation.test.ts` |
| Name is both invalid by length and collides with a valid local role | `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` |

## Completion record

| Field | Value |
|---|---|
| Tester | Pending |
| Browser and version | Pending |
| Date | Pending |
| Manual result | Pending |
| Failed checks and evidence | None recorded |
