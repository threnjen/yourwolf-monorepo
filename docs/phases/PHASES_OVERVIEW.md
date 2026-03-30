# Project Roadmap: YourWolf

## Vision

A customizable One Night Ultimate Werewolf clone where users create, share, and vote on custom roles. The app serves as an in-person game facilitator providing narration scripts, timers, and role management.

## Phases

| Phase | Name | Status | Depends On | Complexity | Description |
|-------|------|--------|------------|------------|-------------|
| 01 | Foundation | Complete | None | Large | Project scaffolding, data models, Docker environment, 30 seeded roles |
| 02 | Game Facilitation | Complete | Phase 01 | Large | Game sessions, night script generation, timer, facilitator UI |
| 2.5 | Named Exports Migration | Complete | Phase 02 | Small | Migrate frontend from default to named exports |
| 03 | Role Builder MVP | Complete | Phase 02 | Large | Custom role creation wizard with ability composition and validation |
| 3.5 | Narrator Preview Fixes | Complete | Phase 03 | Small | Fix preview endpoint, wake_order == 0 handling, missing instruction templates |
| 3.6 | Wake Order Resolution | Complete | Phase 3.5 | Medium | Wake order review step in game creation, drag-to-reorder within groups |
| 04 | Authentication & Users | Planned | Phase 03 | Medium | AWS Cognito auth, user profiles, role ownership |
| 05 | Community Features | Planned | Phase 04 | Large | Public role sharing, voting, role sets, search and discovery |
| 06 | Advanced Features | Planned | Phase 05 | Large | Conditional ability builder, content moderation, audio narration, game history |
| 07 | Analytics & Balance Metrics | Planned | Phase 06 | Large | Win rate tracking, balance scoring, set recommendations, analytics dashboard |
| 08 | AWS Deployment | Planned | Phase 07 | Large | Production infrastructure with RDS, ECS Fargate, CloudFront, CI/CD |
| 09 | Mobile App | Planned | Phase 08 | Large | React Native cross-platform app with offline support and push notifications |

## Constraints & Non-Goals

- **Web-first**: Mobile app is last — full web feature set before mobile
- **In-person play only**: No real-time multiplayer networking; the app facilitates in-person games
- **No monetization**: No payment or subscription features in the current roadmap
- **Role name uniqueness**: Public roles must have unique names (including vs. base game roles)
- **Web assumes connectivity**: Offline-first strategy applies to mobile only (Phase 09)
- **No social logins initially**: Phase 04 uses email/password only; social logins deferred to Phase 08

## Architecture Notes

- **Monorepo**: `yourwolf-backend` (Python 3.14, FastAPI, SQLAlchemy), `yourwolf-frontend` (React 18, TypeScript, Vite), future `yourwolf-mobile` (React Native)
- **Database**: PostgreSQL via SQLAlchemy ORM with Alembic migrations
- **Ability system**: Atomic primitives (View, Swap, Copy, etc.) with sequencing and conditionals (AND/OR/IF)
- **Wake order engine**: Deterministic night phase — roles wake in order, execute steps sequentially
- **Auth** (Phase 04+): AWS Cognito (email/password + anonymous sessions)
- **Moderation** (Phase 05+): Three-layer approach — AWS Comprehend auto-filter → community flagging → manual review
- **Deployment** (Phase 08): AWS — RDS, ECS Fargate, CloudFront + S3, GitHub Actions CI/CD
- **Local dev**: Docker Compose — PostgreSQL (:5432), FastAPI backend (:8000), Vite frontend (:3000)
