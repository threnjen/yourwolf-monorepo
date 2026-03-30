# Phase 9: Authentication & Users

**Status**: Planned
**Depends on**: Phase 08 (Mobile App — Tauri v2)
**Estimated complexity**: Medium
**Cross-references**: Existing Python backend `yourwolf-backend/app/models/user.py`, existing auth model stubs

## Objective

Add user authentication via AWS Cognito, user profiles, and role ownership so that users can log in, own their custom roles in the cloud, and sync locally-created roles to their account. Unauthenticated users retain full offline functionality.

## Scope

### In Scope
- AWS Cognito integration (email/password sign-up and sign-in)
- Anonymous/offline mode: all game features work without an account (as they do after Phase 08)
- JWT validation middleware for FastAPI backend
- User model with profile fields (display_name, bio, avatar_url)
- Role ownership: `creator_id` foreign key, permission checks on update/delete
- User API: profile CRUD, "My Roles" listing, account deletion (soft delete)
- Frontend auth context with session persistence
- Login, sign-up, and email verification pages
- Profile settings page
- Protected route wrappers for auth-required pages (publishing, voting — future phases)
- Local-to-cloud role sync: roles created offline are uploaded to the user's cloud account on login
- Conflict resolution: server wins for published roles, local wins for drafts
- Connectivity-aware behavior: detect online/offline state; show cloud features only when connected and logged in
- Update the repository layer (Phase 05) to support dual-source data: local SQLite + remote API

### Out of Scope
- Social logins (Google, GitHub, etc.) — defer to Phase 13
- Admin roles or role-based access control beyond ownership
- Community features (publishing, voting, discovery — Phase 10)
- Multi-factor authentication
- Cloud game history sync (games remain local-only for now)

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Cognito Backend Integration | JWT verification, JWKS caching, token validation middleware | Auth module |
| 2 | Auth Dependencies | `get_current_user_optional` and `get_current_user_required` FastAPI dependencies | Middleware |
| 3 | User Model & Migration | User table with cognito_sub, email, display_name, profile fields | Model, migration |
| 4 | User API | Profile GET/PATCH, "My Roles" listing, account deletion | Router, service, schemas |
| 5 | Role Auth Integration | Add optional/required auth to role CRUD endpoints, ownership checks | Router updates |
| 6 | Frontend Auth Context | AuthProvider, session persistence, token refresh, connectivity detection | Context, hooks |
| 7 | Auth Pages | Login, sign-up, email verification | Frontend pages |
| 8 | Local-to-Cloud Sync | Upload local roles to cloud on login; merge cloud roles into local DB | Sync service |
| 9 | Repository Layer Update | Dual-source data access: local SQLite (offline) + API (online + logged in) | Repository adapter |

## Technical Context

- Existing role model: `app/models/role.py` — has `creator_id` column and `visibility` enum from Phase 01
- Existing user model: `app/models/user.py` — stub exists; needs Cognito fields
- Existing role router: `app/routers/roles.py` — currently no auth; needs ownership checks
- Frontend repository layer (Phase 05): `SqliteRepository` handles local data; needs an `ApiRepository` counterpart and a `SyncingRepository` that coordinates both
- Frontend API client: `src/api/client.ts` — needs auth token injection via interceptor
- AWS Cognito SDK: `amazon-cognito-identity-js` or AWS Amplify Auth (frontend), `PyJWT` + `PyJWKClient` (backend)
- Tauri context: auth tokens stored in system keychain via Tauri secure storage plugin
- The Python backend (`yourwolf-backend/`) becomes the live cloud API from this phase forward — Docker Compose for local dev, eventually deployed in Phase 13

## Dependencies & Risks

- **Dependency**: AWS Cognito user pool must be provisioned (free tier is sufficient)
- **Dependency**: The Python backend must be running and accessible for cloud features — Docker Compose for local dev
- **Risk**: Sync conflicts — a role created offline may conflict with cloud data; mitigate with clear rules (server wins for published, local wins for drafts)
- **Risk**: Token refresh in Tauri — Cognito access tokens expire after 1 hour; need silent refresh; Tauri secure storage for refresh tokens
- **Risk**: Backend hasn't been touched since Phase 3.6 — may need dependency updates and migration verification
- **Mitigation**: Test sync scenarios thoroughly: create offline → log in → verify upload; create online → go offline → verify local cache

## Success Criteria

- [ ] User signs up with email/password and receives verification email
- [ ] User logs in and receives JWT; backend validates it
- [ ] Roles created offline are uploaded to the cloud on first login
- [ ] Cloud roles are downloaded and stored locally for offline access
- [ ] App works fully offline when not logged in (identical to Phase 08)
- [ ] Role update/delete returns 403 for non-owners
- [ ] Connectivity changes are detected: cloud UI elements appear/disappear based on online status
- [ ] Token refresh works silently within the Tauri app
- [ ] Profile page shows user info and "My Roles" listing

## QA Considerations

- Auth flow (signup → verify → login → sync → logout) requires manual QA on desktop and mobile
- Sync scenario testing: offline roles → login → verify cloud; cloud roles → go offline → verify local
- Connectivity transitions: online → offline → online must be seamless
- Anonymous user experience must remain fully functional (no degradation from adding auth)

## Notes for Feature - Decomposer

Decomposition: Cognito backend integration → user model → auth dependencies → user API → role auth integration → frontend auth context → auth pages → repository layer update → local-to-cloud sync. The sync service is the most complex feature and should be implemented last, after both the local and cloud data paths work independently. The repository layer update is a prerequisite for sync.

- All mobile screens require manual QA on both iOS and Android devices (not just simulators)
- Gesture interactions (drag-to-reorder, swipe) need device testing
- Offline mode: save roles while online, toggle airplane mode, verify access
- Push notification permission flows differ by platform — test both grant and deny paths
- Audio playback during night phase should be tested with device audio states (silent mode, headphones, speaker)
- QA manual test documents are required for this phase

## Notes for Feature - Decomposer

Suggested decomposition: (1) project setup + Metro config + shared code integration, (2) navigation structure + auth flow, (3) core screens (can be parallelized: home, browse, profile/login as one feature; game setup + game screen as another; role builder as a third), (4) offline storage service, (5) push notification service, (6) audio service, (7) app store build and submission. Feature 1 is the foundation — everything depends on it. Features 4-6 are independent services that can be built in parallel. Feature 3 is the bulk of the work and benefits from further decomposition.
