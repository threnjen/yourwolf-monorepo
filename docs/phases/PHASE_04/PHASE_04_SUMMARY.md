# Phase 4: Authentication & Users

**Status**: Planned
**Depends on**: Phase 03 (Role Builder MVP)
**Estimated complexity**: Medium
**Cross-references**: None

## Objective

Add user authentication via AWS Cognito, user profiles, and a role ownership model so that users can own, manage, and persist their custom roles across sessions.

## Scope

### In Scope
- AWS Cognito integration (email/password sign-up and sign-in)
- Anonymous session support (no account required to play games or browse roles)
- JWT validation middleware for FastAPI
- User model with profile fields (display_name, bio, avatar_url)
- Role ownership: `creator_id` foreign key, permission checks on update/delete
- User API: profile CRUD, "My Roles" listing, account deletion (soft delete)
- Frontend auth context with session persistence
- Login, sign-up, and email verification pages
- Profile settings page
- Protected route wrappers for auth-required pages
- Update existing role endpoints with optional/required auth

### Out of Scope
- Social logins (Google, GitHub, etc.) — deferred to Phase 08
- Admin roles or role-based access control beyond ownership
- Password reset UI (Cognito handles this via hosted UI initially)
- Role sharing or publishing (Phase 05)
- Multi-factor authentication

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Cognito Backend Integration | JWT verification, JWKS caching, token validation middleware | Auth module |
| 2 | Auth Dependencies | `get_current_user_optional` and `get_current_user_required` FastAPI dependencies | Middleware |
| 3 | User Model & Migration | User table with cognito_sub, email, display_name, profile fields | Model, migration |
| 4 | User API | Profile GET/PATCH, "My Roles" listing, logout recording, account deletion | Router, service, schemas |
| 5 | Role Auth Integration | Add optional/required auth to role CRUD endpoints, ownership checks | Router updates |
| 6 | Frontend Auth Context | AuthProvider with Cognito SDK, session persistence, token refresh | Context, hooks |
| 7 | Auth Pages | Login, sign-up, email verification, forgot password | Frontend pages |
| 8 | Profile Page | User settings, display name, bio, "My Roles" grid | Frontend page |

## Technical Context

- Existing role router: `app/routers/roles.py` — currently has no auth; needs `creator_id` and ownership checks added
- Existing role model: `app/models/role.py` — has `creator_id` column from Phase 03 but no foreign key to users
- Frontend routing: `src/routes.tsx` — needs protected route wrappers
- Frontend API client: `src/api/roles.ts` — needs auth token injection via axios interceptor
- AWS Cognito SDK: `amazon-cognito-identity-js` (frontend), `python-jose` or `PyJWT` + `PyJWKClient` (backend)
- All game facilitation features (Phase 02) remain accessible without auth

## Dependencies & Risks

- **Dependency**: AWS Cognito user pool must be created and configured (can use free tier)
- **Dependency**: Environment variables for Cognito Pool ID / Client ID needed in both backend and frontend
- **Risk**: Cognito SDK complexity — the `amazon-cognito-identity-js` library has verbose patterns; consider wrapping in a clean service layer
- **Risk**: Token refresh handling — access tokens expire after 1 hour; need silent refresh via refresh token
- **Mitigation**: Test with Cognito local emulator or a dedicated dev user pool

## Success Criteria

- [ ] User signs up with email/password and receives verification email
- [ ] User logs in and receives JWT; backend validates it
- [ ] Authenticated user creates a role and it is linked to their account
- [ ] Unauthenticated user can still browse roles and play games
- [ ] Role update/delete returns 403 for non-owners
- [ ] User can view and update their profile
- [ ] "My Roles" page shows all roles created by the current user
- [ ] Token refresh works silently (no re-login required within session)
- [ ] Soft-delete account works and preserves published roles

## QA Considerations

- Auth flow (signup → verify → login → session persistence → logout) requires manual QA
- Protected vs. unprotected routes need verification
- Anonymous user experience must remain fully functional
- Token expiry and refresh behavior should be tested with time manipulation

## Notes for Feature - Decomposer

Suggested decomposition: (1) Cognito backend integration + auth dependencies, (2) User model + migration + API, (3) role endpoint auth integration, (4) frontend auth context + SDK wrapper, (5) auth pages (login/signup/verify), (6) profile page + "My Roles". Features 1-3 are backend-only; 4-6 are frontend-only after the backend is ready. The auth context (feature 4) is a prerequisite for all other frontend features.
