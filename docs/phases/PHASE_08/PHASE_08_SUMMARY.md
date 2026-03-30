# Phase 8: Mobile App (Tauri v2)

**Status**: Planned
**Depends on**: Phase 07 (Narration Engine)
**Estimated complexity**: Large
**Cross-references**: Phase 06 Tauri desktop project (`yourwolf-frontend/src-tauri/`)

## Objective

Extend the existing Tauri v2 desktop app to produce native iOS and Android builds, with touch-optimized UI and responsive layouts, while retaining full offline functionality including narration.

## Scope

### In Scope
- Tauri v2 mobile build targets: iOS (via Xcode) and Android (via Android Studio/Gradle)
- Responsive UI: adapt existing pages and components for mobile screen sizes (phone-first, tablet-friendly)
- Touch interactions: replace or adapt drag-and-drop (wake order review) for touch gestures
- Mobile SQLite: verify Tauri SQL plugin works on mobile platforms (same local data layer as desktop)
- Mobile narration: verify/adapt the TTS solution from Phase 07 for iOS and Android
  - iOS: `AVSpeechSynthesizer` (OS-native) or bundled model
  - Android: `TextToSpeech` API (OS-native) or bundled model
- App icons, splash screens, and mobile-specific branding
- iOS build: `.ipa` for TestFlight distribution
- Android build: `.apk` / `.aab` for Google Play internal testing
- CI workflow: GitHub Actions builds for iOS and Android on release
- Performance optimization: startup time, memory usage, scroll performance on mobile

### Out of Scope
- App Store / Play Store public release (Phase 13 — Production Deployment)
- Push notifications (Phase 10 — Community Features, if needed)
- Cloud connectivity (Phase 09 — this phase is still offline-only)
- Tablet-specific layouts (responsive design covers tablets adequately)
- Smartwatch or wearable companion
- Deep linking from web
- Offline-to-online sync (Phase 09)

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | iOS Build Target | Tauri v2 iOS configuration, Xcode project generation, `.ipa` build | Build configuration |
| 2 | Android Build Target | Tauri v2 Android configuration, Gradle setup, `.apk`/`.aab` build | Build configuration |
| 3 | Responsive UI Overhaul | Adapt all pages for mobile screen sizes: game setup, facilitator, role builder, roles list | Frontend CSS/layout |
| 4 | Touch Interaction Adaptation | Adapt drag-and-drop wake order review and any hover-dependent interactions for touch | Frontend components |
| 5 | Mobile TTS Verification | Verify Phase 07 narration works on iOS and Android; adapt if platform-specific changes needed | TTS adapter |
| 6 | Mobile App Assets | App icons (all sizes), splash screens, mobile metadata | Assets |
| 7 | Mobile CI Pipeline | GitHub Actions: build iOS (.ipa) and Android (.apk/.aab) on release | CI config |
| 8 | Performance Optimization | Startup time, scroll performance, memory usage targets for mobile devices | Optimization |

## Technical Context

- Existing Tauri project: `yourwolf-frontend/src-tauri/` (from Phase 06) — mobile targets are added to the same Tauri project
- Tauri v2 mobile uses native system WebViews: WKWebView (iOS) and Android WebView
- Frontend pages to adapt: `src/pages/GameSetup.tsx`, `src/pages/GameFacilitator.tsx`, `src/pages/RoleBuilder.tsx`, `src/pages/WakeOrderResolution.tsx`, `src/pages/Roles.tsx`, `src/pages/Home.tsx`
- Drag-and-drop: currently uses `@dnd-kit/core` and `@dnd-kit/sortable` — these support touch events but may need gesture tuning for mobile
- SQLite via Tauri SQL plugin: should work identically on mobile — verify with the same seed data and custom role tests
- TTS (Phase 07): platform detection may need to route to iOS/Android native TTS APIs if the desktop solution doesn't carry over directly
- Responsive breakpoints: the existing frontend does not have mobile breakpoints — this phase adds them
- Testing devices: iOS Simulator (Xcode), Android Emulator (Android Studio), and physical devices for final verification

## Dependencies & Risks

- **Dependency**: Phase 07 narration must work — mobile builds include narration; if TTS approach doesn't work on mobile, adaptation is needed
- **Dependency**: Phase 06 Tauri desktop project must be complete and stable
- **Dependency**: Apple Developer account ($99/year) for iOS builds and TestFlight
- **Dependency**: Android SDK and NDK for Android builds
- **Risk**: Tauri v2 mobile support is newer than desktop — potential edge cases with WebView behavior, plugin compatibility, or build tooling
- **Risk**: Drag-and-drop libraries may behave differently on mobile WebViews — may need a touch-specific implementation for wake order reordering
- **Risk**: Mobile performance — React rendering in a WebView is slower than native; mitigate by profiling early and optimizing render cycles
- **Risk**: TTS behavior differences on iOS vs. Android — OS-native TTS APIs have different voices, capabilities, and latency characteristics
- **Mitigation**: Start with Android (more forgiving build environment), then iOS — iOS has stricter signing requirements

## Success Criteria

- [ ] Tauri builds produce installable iOS and Android apps
- [ ] All core features work on mobile: browse roles, create custom roles, run games, facilitator view
- [ ] Wake order drag-to-reorder works via touch gestures
- [ ] Role Builder wizard is usable on phone-sized screens
- [ ] Narration plays during night phase on both iOS and Android
- [ ] Local SQLite data persists across app restarts on mobile
- [ ] First launch seeds 30 official roles on mobile
- [ ] App startup time is under 3 seconds on mid-range devices
- [ ] CI produces iOS (.ipa) and Android (.apk/.aab) builds on release

## QA Considerations

- Full game flow must be manually tested on both iOS and Android (physical devices preferred)
- Touch interactions: drag-and-drop, scrolling, form inputs — all need manual testing
- Screen sizes: test on small phone (iPhone SE / small Android), standard phone, and tablet
- Narration playback: verify voice quality, pacing, and controls on mobile
- Offline behavior: airplane mode → full game flow works
- Test app update path: install v1 → update to v2 → verify data preserved

## Notes for Feature - Decomposer

Decomposition: iOS build target → Android build target → responsive UI overhaul → touch interaction adaptation → mobile TTS verification → mobile assets → CI pipeline → performance optimization. The responsive UI overhaul is the largest feature — consider splitting by page (game setup, facilitator, role builder, etc.). Touch interaction adaptation for the wake order page may require replacing `@dnd-kit` with a mobile-friendly alternative. Performance optimization should be done last after all features work correctly.
- [ ] HTTPS works with valid SSL certificate on custom domain
- [ ] Push to `main` triggers GitHub Actions deploy and succeeds end-to-end
- [ ] Cognito login works in production
- [ ] CloudWatch alarms fire on simulated high CPU/memory/5xx conditions
- [ ] SNS delivers alert email on alarm

## QA Considerations

- Full end-to-end testing required in production: signup → login → create role → create game → play
- SSL certificate validation and HTTPS redirect
- CloudFront cache invalidation after frontend deploys
- Database backup and restore should be tested at least once
- No frontend-specific QA doc needed; this is pure infrastructure — but all prior QA scenarios should be re-validated in production

## Notes for Feature - Decomposer

Suggested decomposition by infrastructure layer: (1) Terraform foundation (VPC, IAM, S3 backend for state), (2) database (RDS, Secrets Manager, security group), (3) compute (ECR, ECS cluster, task definition, service, ALB), (4) frontend hosting (S3, CloudFront, OAC), (5) networking and DNS (ACM certificate, Route 53, HTTPS listener), (6) auth (Cognito production pool), (7) CI/CD pipeline (GitHub Actions), (8) monitoring (CloudWatch, SNS). Provision in this order due to dependencies. Features 1 and 2 can be done first, then 3-6 in parallel to some extent, then 7-8 last.
