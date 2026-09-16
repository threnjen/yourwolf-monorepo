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

## Phase 05 replanning (2026-09-16)

### Decisions the user made

1. **The old roadmap's storage and narration plans are discarded.** The user asked for an independent recommendation against the business requirements: offline on four platforms, custom roles that persist and later sync, a game that survives restart, voice narration, small phases, and no work done twice.
2. **Local data is a TypeScript repository interface with one IndexedDB implementation, used unchanged in the browser, Tauri desktop, and Tauri mobile. No SQLite, no sql.js, no native data plugin.** The dataset is 30 seed roles, custom roles, 15 ability primitives, and game snapshots, all JSON the engine already consumes.
3. **Narration uses the Web Speech API with system voices. No native plugin unless device QA fails.** Linux WebKitGTK has no speech synthesis and gets a fallback message.
4. **Tauri v2 stays as the shell.** Capacitor was weighed and rejected because desktop ships first and Capacitor needs Electron for desktop.
5. **Preferences are not a phase.** The narration phase adds voice and rate settings to the same store.
6. **Phases are split small with letter suffixes**: 05a catalog and store, 05b role authoring, 05c export and import, 06a desktop shell, 06b packaging, 07a narration, 07b conditional native fallback, 08a layout, 08b Android, 08c iOS.

### Web research

Report: `dev/research/tauri-v2-webview-storage-and-speech/tauri-v2-webview-storage-and-speech-report.md`.

- IndexedDB and localStorage persist by default in every Tauri v2 webview (macOS and iOS use the default persistent `WKWebsiteDataStore`; Windows WebView2 stores under the app identifier). Loss vectors: changing the app `identifier`, and the origin split between dev (`localhost:1420`) and production (`tauri.localhost`). `data_directory` is a no-op on WKWebView. No reported loss bugs on Linux, iOS, or Android. Whether Safari's 7-day purge applies inside WKWebView is unverified.
- `speechSynthesis` works offline with system voices on macOS, iOS, Windows WebView2, and Android (needs a system TTS engine). It is undefined on Linux WebKitGTK. Always feature-detect and wait for `voiceschanged`.
- Tauri mobile is stable since 2.0.0 (2024-10-02); current stable 2.11.5. Official `tauri-plugin-sql` and `tauri-plugin-store` support iOS and Android. No official TTS plugin; `brenogonzaga/tauri-plugin-tts` covers all five platforms and is maintained.

### Facts discovered

- Seed roles in `yourwolf-backend/app/seed/data/roles.json` have no ids. Dependencies in `role_dependencies` reference roles by name. The local catalog must mint stable ids.
- Ability primitives are Python dicts in `yourwolf-backend/app/seed/abilities.py` (15 primitives), not JSON.
- Both packages build from their own Docker context (`yourwolf-backend/docker-compose.yml` uses `.` and `../yourwolf-frontend`), so a monorepo-root shared seed file would break the builds. The backend keeps the canonical files and the frontend carries a parity-guarded copy.
- Remaining server calls after 04b: `rolesApi.list` in `useRoles`, `rolesApi.getById` in `WakeOrderResolution`, `abilitiesApi.list` in `useAbilities`, `rolesApi.validate` and `rolesApi.create` in `RoleBuilder`, `rolesApi.checkName` in `useNameCheck`.
- Game snapshot callers: `useGame.ts`, `GameFacilitator.tsx`, `WakeOrderResolution.tsx`, all through `saveGameSnapshot` and `loadGameSnapshot` in `src/storage/game_session_storage.ts`.
- The 04b manual browser QA rows were never executed. Phase 05a manual QA covers the same game flow against the local store.
