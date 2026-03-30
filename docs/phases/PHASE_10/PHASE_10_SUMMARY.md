# Phase 10: Community Features

**Status**: Planned
**Depends on**: Phase 09 (Authentication & Users)
**Estimated complexity**: Large
**Cross-references**: Existing role model `yourwolf-backend/app/models/role.py` (visibility enum), Phase 09 auth layer

## Objective

Build the community layer where users can publish custom roles for others to discover, vote on favorites, create curated role sets, and download community roles for offline play.

## Scope

### In Scope
- Role publishing workflow: private → public transition with basic validation
- Upvote/downvote system for public roles (one vote per user per role)
- Role sets (curated collections): create, edit, share, with player count ranges
- Search and filter: by name, team, ability type, player count, vote score
- Role detail pages with full ability breakdown and creator info
- Browse/discovery page with popular/trending/newest feeds
- Denormalized vote scores for efficient sorting
- Role set voting (separate from role voting)
- Download-for-offline: logged-in users can save community roles to local SQLite for offline play
- Role name uniqueness enforcement: public roles must have unique names (including vs. base game roles)

### Out of Scope
- Comments on roles (adds moderation complexity — defer)
- AI-powered content moderation (Phase 11 — Advanced Features)
- Role forking/cloning
- Follower/following system
- Notification system for votes or activity
- Role version history

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Publishing Workflow | Visibility toggle (private → public), validation, name uniqueness check | Backend service |
| 2 | Voting System | Upvote/downvote API, denormalized score, one-vote-per-user | Model, router, service |
| 3 | Role Sets | CRUD for curated role collections with player count ranges | Model, router, service, UI |
| 4 | Search & Filter | Full-text search, filter by team/ability/player count, sort options | Backend query service, UI |
| 5 | Browse Page | Feeds: popular, trending, newest; category navigation | Frontend page |
| 6 | Role Detail Page | Full role view with abilities, win conditions, vote controls, creator info | Frontend page |
| 7 | Download for Offline | Save community roles to local SQLite; mark as "downloaded" | Sync extension |

## Technical Context

- Existing role model: `app/models/role.py` — has `visibility` enum (private/public/official), `creator_id`, `vote_score`, `use_count`
- Existing role router: `app/routers/roles.py` — currently returns all roles; needs filtering by visibility
- User model and auth (Phase 09): creator display on public roles, voting requires auth
- Frontend repository layer (Phase 05/09): download-for-offline writes community roles into local SQLite via the sync service
- New PostgreSQL tables needed: `role_votes`, `role_sets`, `role_set_items`, `role_set_votes`
- Browse page replaces or extends existing `src/pages/Roles.tsx`
- Community features only appear when online + logged in; offline users see only local roles

## Dependencies & Risks

- **Dependency**: Phase 09 auth must be complete — voting and publishing require authenticated users
- **Dependency**: Python backend must be accessible (local dev via Docker, or deployed)
- **Risk**: Vote score denormalization can drift — mitigate with periodic reconciliation or database triggers
- **Risk**: Moderation without AI (Phase 11) means manual review; mitigate with automated keyword filters initially
- **Risk**: Search performance — PostgreSQL full-text search is adequate initially; may need optimization later
- **Risk**: Download-for-offline could create stale local copies — show "last downloaded" date and offer refresh

## Success Criteria

- [ ] User publishes a role from private to public
- [ ] Published role appears in browse page for other users
- [ ] User upvotes/downvotes a role; score updates; user cannot double-vote
- [ ] User creates a role set with selected roles and player count range
- [ ] Search by name returns matching public roles
- [ ] Filter by team returns correct subset
- [ ] Browse page shows popular, trending, and newest sections
- [ ] User downloads a community role for offline play
- [ ] Downloaded roles are available in game setup when offline
- [ ] Unauthenticated/offline users see only local roles (no community UI)

## QA Considerations

- Browse page, role detail page, vote interaction, and set builder all require manual QA
- Test online → download role → go offline → use downloaded role in game
- Vote state persistence (refresh page, still shows your vote)
- Community features should be completely hidden when offline or not logged in

## Notes for Feature - Decomposer

Decomposition: publishing workflow → voting system → role sets → search & filter → browse page → role detail page → download-for-offline. The download-for-offline feature extends the Phase 09 sync service and should come last. The browse page and role detail page are frontend-heavy features. Search & filter spans backend (query service) and frontend (UI controls).
