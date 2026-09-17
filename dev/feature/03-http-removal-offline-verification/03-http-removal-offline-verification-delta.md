# Selection Delta: 03 HTTP Removal and Offline Verification

## Key Files

| File or area | Verified role | Selection action |
|---|---|---|
| `yourwolf-frontend/src/api/client.ts` | Axios client imported by two API modules and four tests | Delete |
| `yourwolf-frontend/src/api/roles.ts` | Dead roles transport imported only by its API suite | Delete |
| `yourwolf-frontend/src/api/abilities.ts` | Dead abilities transport imported only by its API suite | Delete |
| `yourwolf-frontend/src/api/errors.ts` | Dead Axios error parser imported only by its API suite | Delete |
| `yourwolf-frontend/src/test/api/` | Three suites for the deleted HTTP layer | Delete directory contents |
| `yourwolf-frontend/src/test/setup.ts` | Global Axios mock and forbidden-request guard | Remove the Axios mock; retain jsdom and fake IndexedDB setup |
| `yourwolf-frontend/src/test/routes.test.tsx` | Imports `apiClient`, mocks `rolesApi`, and directly tests the obsolete Axios guard | Remove those imports, mocks, and two guard tests; retain route coverage |
| `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` | Existing browser-level builder suite already drives validation, name status, preview, and save | Add the builder zero-network scenario here |
| `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx` | Existing application smoke suite asserts against Axios methods | Replace the Axios assertion with the shared browser-boundary guard |
| `yourwolf-frontend/src/test/test_utils.tsx` | Existing shared React and repository test utilities | Add one small shared fetch/XMLHttpRequest guard, symbol `[PROPOSED - name TBD]` |
| `yourwolf-frontend/package.json`, `yourwolf-frontend/package-lock.json` | Dependency and lockfile authority | Remove Axios through npm |
| `yourwolf-frontend/.env.example`, `yourwolf-frontend/README.md`, `yourwolf-frontend/src/vite-env.d.ts` | Frontend API configuration and documentation | Remove `VITE_API_URL`; remove the frontend README's API setup, `src/api/`, and Axios descriptions |
| `yourwolf-frontend/src/types/transport.ts`, `yourwolf-frontend/src/domain/roleDraft.ts` | Retained transport/domain contracts with stale HTTP references | Remove `NameCheckResult` and rewrite comments to describe current boundaries |
| `docs/phases/PHASE_05B/PHASE_05B_QA.md` | Required Phase 05b manual acceptance document | Create current-behavior checklist with every manual row `Pending` |

## Current Constraints

- The selected feature runs after completed Features 1 and 2 at validation commit `413adb2915070b09dea06d5326271338c5cf3113`.
- Do not change `yourwolf-backend/`, backend endpoints, root README backend URL lines, `yourwolf-frontend/src/engine/`, or `yourwolf-frontend/src/data/seed/`.
- Delete transport code instead of adding a replacement HTTP abstraction or compatibility shim.
- Use npm as the manifest and lockfile authority. The documented command is `npm uninstall axios` from `yourwolf-frontend/`; npm updates both `package.json` and `package-lock.json`.
- Preserve the current local validation, collision, preview, and repository-save contracts from the two completed prerequisites.
- Phase document sync uses baseline-truth wording. The new QA document describes current behavior and contains no `Updated`, `Changed`, `Fix`, revision, or changelog framing.
- Optional QA execution is disabled. Create the manual checklist, but leave every manual row `Pending` and the completion record pending.
- Phase 05a's 31 pending manual rows remain separate. Do not copy, supersede, or mark them complete.

## Verification Assets

### Existing automated coverage

- Builder host: `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`.
- Combined local application flow: `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx`.
- Local validator oracle: `yourwolf-frontend/src/test/domain/roleValidation.test.ts`.
- Name status: `yourwolf-frontend/src/test/hooks/useNameCheck.test.ts`.
- Existing shared repository utilities: `yourwolf-frontend/src/test/test_utils.tsx`.

No shared fetch/XMLHttpRequest guard exists. The smallest cohesive reuse is one helper in `yourwolf-frontend/src/test/test_utils.tsx`, used by the builder and Phase 05a smoke suites. The helper must install both browser-boundary spies before render, fail or record any attempted request, expose a zero-attempt assertion, and restore the original globals after each test. The final helper name is `[PROPOSED - name TBD]`.

### Commands

Run from `yourwolf-frontend/` unless a command starts with `git`:

```bash
npm uninstall axios
npm test -- --run src/test/pages/RoleBuilder.test.tsx src/test/integration/phase_05a_smoke.test.tsx
npm test -- --run
npm run test:coverage
npm run lint
npm run build
```

Launch the built application after `npm run build`:

```bash
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
curl --fail --silent --show-error http://127.0.0.1:4173/ >/dev/null
```

Run the preview command in one terminal and the curl command in another. A Vite ready message plus curl exit code 0 proves the built entry point launches. The focused browser tests and pending manual checklist provide behavior evidence.

Source-absence checks from the repository root:

```bash
test ! -d yourwolf-frontend/src/api
test ! -d yourwolf-frontend/src/test/api
! rg -n --hidden --glob '!node_modules/**' --glob '!dist/**' --glob '!coverage/**' "from ['\"][^'\"]*api/|import\\(['\"][^'\"]*api/" yourwolf-frontend/src
! rg -n '"axios"|node_modules/axios' yourwolf-frontend/package.json yourwolf-frontend/package-lock.json
! rg -n 'VITE_API_URL' yourwolf-frontend
! rg -n '\bNameCheckResult\b' yourwolf-frontend/src
```

Unchanged-scope checks use the phase baseline, which resolves to `b2874a68ca2ea4c73dfb218f121091e35cd2e87d`:

```bash
git diff --exit-code b2874a68ca2ea4c73dfb218f121091e35cd2e87d -- yourwolf-frontend/src/engine yourwolf-frontend/src/data/seed yourwolf-backend
git diff --exit-code 413adb2915070b09dea06d5326271338c5cf3113 -- README.md
```

The first command proves the phase did not change the engine, frontend seed copies, or backend endpoints. The second preserves the root README, including its backend URL lines.

## Exact Write Set

- Delete `yourwolf-frontend/src/api/client.ts`.
- Delete `yourwolf-frontend/src/api/roles.ts`.
- Delete `yourwolf-frontend/src/api/abilities.ts`.
- Delete `yourwolf-frontend/src/api/errors.ts`.
- Delete `yourwolf-frontend/src/test/api/abilities.api.test.ts`.
- Delete `yourwolf-frontend/src/test/api/errors.api.test.ts`.
- Delete `yourwolf-frontend/src/test/api/roles.api.test.ts`.
- Modify `yourwolf-frontend/package.json`.
- Modify `yourwolf-frontend/package-lock.json` through `npm uninstall axios`.
- Modify `yourwolf-frontend/src/test/setup.ts`.
- Modify `yourwolf-frontend/src/test/routes.test.tsx`.
- Modify `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`.
- Modify `yourwolf-frontend/src/test/integration/phase_05a_smoke.test.tsx`.
- Modify `yourwolf-frontend/src/test/test_utils.tsx`.
- Modify `yourwolf-frontend/.env.example`.
- Modify `yourwolf-frontend/README.md`.
- Modify `yourwolf-frontend/src/vite-env.d.ts`.
- Modify `yourwolf-frontend/src/types/transport.ts`.
- Modify `yourwolf-frontend/src/domain/roleDraft.ts`.
- Create `docs/phases/PHASE_05B/PHASE_05B_QA.md`.

No other path is required by the selected feature.

## Manual QA Document Requirements

`docs/phases/PHASE_05B/PHASE_05B_QA.md` must contain a short status, scope, environment, and rule block followed by executable tables. Start only the frontend from `yourwolf-frontend/`, keep the backend stopped before page load, open `http://localhost:3000/roles/new`, and preserve the DevTools Network log. Every manual status is `Pending`, every evidence cell is `—`, and the completion record remains pending.

Include these reachable browser scenarios in dependency order:

1. The builder loads with the backend stopped and the Network log records no request to `/api/v1`.
2. A 51-character name reaches Review and shows `Role name must be at most 50 characters.`
3. Reaching Review with no win condition shows `At least one win condition is required.`
4. Adding a win condition without marking it primary shows `Exactly one win condition must be marked as primary.`
5. Adding six ability steps shows the more-than-five-steps warning.
6. Adding `Copy Role` and `Change to Team` shows the conflict warning.
7. A case-variant official name such as `sEeR` reaches `Taken ✗` without network traffic.
8. A valid unique draft with exactly one primary win condition reaches `Available ✓`, enables `Create Role`, saves, and appears on `/roles`.
9. A new draft using a case variant of the saved private role reaches `Taken ✗` without network traffic.

Add a separate automated-evidence matrix, not manual rows, for states the current controls prevent: a visible lower-bound error, a non-`none` first modifier, absent or inactive ability type, duplicate or gapped step order, more than one primary condition, ability steps with `wake_order: null`, and a name that is simultaneously invalid by length and collides with a valid local role. Map those states to `yourwolf-frontend/src/test/domain/roleValidation.test.ts` and the relevant builder precedence test. This distinction keeps the manual document executable and records the verified limitation instead of inventing browser actions.

## Discoveries

| Finding | Impact | Action |
|---|---|---|
| The code graph is current at `413adb2915070b09dea06d5326271338c5cf3113`. `src/api/client.ts` has exactly six importers: the two API modules, two API suites, route tests, and the Phase 05a smoke suite. Each other API module is imported only by its own deletion-owned suite. | No production caller remains. HTTP deletion is ready. | Delete the enumerated transport and test surface. |
| `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx` already renders and edits the builder through both debounces. | A new builder suite would duplicate setup and mocks. | Patch the plan to add the zero-network scenario to the existing page suite. |
| No reusable fetch/XMLHttpRequest guard exists. | Two suites need the same browser-boundary proof and cleanup. | Add one cohesive helper to the existing `src/test/test_utils.tsx`; do not add a new utility module. |
| `npm uninstall axios` updates both npm authority files. | Hand-editing the lockfile is unnecessary and error-prone. | Use the npm command, then verify manifest and lockfile absence. |
| The frontend README still documents API environment setup, `src/api/`, and Axios. | Removing only the `VITE_API_URL` line would leave false current documentation. | Update those existing README sections while preserving the root README. |
| Shipped builder controls block forward navigation for short names, normalize the first modifier and step order, enforce one primary condition, select only catalog abilities, and map cleared wake order to `0`. Valid stored roles cannot have a one-character name. | Several validator errors, the null-wake-order warning, and length-plus-collision precedence cannot be observed manually through current controls. | Patch AC8 and the test plan. Use automated evidence for unreachable states and pending manual rows only for reachable behavior. |
| `yourwolf-frontend/.env.example` contains only an API heading and `VITE_API_URL`; `src/vite-env.d.ts` contains only Vite's reference plus that custom declaration. | Cleanup must not leave stale empty API prose or remove Vite's base type reference. | Replace the env example with current no-variable guidance and retain only the Vite client reference in the declaration file. |
| The phase summary already describes the intended post-feature behavior. | No summary or roadmap wording changes are required during this feature. | Create the required QA document only; apply baseline-truth wording and no changelog framing. |

## Plan Patch

Plan revision 2 replaces the proposed new builder suite with `yourwolf-frontend/src/test/pages/RoleBuilder.test.tsx`, assigns the shared guard to `yourwolf-frontend/src/test/test_utils.tsx`, expands the frontend README cleanup, and distinguishes reachable manual checks from automated-only invalid states. No acceptance behavior, feature order, or prerequisite changed.

## Readiness

**Ready for implementation.** Both prerequisites are complete, every remaining HTTP importer belongs to this feature, the exact deletion and modification surface is bounded, and the verification commands cover launch, behavior, dependency removal, source absence, and unchanged scope.
