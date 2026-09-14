# Discovery Context

Project-wide context gathered during planning that the codebase does not record. Read by Phase - Refiner and Phase - Execute. Append per planning session.

## Phase 04b planning (2026-09-14)

### Decisions the user made

1. **Game session storage: `sessionStorage` keyed by game id.** A small module stores the engine session and the adapted role inputs together. It answers both the page-to-page handoff (wake-order page to facilitator) and refresh mid-game. Alternatives rejected: an in-memory registry with redirect on refresh (loses the game at the worst moment), and router-state handoff (the refactor audit rated it High risk). Phase 05 replaces the store with SQLite.
2. **Role ability data comes from `GET /roles/{id}` per distinct selected role at Start Game.** The list endpoint omits `ability_steps` and `wake_target` by backend design (`RoleListItem` docstring: "without nested details"). Alternative rejected: extending the backend list response, because `docs/CODEBASE_CONTEXT.md` records "Do NOT modify the Python backend for Phase 04 work".
3. **The games API client, its test, and unused game-session mocks are deleted in 04b**, not left for Phase 05. The phase's claim is that games run locally, and a live server client contradicts it.

### Facts discovered

- The six server call sites: `src/pages/WakeOrderResolution.tsx` (create), `src/hooks/useGame.ts` (load, night script), `src/pages/GameFacilitator.tsx` (start, advance), `src/pages/RoleBuilder.tsx` (preview).
- The transport `Role` type in `src/types/transport.ts` lacks `min_count`, `max_count`, `is_primary_team_role`, and `dependencies`, although the backend `RoleRead` schema returns all four. 04b extends the type.
- Backend `AbilityStepInRole.ability_type` is `str | None`. The transport `AbilityStep` declares it as `string`. The adapter must treat null as an unknown type the engine skips.
- The facilitator reads only `phase`, `player_count`, `center_card_count`, and `discussion_timer_seconds`, all present on the engine `GameSession`. `ScriptReader` reads only `script.actions`.
- Page and hook tests mock `../../api/games` with `vi.mock`; those mocks disappear with the client.
- Role validation (`POST /roles/validate`), name check, role save, and the role catalog fetch stay on the server through 04b.

### No external research or user-provided documents were used in this session.
