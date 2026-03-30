# Phase 5: Community Features

**Status**: Planned
**Depends on**: Phase 04 (Authentication & Users)
**Estimated complexity**: Large
**Cross-references**: None

## Objective

Build the community layer where users can publish custom roles for others to discover, vote on favorites, create curated role sets for specific player counts, and browse/search the community catalog.

## Scope

### In Scope
- Role publishing workflow: private → public transition with basic moderation queue
- Upvote/downvote system for public roles (one vote per user per role)
- Role sets (curated collections): create, edit, share, with player count ranges
- Search and filter: by name, team, ability type, player count, vote score
- Role detail pages with full ability breakdown
- Browse page with popular/trending/newest feeds
- Denormalized vote scores for efficient sorting
- Role set voting (separate from role voting)

### Out of Scope
- Comments on roles (defer — adds moderation complexity)
- AI-powered content moderation (Phase 06 — AWS Comprehend)
- Role forking/cloning
- Follower/following system
- Notification system for votes or activity
- Role version history

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Publishing Workflow | Visibility toggle (private → public), basic moderation queue | Backend service, admin review |
| 2 | Voting System | Upvote/downvote API, denormalized score on roles, one-vote-per-user | Model, router, service |
| 3 | Role Sets | CRUD for curated role collections with player count ranges | Model, router, service, UI |
| 4 | Search & Filter | Full-text search, filter by team/ability/player count, sort options | Backend query service, UI |
| 5 | Role Detail Page | Full role view with abilities, win conditions, vote controls, creator info | Frontend page |
| 6 | Browse Page | Feeds: popular, trending, newest; category navigation | Frontend page |

## Technical Context

- Existing role model: `app/models/role.py` — has `visibility` enum (private/public/official) and `creator_id`
- Existing role router: `app/routers/roles.py` — currently returns all roles; needs filtering by visibility
- User model: `app/models/user.py` (from Phase 04) — creator display on public roles
- Auth dependencies: `app/auth/dependencies.py` (from Phase 04) — voting requires auth, browsing does not
- Frontend: `src/pages/Roles.tsx` — current role list page, will be expanded or replaced by Browse page
- New tables needed: `role_votes`, `role_sets`, `role_set_items`, `role_set_votes`

## Dependencies & Risks

- **Dependency**: Phase 04 auth must be complete — voting and publishing require authenticated users
- **Dependency**: Role `visibility` field must already exist (it does from Phase 01)
- **Risk**: Vote score denormalization can drift — mitigate with periodic reconciliation job or trigger
- **Risk**: Moderation queue without AI (Phase 06) means manual review; could bottleneck if adoption is high — mitigate by starting with automated keyword filters
- **Risk**: Search performance — full-text search on PostgreSQL is adequate initially; may need dedicated search service later

## Success Criteria

- [ ] User publishes a role from private to public
- [ ] Published role appears in browse page for other users
- [ ] User upvotes/downvotes a role; score updates; user cannot double-vote
- [ ] User creates a role set with selected roles and player count range
- [ ] Search by name returns matching public roles
- [ ] Filter by team returns correct subset
- [ ] Browse page shows popular, trending, and newest sections
- [ ] Role detail page shows full ability breakdown, creator info, and vote controls
- [ ] Unauthenticated users can browse and search but cannot vote or publish

## QA Considerations

- Browse page, role detail page, vote interaction, and set builder all require manual QA
- Search relevance and filter accuracy should be tested with a variety of seeded public roles
- Vote state persistence (refresh page, still shows your vote) needs verification
- Moderation queue needs admin-side QA

## Notes for Feature - Decomposer

Suggested decomposition: (1) role publishing workflow + visibility filtering, (2) voting system (model + API + frontend controls), (3) role sets CRUD (backend), (4) role set builder UI, (5) search & filter (backend query + frontend UI), (6) browse page with feeds, (7) role detail page. Features can be roughly parallelized as backend-first (1, 2, 3, 5 backend) then frontend (4, 5 UI, 6, 7). The browse page (6) depends on search/filter (5) and voting (2).
