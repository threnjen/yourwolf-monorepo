# QA Plan: Missing Instruction Templates

**Date:** 2026-03-28
**Mode:** Release QA Plan
**Scope:** 5 missing ability instruction templates (`change_to_team`, `perform_as`, `perform_immediately`, `stop`, `random_num_players`) added to `ScriptService`, completing all 15 ability types. Backend-only changes — templates are visible through the narrator preview panel UI.
**Environment:** Local development (Docker Compose backend + Vite frontend)
**Prerequisites:**
- Backend running: `cd yourwolf-backend && docker compose up` (or `uvicorn app.main:app --reload` with `.venv` activated and Postgres available)
- Frontend running: `cd yourwolf-frontend && npm run dev`
- Seed data loaded: `cd yourwolf-backend && python -m app.seed`
- Browser open at `http://localhost:5173`
- **The `preview-endpoint-fix` feature must be deployed** — without it, the preview panel returns 422 errors and these templates cannot be observed in the UI

## References

- Plan: `dev/missing-instruction-templates/missing-instruction-templates-plan.md`
- Implementation: `dev/missing-instruction-templates/missing-instruction-templates-implementation.md`
- Review: `dev/missing-instruction-templates/missing-instruction-templates-review.md`
- Coverage Map: `dev/missing-instruction-templates/missing-instruction-templates-coverage-map-qa.md`

---

## Summary of Changes

Added 5 private template methods to `ScriptService` in `app/services/script_service.py`:
- `_change_to_team_instruction()` — team-specific text using `params.get("team")`, with generic fallback
- `_perform_as_instruction()` — static text about deferred action at copied role's wake time
- `_perform_immediately_instruction()` — static text about immediate action
- `_stop_instruction()` — "Stop. Do not perform any further actions."
- `_random_num_players_instruction()` — formats `options` list (handles 0, 1, 2, 3+ items), with generic fallback

All 5 registered in the `templates` dict inside `_generate_step_instruction()` (now 15 entries). `random_num_players: 5` added to `STEP_DURATIONS`.

## Automated Test Coverage

The following are **fully covered by 12 automated tests** (all passing) — do not manually retest:

- **Template return values** (AC1–AC5): Each template method returns non-None strings with expected content — 8 unit tests using `_StandInStep`/`_StandInRole` directly
- **Dict completeness** (AC6–AC7): All 15 ability types produce non-None from `_generate_step_instruction()` — 1 comprehensive test iterates all types
- **Preview service output** (AC8–AC10): `preview_role_script()` includes the new instruction text for Doppelganger, Paranormal Investigator, and Blob — 3 integration tests with real DB sessions
- **Edge cases**: `change_to_team` with/without team param, `random_num_players` with 3 options / 1 option / no options, `stop` text content

---

## Manual QA Checklist

### 1. Narrator Preview Panel — New Template Rendering

**Covers ACs:** AC8, AC9, AC10
**Why manual:** Automated tests verify service-layer return values. Manual QA covers the actual rendered text in the browser preview panel after a full frontend→backend round-trip.

#### Happy Path

- [ ] **Paranormal Investigator preview shows change_to_team + stop instructions** — Navigate to the Role Builder. Create or edit a role named "Paranormal Investigator" with `wake_order` = `4`, `wake_target` = `player.self`. Add three ability steps in order: (1) `view_card` with target `player.other`, count `2`; (2) `change_to_team` with team `werewolf`; (3) `stop`. Observe the narrator preview panel. **Expected:** Preview displays instruction lines including text mentioning "werewolf" (from change_to_team) and text containing "Stop" (from stop), in addition to the view_card instruction and the wake/close-eyes lines.

- [ ] **Blob preview shows random_num_players with formatted options** — Create or edit a role named "Blob" with `wake_order` = `10`. Add one ability step: `random_num_players` with options `[2, 3, 4]`. Observe the preview panel. **Expected:** Preview displays an instruction line containing "2, 3, or 4" (Oxford comma format) and text about adjacent players joining the group.

- [ ] **Doppelganger preview shows perform_immediately instruction** — Create or edit a role named "Doppelganger" with `wake_order` = `1` (must be > 0). Add three ability steps: (1) `view_card` with target `player.other`; (2) `copy_role`; (3) `perform_immediately`. Observe the preview panel. **Expected:** Preview displays an instruction line containing "perform" referring to the copied role's night actions, in addition to the view and copy instructions.

#### Edge Cases

- [ ] **change_to_team without team parameter** — Create a role with `wake_order` > 0 and a single `change_to_team` step with no parameters (no team specified). **Expected:** Preview displays a generic fallback instruction (e.g., "You change teams.") instead of a blank or missing line. No errors in the browser console.

- [ ] **random_num_players with single option** — Create a role with `wake_order` > 0 and a `random_num_players` step with options `[3]`. **Expected:** Preview displays an instruction line mentioning "3 adjacent players" without the "A random number of" phrasing or comma-separated list.

- [ ] **All 5 new types produce visible instruction lines** — Create a role with `wake_order` > 0 and add all 5 new ability step types in sequence: `change_to_team` (with team "werewolf"), `perform_as`, `perform_immediately`, `stop`, `random_num_players` (with options `[2, 3]`). **Expected:** Preview panel displays a distinct instruction line for each of the 5 steps. No steps are silently skipped or produce blank lines.

- [ ] **OR modifier on stop step** — Create a role with `wake_order` > 0 and a `stop` step with modifier set to `OR`. **Expected:** Preview displays "OR Stop. Do not perform any further actions." — the modifier prefix is prepended to the template text.

---

## Cross-Cutting Concerns

### Performance

- [ ] **No preview regression with 15 template types** — Create a role with 5+ ability steps (mixing old and new types). **Expected:** Preview panel renders within the same responsiveness as before (~1s or less). No perceptible slowdown from the 5 additional dict entries.

---

## Notes

- The `preview-endpoint-fix` feature is a hard dependency for all manual QA. If the preview panel returns 422 errors, that feature has not been deployed — resolve that first.
- Review issue #3 (untested 2-option branch in `_random_num_players_instruction` for the `len(options) == 2` case) is noted as open/low-severity. The "All 5 new types" edge case checklist item above exercises this path with options `[2, 3]`.
- Template text is hardcoded English — no localization. This is consistent with all 10 existing templates.
- `condition_type` / `condition_params` are stored but NOT interpreted by templates (per non-goals). A `change_to_team` step with `condition_type: "only_if_team"` still produces unconditional text. Conditional rendering is a future feature.
