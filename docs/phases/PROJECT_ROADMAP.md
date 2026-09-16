# Project Roadmap: YourWolf

## Vision

A customizable One Night Ultimate Werewolf clone that works as a standalone, offline-capable app on macOS, Windows, iOS, and Android. Users create custom roles and run in-person games with voice narration — no internet required. Cloud features (accounts, community sharing, analytics) layer on top for connected users.

## Phases

| Phase | Name | Status | Depends On | Complexity | Description |
|-------|------|--------|------------|------------|-------------|
| 01 | Foundation | Complete | None | Large | Project scaffolding, data models, Docker environment, 30 seeded roles |
| 02 | Game Facilitation | Complete | Phase 01 | Large | Game sessions, night script generation, timer, facilitator UI |
| 2.5 | Named Exports Migration | Complete | Phase 02 | Small | Migrate frontend from default to named exports |
| 03 | Role Builder MVP | Complete | Phase 02 | Large | Custom role creation wizard with ability composition and validation |
| 3.5 | Narrator Preview Fixes | Complete | Phase 03 | Small | Fix preview endpoint, wake_order == 0 handling, missing instruction templates |
| 3.6 | Wake Order Resolution | Complete | Phase 3.5 | Medium | Wake order review step in game creation, drag-to-reorder within groups |
| 04a | Client-Side Game Engine | Complete | Phase 3.6 | Medium | Verified pure TypeScript engine under `src/engine/`: night script generation, narrator preview, deterministic wake order, setup validation, and an immutable phase state machine |
| 04b | Engine Frontend Integration | Complete | Phase 04a | Medium | The local engine handles game flow and narrator preview. Session storage preserves in-progress games. Start Game fetches selected-role details. The games API client is deleted. Manual browser QA rows in `PHASE_04B/PHASE_04B_QA.md` were not executed at close. |
| 05a | Local Catalog and Store | Planned | Phase 04b | Medium | Repository interface with one IndexedDB implementation. Bundled seed roles and abilities seeded on first launch. Role list, role detail, abilities, and game snapshots read locally. |
| 05b | Local Role Authoring | Planned | Phase 05a | Medium | Role validation, warnings, and name check ported to the domain with a Python parity fixture. Local role save. The HTTP client is deleted. The frontend makes zero server calls. |
| 05c | Backup Export and Import | Planned | Phase 05b | Small | JSON export and import of custom roles as the durability backstop and the seam later cloud sync reuses. |
| 06a | Tauri Desktop Shell | Planned | Phase 05c | Medium | Tauri v2 scaffold with a fixed app identifier, macOS and Windows dev and build, restart-persistence QA of the local store. |
| 06b | Desktop Packaging | Planned | Phase 06a | Small | Icons, window state, CI build matrix, Linux best-effort build. |
| 07a | Narration | Planned | Phase 06b | Medium | Web Speech API reads the night script. Voice and rate settings in the local store. Feature-detected fallback message where speech is absent. |
| 07b | Native Speech Fallback | Planned | Phase 07a | Small | A native TTS plugin only if 07a fails on a target device. Skipped otherwise. |
| 08a | Touch and Responsive Layout | Planned | Phase 07a | Medium | Touch targets and responsive layout, verified in the browser first. |
| 08b | Android Build | Planned | Phase 08a | Medium | Tauri v2 Android build, device QA of storage and narration. |
| 08c | iOS Build | Planned | Phase 08b | Medium | Tauri v2 iOS build, device QA of storage and narration. |
| 09 | Authentication & Users | Planned | Phase 08c | Medium | AWS Cognito auth, user profiles, role ownership, local-to-cloud role sync |
| 10 | Community Features | Planned | Phase 09 | Large | Public role sharing, voting, role sets, search and discovery, download-for-offline |
| 11 | Advanced Features | Planned | Phase 10 | Large | Conditional ability builder, content moderation, game history |
| 12 | Analytics & Balance Metrics | Planned | Phase 11 | Large | Win rate tracking, balance scoring, set recommendations, analytics dashboard |
| 13 | Production Deployment | Planned | Phase 12 | Large | AWS infrastructure, CI/CD, app store submissions |

### MVP Arc (Phases 05a–08c): Standalone Offline App

```
Phase 05a-c        Phase 06a-b        Phase 07a-b        Phase 08a-c
Local Data     →   Desktop Shell  →   Narration      →   Mobile
(IndexedDB)        (Tauri v2)         (Web Speech)       (Tauri v2 iOS/Android)
```

After Phase 08c, the app is a **fully self-contained, offline-capable game** on every target platform with voice narration. No server, no login, no internet required.

### Cloud Arc (Phases 09–13): Connected Features

Phases 09–13 add authentication, community, advanced features, analytics, and production infrastructure. These are additive — the offline game experience is always available.

## Constraints & Non-Goals

- **Offline-first**: The core game experience must work with zero internet connectivity on every platform
- **In-person play only**: No real-time multiplayer networking; the app facilitates in-person games
- **No monetization**: No payment or subscription features in the current roadmap
- **Desktop before mobile**: macOS and Windows ship before iOS/Android
- **Linux best-effort**: Tauri produces Linux builds via CI; no active testing commitment. Linux WebKitGTK has no speech synthesis, so narration shows a fallback message there
- **Local roles sync to cloud later**: Custom roles created offline are stored locally; sync to cloud when auth arrives (Phase 09)
- **Python backend = cloud API**: The existing FastAPI backend is not bundled into the app; it becomes the server-side API for cloud features (Phase 09+)
- **Role name uniqueness**: Public roles must have unique names (including vs. base game roles) — enforced when cloud features arrive
- **No social logins initially**: Phase 09 uses email/password only; social logins deferred
- **Small phases**: Each phase is one reviewable pull request. Split with letter suffixes (05a, 05b) rather than growing a phase

## Architecture Notes

- **Monorepo**: `yourwolf-backend` (Python 3.14, FastAPI, SQLAlchemy — cloud API), `yourwolf-frontend` (React 18, TypeScript, Vite — shared UI), Tauri v2 for native shell
- **Local data (decided 2026-09-16)**: A TypeScript repository interface with one IndexedDB implementation, used unchanged in the browser, in Tauri desktop, and in Tauri mobile. **No SQLite.** The dataset is small JSON the engine already consumes, and IndexedDB persists by default in every Tauri v2 webview. Records carry an id and an updated timestamp so Phase 09 sync needs no schema change. The two known loss vectors, an app identifier change and the dev-versus-production origin split, are handled by fixing the identifier once and by the Phase 05c export and import. See `dev/research/tauri-v2-webview-storage-and-speech/`
- **Narration (decided 2026-09-16)**: The Web Speech API with system voices, no native plugin. Works offline on macOS, iOS, Windows, and Android. A maintained community Tauri TTS plugin is the fallback only if device QA fails
- **Seed data**: The backend owns the canonical seed files under `yourwolf-backend/app/seed/data/`. The frontend carries a copy under `src/data/seed/` guarded by a parity test, because each package builds from its own Docker context
- **Game engine**: Pure TypeScript engine under `src/engine/` — narration, deterministic wake ordering, setup validation, and immutable phase transitions. Pages call it through adapters and the repository layer
- **Ability system**: Atomic primitives (View, Swap, Copy, etc.) with sequencing and conditionals (AND/OR/IF)
- **Wake order engine**: Deterministic night phase — roles wake in order, execute steps sequentially
- **Auth** (Phase 09+): AWS Cognito (email/password + anonymous sessions)
- **Moderation** (Phase 10+): Three-layer approach — AWS Comprehend auto-filter → community flagging → manual review
- **Deployment** (Phase 13): AWS — RDS, ECS Fargate, CloudFront + S3, GitHub Actions CI/CD
- **Local dev**: Docker Compose for cloud backend development; Vite dev server and Tauri dev server for the offline app
