# Phase 5b: Local Role Authoring

**Status**: Planned
**Depends on**: Phase 05a (Local Catalog and Store)
**Estimated complexity**: Small
**Cross-references**: Planning decisions in `docs/phases/DISCOVERY_CONTEXT.md` (section "Phase 05 replanning"); Phase 05a summary at `docs/phases/PHASE_05A/PHASE_05A_SUMMARY.md`; standing constraints in `docs/learnings/cross-phase-decisions.md` (sections "Phase 05a Refinement" and "Phase 05b Refinement"); backend rule source in `yourwolf-backend/app/services/role_validation.py`; backend rule tests in `yourwolf-backend/tests/test_role_validation.py` and `yourwolf-backend/tests/test_role_validation_module.py`

## What's New

The role builder works with the server switched off. Errors and warnings about a draft role appear as you type, exactly as they did before, but the app computes them on the device. The name availability indicator no longer waits on a network round trip. Nothing in the app contacts a server any more, so an offline user sees no "Validation service unavailable" message and no stalled "Checking..." indicator. This completes the offline data story that Phase 05a started: catalog, game, and now authoring all run locally.

## Problem

The role builder still asks the server two questions while a user edits a draft: is this draft valid, and is this name free. With the server stopped, which is the normal state for the desktop and mobile apps that Phase 06 onward ships, the builder shows "Validation service unavailable" on every keystroke and the name indicator never settles. The user can still save, because Phase 05a made the save local, but they get no guidance on what is wrong with the draft until the save is blocked. The HTTP client, the Axios dependency, and the test-time request guard also remain in the frontend for these two calls alone, so every later phase carries dead transport code and a guard that exists only to prove it stays dead.

## Objective

Port the role validation rules and warnings to the pure domain layer, drop the server name check in favor of the local check Phase 05a already installed, and delete the HTTP client and its dependency. This is the last server call in the frontend, so removing it closes the offline arc before the Tauri shell arrives.

## Scope

### In Scope

- **Domain validation module** in `src/domain/` that takes a `RoleDraft` and the active ability catalog and returns the same `errors` list the backend `validate_role` returns, minus the database duplicate-name rule. Rules to port, with the backend's message strings preserved verbatim: trimmed name shorter than 2 characters, first ability step by lowest order must have modifier `none`, every step's `ability_type` must exist and be active in the supplied catalog, step orders must be sequential from 1 with the duplicate message taking precedence over the gap message, at least one win condition, and exactly one primary win condition with the count reported when more than one. Rule order and the per-rule reporting order match the Python function.
- **Name upper bound**: the backend rejects names over 50 characters at the schema boundary, before `validate_role` runs, so no Python rule message exists. The port adds an error for a trimmed name over 50 characters. The Wizard gate stays at the 2-character minimum; the error text is the guidance for the maximum. This is a frontend-only rule and the first of two deliberate divergences.
- **Domain warnings** in the same module that mirror `get_warnings`: more than 5 ability steps, steps present with `wake_order` null, and `copy_role` together with `change_to_team`. Message strings preserved verbatim.
- **Pure-layer input and output shapes**: the module declares its own minimal ability shape (type and active flag) and its own result shape (validity, errors, warnings). It imports nothing from `src/types/`, `src/data/`, or `src/hooks/`, because the ESLint pure-layer rule forbids it. The result is structurally compatible with the transport `ValidationResult` the Wizard already consumes, so the UI needs no adapter.
- **Transcribed oracle**: the backend rule tests transcribed into the frontend suite the way Phase 04a transcribed the narration and setup validation oracles, as literals, never regenerated. The transcription map in Technical Context lists every backend test class and where it lands.
- **Name collision precedence**: the backend name rules are an if/elif chain, so a name that is both too short and a duplicate reports only the length error. The builder preserves this when it combines the local collision with the domain errors: a length error suppresses the collision error.
- **Local duplicate-name message**: the local collision error keeps its current wording, "Name is already taken". The backend message names public and official roles, which is false for the local check that compares against every local role. This is the second deliberate divergence.
- **Builder rewiring**: `RoleBuilder.tsx` calls the domain module instead of `rolesApi.validate`, on the same debounce, against the ability catalog from the 05a abilities repository. Validation waits until both the local role list and the ability catalog have loaded, so an early keystroke never reports every step as an invalid ability type. The "Validation service unavailable" path and the 422 body parsing in `src/api/errors.ts` are deleted with the client.
- **Name check hook**: `useNameCheck` no longer calls the server. The hook keeps its `NameStatus` return contract, `idle`, `checking`, `available`, `taken`, so the name step UI is unchanged, and derives the status from the local role list with the same case-insensitive comparison the 05a save path uses. The name step component currently calls the hook itself when the page passes no status prop; that fallback goes away and the page supplies the status. The debounce may stay so the indicator does not flicker per keystroke.
- **Delete the HTTP layer**: `src/api/client.ts`, `src/api/roles.ts`, `src/api/abilities.ts`, `src/api/errors.ts`, the three suites under `src/test/api/`, the `axios` dependency, the forbidden-request guard in `src/test/setup.ts`, and the route test assertions that exercise the guard. The draft-to-payload mapping in `src/api/roles.ts` has no caller after 05a and is deleted with the file.
- **Frontend API configuration**: remove `VITE_API_URL` from `yourwolf-frontend/.env.example`, `yourwolf-frontend/README.md`, and the Vite env type declaration in `src/vite-env.d.ts`. The root README keeps its backend URL lines because the backend still runs for the cloud arc.
- **Transport types**: keep `src/types/transport.ts`. Delete `NameCheckResult`, which has no reader once the hook stops calling the server. Update the file header comment and the `roleDraft.ts` comments that point at `src/api/roles.ts` as the payload adapter. Rename or relocate nothing else.
- **Zero-network proof**: a test that renders the builder, edits a draft to trigger validation and the name check, and asserts no `fetch` or `XMLHttpRequest` is issued. This replaces the deleted Axios guard as the standing proof. The 05a smoke test's no-traffic assertion, which reads the Axios client's method list, is rewritten against the same mechanism.
- **Manual QA document** at `docs/phases/PHASE_05B/PHASE_05B_QA.md` covering the builder with the backend stopped.

### Out of Scope

- Backend changes of any kind. `POST /roles/validate` and `GET /roles/check-name` stay in the API for the cloud arc.
- Public and official name uniqueness semantics. The backend checks a new name only against public and official roles. The local check compares against every local role, official and private, and that stricter rule stays, as recorded in the 05a refinement decision.
- Export and import of custom roles (Phase 05c).
- Role editing or deletion in the UI. The 05a repository has `delete`; no screen calls it yet. The backend's exclude-own-id duplicate rule therefore has no local counterpart.
- Any change to `src/engine/`.
- Any change to the ability catalog shape or the seed files.
- Any change to `docs/CODEBASE_CONTEXT.md` beyond the docs refresh at phase close.
- Preferences, narration, Tauri.

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Domain validation and warnings | Pure module in `src/domain/` with the ported rules, the 50-character bound, and the transcribed oracle | Domain module, oracle tests |
| 2 | Builder and name check on the domain | `RoleBuilder.tsx` and `useNameCheck` use the domain module and the local role list; the same `ValidationResult` and `NameStatus` contracts flow to the UI; the name step fallback hook call is removed | Page rewiring, hook rewiring, page, step, and hook tests |
| 3 | HTTP layer deletion and zero-network proof | `src/api/` removed, Axios removed, test guard removed, API env references removed, a no-network test added, smoke test rewritten, manual QA document written | Deletion, dependency change, env cleanup, QA doc |

## Technical Context

- **Rule source**: `yourwolf-backend/app/services/role_validation.py`, 164 lines. `validate_role` (line 49) and `get_warnings` (line 133). `check_duplicate_name` (line 27) is the database rule that the local collision helper replaces.
- **Oracle files**: `yourwolf-backend/tests/test_role_validation.py` (38 tests) and `yourwolf-backend/tests/test_role_validation_module.py` (12 tests). Precedent for transcription is Phase 04a's `src/test/engine/` suites, which transcribe Python tables and tests as literals.
- **Transcription map**, by backend test class:
  - `TestValidateRole` (16): port as domain literals. The two schema-rejection tests map to the local rules: `test_name_too_short_rejected_by_schema` to the 2-character rule and `test_name_too_long_rejected_by_schema` to the frontend 50-character rule. `test_duplicate_name_case_insensitive` maps onto the collision helper. `test_duplicate_name_private_allowed` inverts locally: a private local role does collide, and the transcribed test asserts that.
  - `TestValidateRoleModule` (3), `TestRoleNameLengthBounds` (3), `TestGetWarnings` (4), `TestGetWarningsModule` (2): port as domain literals. The schema test in the length-bounds class maps to the 50-character rule.
  - `TestRoleRulePrecedence` (1): port against the builder's combined result, asserting the length error suppresses the collision error.
  - `TestCheckDuplicateName` (4) and `TestCheckDuplicateNameModule` (3): map onto the collision helper tests. The exclude-own-id cases are excluded because no edit flow exists locally.
  - `TestValidateEndpoint` (5), `TestCheckNameEndpoint` (5), `TestCreateValidateAgreement` (4): excluded, they test HTTP and database behaviour. The case-insensitive and whitespace-only name cases map onto the hook tests. The create-versus-validate agreement is covered by the builder's save gate tests.
- **Existing callers**: `src/pages/RoleBuilder.tsx` lines 40 to 95 hold the debounced validate path, including the local collision short-circuit `hasRoleNameCollision(roles, updatedDraft.name)` and the `extractApiErrorMessages` fallback. `src/hooks/useNameCheck.ts` holds the debounced server name check with request-id invalidation. `src/components/RoleBuilder/steps/BasicInfoStep.tsx` line 79 falls back to calling the hook directly when no `nameStatus` prop arrives.
- **Domain shapes**: `src/domain/roleDraft.ts` defines `RoleDraft` with `wake_order: number | null`; the null case is the "no wake order" warning trigger. `src/domain/abilitySteps.ts` holds step guards that mirror the UI; do not fold the validation rules into it, because the rules answer a different question and the file carries deliberately preserved sharp edges.
- **Ability catalog**: the 05a `AbilityRepository` in `src/data/repositories.ts` and the `useAbilities` hook. The rule needs `type` and `is_active` per ability. Seed conversion sets every ability active, so the inactive branch is reachable only through test input.
- **Local name check**: `hasRoleNameCollision` in `src/pages/RoleBuilder.tsx` line 17, case-insensitive and whitespace-trimmed, used by the save path. Reuse it in both the builder and the hook; a shared home outside the page is a suggested shape for Phase - Execute to verify.
- **Pure-layer rule**: `src/domain/`, `src/engine/`, and `src/data/` pass an ESLint rule in `yourwolf-frontend/eslint.config.js` forbidding React, `api`, `hooks`, `components`, `pages`, `styles`, and `types` imports. The new module must import only from `src/domain/`.
- **Test guard to delete**: `src/test/setup.ts` mocks `axios` and throws on catalog, games, preview, and create paths; `src/test/routes.test.tsx` lines 64 to 80 assert the guard's behaviour and lines 33 to 40 mock the roles client.
- **Tests that import the API layer**: `src/test/api/abilities.api.test.ts`, `src/test/api/errors.api.test.ts`, `src/test/api/roles.api.test.ts` (deleted); `src/test/pages/RoleBuilder.test.tsx`, `src/test/hooks/useNameCheck.test.ts`, `src/test/components/RoleBuilder/steps/BasicInfoStep.test.tsx`, `src/test/routes.test.tsx` (mocks removed); `src/test/integration/phase_05a_smoke.test.tsx` line 46 (no-traffic assertion rewritten).
- **Types**: `ValidationResult` and `NameCheckResult` live in `src/types/transport.ts` lines 62 to 73. The Wizard and review step consume `ValidationResult`.
- **Dependency**: `axios` in `yourwolf-frontend/package.json`. Removing it also removes the `paramsSerializer` indexes workaround, which has no other user.
- **Environment**: `VITE_API_URL` appears in `yourwolf-frontend/.env.example`, `yourwolf-frontend/README.md` line 29, `src/vite-env.d.ts` line 4, and `docs/CODEBASE_CONTEXT.md` lines 133, 267, and 289.

## Dependencies & Risks

- **Dependency**: Phase 05a's abilities repository, role list, and local collision helper are the only inputs. All landed at commit `73b30be`.
- **Risk**: message drift between Python and TypeScript. Mitigation: the transcribed oracle pins every message string as a literal, and the messages are copied, not paraphrased.
- **Risk**: two messages diverge from the backend by design, the 50-character rule and the local duplicate-name wording. Mitigation: both are recorded in `docs/learnings/cross-phase-decisions.md` so Phase 09 sync does not treat them as parity claims, and the oracle marks both cases as frontend-only.
- **Risk**: validation runs before the ability catalog loads and reports every step as an invalid ability type. Mitigation: the builder gates validation on both the role list and the catalog being ready, extending the existing role-list gate.
- **Risk**: deleting `src/api/` orphans a helper another file still imports. Mitigation: the deletion feature runs `tsc` and the full suite; a dangling import fails the build. The known importers are enumerated in Technical Context.
- **Risk**: `NameStatus` semantics change subtly, since the server compared only against public and official roles while the local list contains private ones. Mitigation: this is the 05a decision, already recorded; the hook tests assert the stricter behaviour explicitly.
- **Risk**: removing the name step's fallback hook call breaks a render path that passes no status. Mitigation: the only production caller is the Wizard, which always passes the prop; the step tests that relied on the fallback are rewritten to pass a status.

## Success Criteria

- [ ] With the backend stopped, editing a draft in the role builder shows the same errors and warnings the server used to return, with identical wording, and never shows "Validation service unavailable".
- [ ] A trimmed name of 51 characters produces a visible error in the builder.
- [ ] A name that is both shorter than 2 characters and a case-insensitive match for an existing role reports only the length error.
- [ ] The name indicator reaches "Available ✓" or "Taken ✗" without a server, and "Taken ✗" for a name that matches an existing local role ignoring case, official or private.
- [ ] The transcribed oracle suite passes with every backend rule message present as a literal, and the transcription map's excluded classes are listed in the suite header.
- [ ] Editing a draft before the ability catalog has loaded does not report an invalid ability type.
- [ ] `src/api/` does not exist. `axios` is absent from `package.json` and the lockfile. `VITE_API_URL` is absent from the frontend package. `npm run build` and `npm run lint` pass.
- [ ] A test proves that rendering the builder, editing a draft, and typing a name issues no `fetch` and no `XMLHttpRequest`.
- [ ] `src/engine/` and `src/data/seed/` are unchanged.
- [ ] Global frontend coverage stays above 80 percent.
- [ ] The manual QA document exists at `docs/phases/PHASE_05B/PHASE_05B_QA.md`.

## QA Considerations

- This phase changes user-facing builder behaviour, so a manual QA document is required. Rows: builder with the backend stopped from the start, each error rule triggered once, each warning triggered once, a 51-character name, a case-variant duplicate of an official role, a case-variant duplicate of a private role, a 1-character name that also duplicates a role, and a save after validation passes.
- No backend change. No API contract change.
- Affected suites: role builder page tests, name step tests, name check hook tests, routes test, test setup, the 05a smoke test, the three API suites (deleted), and the new domain suite. The 31 pending Phase 05a browser rows still stand and are not superseded by this phase; only rows 1.3 and the role-builder rows overlap.

## Notes for Phase - Execute

Decompose in dependency order: **(1)** domain module and oracle → **(2)** builder, step, and hook rewiring → **(3)** HTTP deletion, env cleanup, no-network proof, manual QA.

- Feature 1 touches only `src/domain/` and `src/test/domain/`. It has no callers when it lands. Its gate is the transcribed oracle with the transcription map honoured class by class.
- Feature 2 swaps the call sites. Keep the `ValidationResult` shape and the debounce so the builder tests change assertions, not structure. The builder must combine the local collision error with the domain errors in one result, with the length error taking precedence, and must gate validation on both the role list and the ability catalog. Remove the name step's fallback hook call and pass the status from the page. Do not remove the client here; Feature 3 owns deletion so Feature 2's diff stays readable.
- Feature 3 deletes `src/api/`, the API test suites, `axios`, the guard, the guard assertions, `NameCheckResult`, and the `VITE_API_URL` references, then adds the no-network test, rewrites the smoke test's no-traffic assertion, and writes the QA document. Run the full suite and the build as the gate.
- Do not touch `src/engine/`, `src/data/seed/`, or the backend.
- The two deliberate divergences are already recorded in `docs/learnings/cross-phase-decisions.md` under "Phase 05b Refinement". Do not re-record them.
