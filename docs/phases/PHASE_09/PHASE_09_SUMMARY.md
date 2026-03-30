# Phase 9: Mobile App

**Status**: Planned
**Depends on**: Phase 08 (AWS Deployment)
**Estimated complexity**: Large
**Cross-references**: None

## Objective

Build a cross-platform React Native mobile app (iOS and Android) that shares ~70% of code with the web frontend, with offline role storage, push notifications, and app store deployment.

## Scope

### In Scope
- React Native project setup with TypeScript, shared code from web frontend
- Shared module strategy: types, API client, custom hooks, and utility functions symlinked or packaged from web
- Metro bundler configuration for resolving shared code
- Native navigation: stack navigator (game flow) + bottom tab navigator (main sections)
- Screens: Home, Game, Role Builder, Browse, Profile, Settings, Login
- Mobile-specific components: NightPhaseOverlay (animated), role cards, vote buttons
- Offline role storage via AsyncStorage (saved roles, game templates, user preferences)
- Push notifications via Firebase Cloud Messaging (game invites, role updates)
- Native audio service for game sound effects (react-native-sound)
- Platform-specific styling with `react-native-reanimated` for animations
- iOS and Android builds and app store submissions

### Out of Scope
- Feature parity beyond core features (advanced analytics dashboard, admin tools stay web-only)
- Offline game history sync (games require server connectivity)
- In-app purchases or subscriptions
- Tablet-specific layouts
- Watch/wearable companion apps
- Deep linking from web to mobile

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | Project Setup | React Native project with TypeScript, Metro config for shared code | Scaffolding |
| 2 | Shared Code Integration | Symlink/package shared types, API client, hooks, and utils from web | Build config |
| 3 | Navigation | Stack + tab navigators, auth-gated routing | Navigation module |
| 4 | Core Screens | Home, Game, Role Builder, Browse, Profile, Login | Mobile screens |
| 5 | Offline Storage | AsyncStorage service for roles, templates, and preferences | Storage service |
| 6 | Push Notifications | Firebase Cloud Messaging setup, permission handling, token registration | Notification service |
| 7 | Audio Service | Native audio playback for game narration and sound effects | Audio service |
| 8 | App Store Deployment | iOS App Store and Google Play Store submissions | Build, signing, metadata |

## Technical Context

- Web frontend: `yourwolf-frontend/src/` — shared code candidates: `types/`, `api/`, `hooks/`, `utils/`
- API client: `src/api/client.ts` — uses axios; needs platform-aware base URL and token injection
- Custom hooks: `src/hooks/useRoles.ts`, `src/hooks/useGame.ts` — shared game logic
- Mobile project: `yourwolf-mobile/` (new directory at monorepo root)
- Metro bundler needs `watchFolders` config to resolve shared modules outside the mobile directory
- React Navigation: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
- Drag-and-drop (wake order review): may need `react-native-gesture-handler` equivalent of web's `@dnd-kit`
- Backend: no changes needed — mobile consumes the same REST API as web

## Dependencies & Risks

- **Dependency**: Phase 08 must be complete — mobile app needs a deployed backend URL (not localhost)
- **Dependency**: Apple Developer account ($99/year) and Google Play Developer account ($25 one-time) for store submissions
- **Dependency**: Firebase project for push notifications
- **Risk**: Shared code compatibility — some web code may use browser-specific APIs (localStorage, window, DOM); need careful abstraction at the boundary
- **Risk**: React Native version compatibility with native modules (react-native-sound, react-native-reanimated) — pin versions and test early
- **Risk**: App store review process can take days and may require revisions; plan for multiple submission cycles
- **Mitigation**: Set up Expo or EAS Build early for streamlined build/deploy; use TestFlight and Google Play internal testing tracks

## Success Criteria

- [ ] React Native app builds and runs on iOS simulator and Android emulator
- [ ] Shared code (types, hooks, API client) works without duplication
- [ ] User can browse roles, create a game, and run a game session from mobile
- [ ] Roles can be saved offline and viewed without connectivity
- [ ] Push notifications are received for registered events
- [ ] Audio narration plays during night phase
- [ ] App submitted and accepted to both iOS App Store and Google Play Store

## QA Considerations

- All mobile screens require manual QA on both iOS and Android devices (not just simulators)
- Gesture interactions (drag-to-reorder, swipe) need device testing
- Offline mode: save roles while online, toggle airplane mode, verify access
- Push notification permission flows differ by platform — test both grant and deny paths
- Audio playback during night phase should be tested with device audio states (silent mode, headphones, speaker)
- QA manual test documents are required for this phase

## Notes for Feature - Decomposer

Suggested decomposition: (1) project setup + Metro config + shared code integration, (2) navigation structure + auth flow, (3) core screens (can be parallelized: home, browse, profile/login as one feature; game setup + game screen as another; role builder as a third), (4) offline storage service, (5) push notification service, (6) audio service, (7) app store build and submission. Feature 1 is the foundation — everything depends on it. Features 4-6 are independent services that can be built in parallel. Feature 3 is the bulk of the work and benefits from further decomposition.
