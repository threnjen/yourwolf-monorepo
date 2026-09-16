# Phase 5b: Local Role Authoring

**Status**: Planned
**Depends on**: Phase 05a (Local Catalog and Store)
**Estimated complexity**: Small
**Cross-references**: Planning decisions in `docs/phases/DISCOVERY_CONTEXT.md` (section "Phase 05 replanning"); Phase 05a summary at `docs/phases/PHASE_05A/PHASE_05A_SUMMARY.md`; standing constraints in `docs/learnings/cross-phase-decisions.md` (sections "Phase 05a Refinement" and the feature 07 and 12 entries on role-name bounds); backend rule source in `yourwolf-backend/app/services/role_validation.py`; backend rule tests in `yourwolf-backend/tests/test_role_validation_module.py`

## What's New

The role builder works with the server switched off. Errors and warnings about a draft role appear as you type, exactly as they did before, but the app computes them on the device. The name availability indicator no longer waits on a network round trip. Nothing in the app contacts a server any more, so an offline user sees no "validation service unavailable" message and no stalled spinner. This completes the offline data story that Phase 05a started: catalog, game, and now authoring all run locally.

## Problem

The role builder still asks the server two questions while a user edits a draft: is this draft valid, and is this name free. With the server stopped, which is the normal state for the desktop and mobile apps that Phase 06 onward ships, the builder shows "Validation service unavailable" on every keystroke and the name indicator never settles. The user can still save, because Phase 05a made the save local, but they get no guidance on what is wrong with the draft until the save is blocked. The HTTP client, the Axios dependency, and the test-time request guard also remain in the frontend for these two calls alone, so every later phase carries dead transport code and a guard that exists only to prove it stays dead.

## Objective

Port the role validation rules and warnings to the pure domain layer, drop the server name check in favor of the local check Phase 05a already installed, and delete the HTTP client and its dependency. This is the last server call in the frontend, so removing it closes the offline arc before the Tauri shell arrives.

## Scope

### In Scope

- **Domain validation module** in `src/domain/` that takes a `RoleDraft` and the ability catalog and returns the same `errors` list the backend `validate_role` returns, minus the database duplicate-name rule. Rules to port, with the backend's message strings preserved verbatim: trimmed name shorter than 2 characters, first ability step by lowest order must have modifier `none`, every step's `ability_type` must exist and be active in the supplied catalog, step orders must be sequential from 1 with the duplicate message taking precedence over the gap message, at least one win condition, and exactly one primary win condition with the count reported when more than one.
- **Name upper bound**: the backend rejects names over 50 characters at the schema boundary, before `validate_role` runs, so no Python rule message exists. The port adds an error for a trimmed name over 50 characters. The Wizard gate stays at the 2-character minimum; the error text is the guidance for the maximum.
- **Domain warnings** in the same module that mirror `get_warnings`: more than 5 ability steps, steps present with no wake order, and `copy_role` together with `change_to_team`. Message strings preserved verbatim.
- **Transcribed oracle**: the 38 tests in `yourwolf-backend/tests/test_role_validation_module.py` transcribed into the frontend suite the way Phase 04a transcribed the narration and setup validation oracles. The duplicate-name cases map onto the existing local name-collision helper. Transcribed, never regenerated.
- **Builder rewiring**: `RoleBuilder.tsx` calls the domain module instead of `rolesApi.validate`, on the same debounce, against the ability catalog the 05a abilities repository already provides. The local name collision remains an error, combined with the domain errors in one `ValidationResult`. The "Validation service unavailable" path and the 422 body parsing in `src/api/errors.ts` are deleted with the client.
- **Name check hook**: `useNameCheck` no longer calls the server. The hook keeps its `NameStatus` contract, `idle`, `checking`, `available`, `taken`, so the name step UI is unchanged, and derives the status from the local role list with the same case-insensitive comparison the 05a save path uses. The debounce may stay so the indicator does not flicker per keystroke.
- **Delete the HTTP layer**: `src/api/client.ts`, `src/api/roles.ts`, `src/api/abilities.ts`, `src/api/errors.ts`, the `axios` dependency, the forbidden-request guard in `src/test/setup.ts`, and the route test that asserts the guard permits `/roles/validate` and `/roles/check-name`. Move the draft-to-record mapping out of `src/api/roles.ts` if any of it is still referenced; the 05a save path already owns the draft-to-record mapping, so expect the payload builder to be dead.
- **Transport types**: keep `src/types/transport.ts`. The 05a local record is structurally compatible with its views and pages still import them. Rename or relocate nothing in this phase.
- **Zero-network proof**: a test that renders the builder, edits a draft to trigger validation and the name check, and asserts no `fetch` or `XMLHttpRequest` is issued. This replaces the deleted Axios guard as the standing proof.
- **Manual QA document** at `docs/phases/PHASE_05B/PHASE_05B_QA.md` covering the builder with the backend stopped.

### Out of Scope

- Backend changes of any kind. `POST /roles/validate` and `GET /roles/check-name` stay in the API for the cloud arc.
- Public and official name uniqueness semantics. The backend checks a new name only against public and official roles. The local check compares against every local role, official and private, and that stricter rule stays, as recorded in the 05a refinement decision.
- Export and import of custom roles (Phase 05c).
- Role editing or deletion in the UI. The 05a repository has `delete`; no screen calls it yet.
- Any change to `src/engine/`.
- Any change to the ability catalog shape or the seed files.
- Preferences, narration, Tauri.

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Domain validation and warnings | Pure module in `src/domain/` with the ported rules, the 50-character bound, and the transcribed 38-case oracle | Domain module, oracle tests |
| 2 | Builder and name check on the domain | `RoleBuilder.tsx` and `useNameCheck` use the domain module and the local role list; the same `ValidationResult` and `NameStatus` contracts flow to the UI | Page rewiring, hook rewiring, page and hook tests |
| 3 | HTTP layer deletion and zero-network proof | `src/api/` removed, Axios removed, test guard removed, a no-network test added, manual QA document written | Deletion, dependency change, QA doc |

## Technical Context

- **Rule source**: `yourwolf-backend/app/services/role_validation.py`, 164 lines. `validate_role` (line 49) and `get_warnings` (line 133). `check_duplicate_name` (line 27) is the database rule that the local collision helper replaces.
- **Oracle**: `yourwolf-backend/tests/test_role_validation_module.py`, 38 tests. Precedent for transcription is Phase 04a's `src/test/engine/` suites, which transcribe Python tables and tests as literals.
- **Existing callers**: `src/pages/RoleBuilder.tsx` lines 40 to 95 hold the debounced validate path, including the local collision short-circuit `hasRoleNameCollision(roles, updatedDraft.name)` and the `extractApiErrorMessages` fallback. `src/hooks/useNameCheck.ts` holds the debounced server name check with request-id invalidation.
- **Domain shapes**: `src/domain/roleDraft.ts` defines `RoleDraft`. `src/domain/abilitySteps.ts` holds step guards that mirror the UI; do not fold the validation rules into it, because the rules answer a different question and the file carries deliberately preserved sharp edges.
- **Ability catalog**: the 05a `AbilityRepository` in `src/data/repositories.ts` and the `useAbilities` hook. The rule needs `type` and `is_active` per ability.
- **Local name check**: the case-insensitive collision helper installed in 05a and used by the save path. Reuse it in both the builder and the hook.
- **Pure-layer rule**: `src/domain/` and `src/data/` pass an ESLint rule forbidding React and storage imports. The new module must import only from `src/domain/`.
- **Test guard to delete**: `src/test/setup.ts` line 18 wraps `apiClient` to throw on catalog paths; `src/test/routes.test.tsx` lines 78 and 79 assert the guard permits the two remaining paths.
- **Types**: `ValidationResult` and `NameCheckResult` live in `src/types/transport.ts` lines 62 to 73. `NameCheckResult` becomes unused when the hook stops calling the server and may be deleted with the client.
- **Dependency**: `axios` in `yourwolf-frontend/package.json`. Removing it also removes the `paramsSerializer` indexes workaround, which has no other user.

## Dependencies & Risks

- **Dependency**: Phase 05a's abilities repository, role list, and local collision helper are the only inputs. All landed at commit `73b30be`.
- **Risk**: message drift between Python and TypeScript. Mitigation: the transcribed oracle pins every message string as a literal, and the messages are copied, not paraphrased.
- **Risk**: the 50-character rule has no Python message to copy, so the port invents one. Mitigation: the phase records this as the one deliberate divergence, and the oracle marks the case as frontend-only.
- **Risk**: deleting `src/api/` orphans a helper another page still imports. Mitigation: the deletion feature runs `tsc` and the full suite; a dangling import fails the build.
- **Risk**: `NameStatus` semantics change subtly, since the server compared only against public and official roles while the local list contains private ones. Mitigation: this is the 05a decision, already recorded; the hook tests assert the stricter behaviour explicitly.

## Success Criteria

- [ ] With the backend stopped, editing a draft in the role builder shows the same errors and warnings the server used to return, with identical wording, and never shows "Validation service unavailable".
- [ ] A trimmed name of 51 characters produces a visible error in the builder.
- [ ] The name indicator reaches `available` or `taken` without a server, and `taken` for a name that matches an existing local role ignoring case.
- [ ] The transcribed oracle suite passes with every backend rule message present as a literal.
- [ ] `src/api/` does not exist. `axios` is absent from `package.json` and the lockfile. `npm run build` and `npm run lint` pass.
- [ ] A test proves that rendering the builder, editing a draft, and typing a name issues no `fetch` and no `XMLHttpRequest`.
- [ ] No file under `src/` imports from `src/api/` or from `axios`, proven by the build.
- [ ] `src/engine/` and `src/data/seed/` are unchanged.
- [ ] Global frontend coverage stays above 80 percent.
- [ ] The manual QA document exists at `docs/phases/PHASE_05B/PHASE_05B_QA.md`.

## QA Considerations

- This phase changes user-facing builder behaviour, so a manual QA document is required. Rows: builder with the backend stopped from the start, each error rule triggered once, each warning triggered once, a 51-character name, a case-variant duplicate name, and a save after validation passes.
- No backend change. No API contract change.
- Affected suites: role builder page tests, name check hook tests, routes test, test setup, the new domain suite. The 31 pending Phase 05a browser rows still stand and are not superseded by this phase; only rows 1.3 and the role-builder rows overlap.

## Notes for Phase - Execute

Decompose in dependency order: **(1)** domain module and oracle → **(2)** builder and hook rewiring → **(3)** HTTP deletion, no-network proof, manual QA.

- Feature 1 touches only `src/domain/` and `src/test/domain/`. It has no callers when it lands. Its gate is the transcribed oracle.
- Feature 2 swaps the call sites. Keep the `ValidationResult` shape and the debounce so the builder tests change assertions, not structure. The builder must still combine the local collision error with the domain errors in one result. Do not remove the client here; Feature 3 owns deletion so Feature 2's diff stays readable.
- Feature 3 deletes `src/api/`, `axios`, the guard, and the guard assertions, then adds the no-network test and the QA document. Run the full suite and the build as the gate.
- Do not touch `src/engine/`, `src/data/seed/`, or the backend.
- Record the 50-character message as a frontend-only rule in `docs/learnings/cross-phase-decisions.md` so Phase 09 sync does not treat it as a parity claim.
