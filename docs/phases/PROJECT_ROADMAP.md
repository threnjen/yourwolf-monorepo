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
| 04 | Client-Side Game Engine | Planned | Phase 3.6 | Large | Port night script generation, wake order engine, and ability resolution from Python to TypeScript |
| 05 | Local Data Layer | Planned | Phase 04 | Medium | SQLite for local storage, data access abstraction, offline role and game persistence |
| 06 | Desktop App (Tauri v2) | Planned | Phase 05 | Medium | Tauri v2 native shell, macOS and Windows builds (Linux best-effort), bundled seed data |
| 07 | Narration Engine | Planned | Phase 06 | Medium–Large | Text-to-speech for night phase narration, voice/pacing controls, fully offline-capable (research phase) |
| 08 | Mobile App (Tauri v2) | Planned | Phase 07 | Large | Tauri v2 mobile builds (iOS and Android), touch-optimized UI, responsive layout |
| 09 | Authentication & Users | Planned | Phase 08 | Medium | AWS Cognito auth, user profiles, role ownership, local-to-cloud role sync |
| 10 | Community Features | Planned | Phase 09 | Large | Public role sharing, voting, role sets, search and discovery, download-for-offline |
| 11 | Advanced Features | Planned | Phase 10 | Large | Conditional ability builder, content moderation, game history |
| 12 | Analytics & Balance Metrics | Planned | Phase 11 | Large | Win rate tracking, balance scoring, set recommendations, analytics dashboard |
| 13 | Production Deployment | Planned | Phase 12 | Large | AWS infrastructure, CI/CD, app store submissions |

### MVP Arc (Phases 04–08): Standalone Offline App

```
Phase 04          Phase 05          Phase 06           Phase 07          Phase 08
Game Engine   →   Local Data    →   Desktop App    →   Narration     →   Mobile App
(TypeScript)      (SQLite)          (Tauri macOS/Win)  (TTS, offline)    (Tauri iOS/Android)
```

After Phase 08, the app is a **fully self-contained, offline-capable game** on every target platform with voice narration. No server, no login, no internet required.

### Cloud Arc (Phases 09–13): Connected Features

Phases 09–13 add authentication, community, advanced features, analytics, and production infrastructure. These are additive — the offline game experience is always available.

## Constraints & Non-Goals

- **Offline-first**: The core game experience must work with zero internet connectivity on every platform
- **In-person play only**: No real-time multiplayer networking; the app facilitates in-person games
- **No monetization**: No payment or subscription features in the current roadmap
- **Desktop before mobile**: macOS and Windows ship before iOS/Android
- **Linux best-effort**: Tauri produces Linux builds via CI; no active testing commitment
- **Local roles sync to cloud later**: Custom roles created offline are stored locally; sync to cloud when auth arrives (Phase 09)
- **Python backend = cloud API**: The existing FastAPI backend is not bundled into the app; it becomes the server-side API for cloud features (Phase 09+)
- **Role name uniqueness**: Public roles must have unique names (including vs. base game roles) — enforced when cloud features arrive
- **No social logins initially**: Phase 09 uses email/password only; social logins deferred

## Architecture Notes

- **Monorepo**: `yourwolf-backend` (Python 3.14, FastAPI, SQLAlchemy — cloud API), `yourwolf-frontend` (React 18, TypeScript, Vite — shared UI), Tauri v2 for native shell
- **Dual data path**: SQLite (local/offline) ↔ PostgreSQL via FastAPI (cloud/online)
- **Game engine**: TypeScript client-side — night script generation, wake order engine, ability resolution (ported from Python `app/services/script_service.py`)
- **Ability system**: Atomic primitives (View, Swap, Copy, etc.) with sequencing and conditionals (AND/OR/IF)
- **Wake order engine**: Deterministic night phase — roles wake in order, execute steps sequentially
- **Narration**: TTS engine (specifics TBD in Phase 07 research) — must work fully offline
- **Auth** (Phase 09+): AWS Cognito (email/password + anonymous sessions)
- **Moderation** (Phase 10+): Three-layer approach — AWS Comprehend auto-filter → community flagging → manual review
- **Deployment** (Phase 13): AWS — RDS, ECS Fargate, CloudFront + S3, GitHub Actions CI/CD
- **Local dev**: Docker Compose for cloud backend development; Tauri dev server for desktop/mobile development
