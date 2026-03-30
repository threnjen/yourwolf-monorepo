# Phase 6: Desktop App (Tauri v2)

**Status**: Planned
**Depends on**: Phase 05 (Local Data Layer)
**Estimated complexity**: Medium
**Cross-references**: Tauri v2 documentation at https://v2.tauri.app

## Objective

Package the React frontend and local game engine as a native desktop application using Tauri v2, producing installable builds for macOS and Windows (Linux best-effort) that work fully offline.

## Scope

### In Scope
- Tauri v2 project scaffolding within the monorepo (`src-tauri/` directory)
- Tauri configuration for building with the existing React/Vite frontend
- Tauri SQL plugin for native SQLite access (replacing sql.js Wasm in desktop context)
- Platform detection layer: choose native SQLite (Tauri) vs. sql.js (browser) at runtime
- App window configuration: minimum size, title bar, window state persistence
- Bundled seed data: 30 official roles packaged with the app binary
- macOS build: `.dmg` installer, code signing configuration
- Windows build: `.msi` or `.exe` installer, code signing configuration
- Linux build: `.AppImage` and `.deb` packages (best-effort, CI-built, not actively tested)
- App icon and basic branding
- Auto-update infrastructure (Tauri updater plugin) — check for updates when online
- CI workflow: GitHub Actions builds for all three platforms on tag/release

### Out of Scope
- Audio narration (Phase 07 — Narration Engine)
- Mobile builds (Phase 08 — Mobile App)
- Cloud connectivity or auth (Phase 09)
- App store distribution (macOS App Store and Microsoft Store — Phase 13)
- Custom title bar or native menus beyond defaults
- Crash reporting or analytics telemetry

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Tauri Project Setup | Tauri v2 scaffolding, Cargo.toml, tauri.conf.json, Vite integration | Project configuration |
| 2 | Native SQLite Bridge | Tauri SQL plugin wired to the repository layer from Phase 05 | Platform adapter |
| 3 | Platform Detection | Runtime detection of Tauri vs. browser context; swap SQLite implementation | Adapter pattern |
| 4 | App Shell Configuration | Window size, title, icon, state persistence | Tauri config |
| 5 | macOS Build | `.dmg` installer with code signing config | Build pipeline |
| 6 | Windows Build | `.msi`/`.exe` installer with code signing config | Build pipeline |
| 7 | Linux Build | `.AppImage` and `.deb` packages | Build pipeline |
| 8 | CI/CD Pipeline | GitHub Actions workflow: build all platforms on release tag | CI config |
| 9 | Auto-Update | Tauri updater plugin: check for updates when online | Update mechanism |

## Technical Context

- Frontend entry: `yourwolf-frontend/src/main.tsx` — Tauri wraps this as-is via the Vite dev server (dev) or built static files (production)
- Vite config: `yourwolf-frontend/vite.config.ts` — needs Tauri-specific adjustments (server host, HMR WebSocket)
- Repository interfaces (Phase 05): the `SqliteRepository` implementation needs a platform-aware SQLite driver
- sql.js (Phase 05): used in browser; Tauri SQL plugin (`@tauri-apps/plugin-sql`) used in native context
- Tauri v2 uses Rust for the native backend — the Rust layer will be thin (SQLite plugin, file system, window management)
- Tauri v2 supports both desktop (macOS, Windows, Linux) and mobile (iOS, Android) from the same project — mobile targets are deferred to Phase 08
- Monorepo structure: Tauri project at `yourwolf-frontend/src-tauri/` (colocated with the frontend it wraps)
- Build toolchain: Rust/Cargo for Tauri, Node.js for frontend, combined via `tauri build`

## Dependencies & Risks

- **Dependency**: Phase 05 data layer with repository pattern must be complete — Tauri wires the native SQLite implementation
- **Dependency**: Rust toolchain must be installed for development (rustup, Cargo)
- **Dependency**: Xcode (macOS builds), Visual Studio Build Tools (Windows builds)
- **Risk**: Platform-specific bugs — WebView rendering differences between macOS (WebKit), Windows (WebView2), Linux (WebKitGTK) — mitigate by testing on all three platforms in CI
- **Risk**: Code signing costs and complexity — Apple Developer account ($99/year) required for macOS signing; Windows signing certificates have annual cost — can ship unsigned for initial testing
- **Risk**: Tauri v2 is relatively new — potential for edge cases or missing features; mitigate by staying on stable releases and monitoring the Tauri GitHub issues
- **Mitigation**: Start with macOS (primary development platform), then Windows, then Linux last

## Success Criteria

- [ ] `tauri dev` launches the app in a native window with hot reload
- [ ] `tauri build` produces installable binaries for macOS (.dmg) and Windows (.msi/.exe)
- [ ] App works fully offline: browse seed roles, create custom roles, run games — no internet required
- [ ] Local SQLite database persists data between app launches
- [ ] Seed data loads on first launch in native context
- [ ] Platform detection correctly chooses native SQLite (Tauri) vs. sql.js (browser)
- [ ] GitHub Actions CI produces builds for macOS, Windows, and Linux on release
- [ ] Auto-updater checks for updates when online (gracefully does nothing when offline)

## QA Considerations

- Full game flow must be manually tested on macOS and Windows: launch → browse roles → create game → run night phase → complete game
- Test first launch (empty database → seed → ready) on each platform
- Test offline behavior: disconnect network, verify all features work
- Test window management: resize, minimize, restore, close → reopen preserves state
- Linux builds should be smoke-tested in CI (virtual machine) but do not require manual QA

## Notes for Feature - Decomposer

Natural decomposition: Tauri scaffolding + Vite integration → native SQLite bridge → platform detection → app shell config → CI builds. The SQLite bridge is the most technically complex feature — it requires a clean adapter that fulfills the Phase 05 repository interface using the Tauri SQL plugin. CI builds should be a separate feature since they involve GitHub Actions configuration independent of the app code.
- [ ] Game history page shows past games with filtering
- [ ] Stats summary endpoint returns win counts and averages

## QA Considerations

- Conditional builder UI requires extensive manual QA: condition selection, parameter inputs, THEN/ELSE branching, nested conditions
- Audio player needs QA across browsers (playback, progress, volume)
- Game history page filtering and date range selection need manual testing
- Moderation false positive/negative rates should be sampled during QA

## Notes for Feature - Decomposer

Four largely independent feature areas: (1) conditionals (model + validator + UI), (2) moderation (service + publishing integration), (3) audio (service + S3 caching + player component), (4) game history (models + API + page). Each area can be decomposed further internally. The conditional builder is the most complex — consider splitting model/validator (backend) from the UI (frontend). Moderation depends on the Phase 05 publishing workflow. Audio and game history have no cross-dependencies with each other.
