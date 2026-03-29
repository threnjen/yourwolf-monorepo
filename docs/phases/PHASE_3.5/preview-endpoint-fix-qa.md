# QA Plan: Preview Endpoint Fix

**Date:** 2026-03-28
**Mode:** Release QA Plan
**Scope:** Fixes the narrator preview panel 422 errors by introducing `PreviewScriptRequest` schema with relaxed validation, fixing `wake_order == 0` handling in preview and full game script, and updating the frontend API client to send only preview-relevant fields.
**Environment:** Local development (Docker Compose backend + Vite frontend)
**Prerequisites:**
- Backend running: `cd yourwolf-backend && docker compose up` (or `uvicorn app.main:app --reload` with `.venv` activated and Postgres available)
- Frontend running: `cd yourwolf-frontend && npm run dev`
- Seed data loaded: `cd yourwolf-backend && python -m app.seed` (provides Seer, Werewolf, Doppelganger, Villager, etc.)
- Browser open at `http://localhost:5173`

## References

- Plan: `dev/preview-endpoint-fix/preview-endpoint-fix-plan.md`
- Implementation: `dev/preview-endpoint-fix/preview-endpoint-fix-implementation.md`
- Review: `dev/preview-endpoint-fix/preview-endpoint-fix-review.md`
- Coverage Map: `dev/preview-endpoint-fix/preview-endpoint-fix-coverage-map-qa.md`

---

## Summary of Changes

The narrator preview endpoint (`POST /api/roles/preview-script`) previously required the full `RoleCreate` payload (including `description`, `team`, `votes`, `win_conditions`). The frontend sends drafts-in-progress that lack these fields, causing 422 validation errors. This fix:

1. Adds a `PreviewScriptRequest` schema with only `name`, `wake_order`, `wake_target`, `ability_steps` — no `min_length` on `name`
2. Updates the endpoint and service to use `PreviewScriptRequest`
3. Fixes `wake_order == 0` to return empty actions (previously only `None` was handled)
4. Fixes `generate_night_script()` to exclude `wake_order == 0` roles from real game scripts
5. Updates the frontend `previewScript()` to send only the 4 preview-relevant fields via `draftToPreviewPayload()`

## Automated Test Coverage

The following are **fully covered by automated tests** — do not manually retest:

- **Schema validation** (AC1): `PreviewScriptRequest` accepts minimal/all fields, allows empty name, rejects negative `wake_order` — 5 unit tests
- **Endpoint HTTP behavior** (AC2): Minimal payloads return 200, payloads without `description` return 200, empty name returns 200 — 3 integration tests
- **`wake_order == 0` and `None` service logic** (AC3): Both return empty `actions` array — 2 unit tests
- **Night script query exclusion** (AC4): `wake_order == 0` roles are excluded from `generate_night_script()` output — 1 integration test with real DB
- **Frontend payload shape** (AC5): `previewScript()` sends only `name`, `wake_order`, `wake_target`, `ability_steps`; does not send `description`, `team`, `votes`, `win_conditions` — 2 unit tests
- **Test suite integrity** (AC6, AC7): 32/32 backend tests pass, 27/27 frontend tests pass

---

## Manual QA Checklist

### 1. Preview Panel Live Round-Trip (Role Builder UI)

**Covers ACs:** AC2, AC3, AC5
**Why manual:** Automated tests use mocked HTTP clients. This verifies the actual frontend→backend round-trip renders correct preview content in the browser.

#### Happy Path

- [ ] **Preview with waking role** — Navigate to the Role Builder page. Enter a name (e.g., "Test Seer"). Set `wake_order` to `4`. Add one ability step (e.g., type `view_role`, target `player.other`). Observe the narrator preview panel. **Expected:** Preview panel displays 3+ instruction lines: a "wake up" line containing the role name, an ability instruction line, and a "close your eyes" line. No errors in the browser console.

- [ ] **Preview updates on draft change** — With the above role still open, change the name from "Test Seer" to "Night Watcher". Wait ~500ms for debounce. **Expected:** Preview panel updates — the "wake up" instruction now says "Night Watcher, wake up." instead of "Test Seer, wake up."

- [ ] **Preview with empty name** — Clear the name field entirely (empty string). Keep `wake_order` at a non-zero value. **Expected:** Preview panel still renders actions (the wake instruction shows `", wake up."` with no name prefix). No 422 error. No console errors.

#### Edge Cases

- [ ] **Non-waking role (wake_order = 0)** — Set `wake_order` to `0` (or leave it at default for a new role). Add ability steps. **Expected:** Preview panel shows a "does not wake up" or empty-actions state. No 422 error. No console errors.

- [ ] **wake_order changed from 0 to non-zero** — Start with `wake_order = 0` (empty preview). Then change `wake_order` to `3`. **Expected:** Preview panel transitions from empty/no-wake state to showing wake + ability + close-eyes instructions.

- [ ] **Role with ability steps but wake_order = 0** — Add multiple ability steps (e.g., `view_role`, `choose_player`) with `wake_order` still at `0`. **Expected:** Preview panel remains empty/no-wake — ability steps are irrelevant for non-waking roles. No errors.

#### Error Handling

- [ ] **Backend unavailable** — Stop the backend server. Make a change in the Role Builder to trigger a preview request. **Expected:** Preview panel shows an error state or remains unchanged. The page does not crash. A network error appears in the browser console but the UI handles it gracefully (no unhandled promise rejection splash).

### 2. Night Script Generation — `wake_order == 0` Exclusion in Live Game

**Covers ACs:** AC4
**Why manual:** The integration test covers the query logic with a test DB session, but this verifies the behavior in a real game flow where seed data includes `wake_order == 0` roles (Doppelganger, Copycat).

- [ ] **Create a game with a wake_order=0 role** — Start a new game session. Add players and assign roles such that at least one role has `wake_order == 0` (e.g., Doppelganger from seed data) and at least one has `wake_order > 0` (e.g., Seer). Generate the night script. **Expected:** The night script includes narrator turns for the Seer but does NOT include a narrator turn for the Doppelganger. Verify via the game script view or by inspecting the API response from `POST /api/games/{id}/script`.

---

## Cross-Cutting Concerns

### Performance

- [ ] **Preview debounce responsiveness** — In the Role Builder, type rapidly in the name field (5+ characters in quick succession). **Expected:** Only one preview request fires after typing stops (visible in browser Network tab). The preview panel does not flicker or show intermediate states for each keystroke.

### Accessibility

- [ ] **Preview panel keyboard navigation** — Tab to the Role Builder form fields and make changes using keyboard only. **Expected:** Preview panel updates are announced or visible without requiring mouse interaction. Focus does not jump unexpectedly when the preview refreshes.

### Security

- [ ] **Extra fields in preview payload are ignored** — Using browser DevTools or a tool like `curl`, send a `POST /api/roles/preview-script` with extra fields (e.g., `{"name": "X", "wake_order": 3, "ability_steps": [], "description": "injected", "team": "werewolf"}`). **Expected:** Returns 200 with valid preview. The extra fields are silently ignored (Pydantic `BaseModel` default behavior). No data is persisted — this is a read-only endpoint.

---

## Notes

- The `_generate_step_instruction()` method returns `None` for unrecognized ability types (`perform_immediately`, `perform_as`, `change_to_team`, `stop`). This is pre-existing behavior outside this fix's scope. If the tester adds steps with these types, they will silently produce no instruction line in the preview — this is expected.
- Review issue #3 (dead code `_doppelganger_create()` helper) is cosmetic and does not affect QA.
- Review issue #4 (`PreviewScriptRequest` not exported from `schemas/__init__.py`) is consistent with other narrator schemas and has no downstream impact.
