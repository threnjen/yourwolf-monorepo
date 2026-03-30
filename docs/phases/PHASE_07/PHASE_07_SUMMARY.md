# Phase 7: Narration Engine

**Status**: Planned
**Depends on**: Phase 06 (Desktop App — Tauri v2)
**Estimated complexity**: Medium–Large
**Cross-references**: Phase 04 game engine (`src/engine/`), Phase 06 Tauri shell

## Objective

Add text-to-speech narration to the night phase so the app reads the facilitator script aloud, eliminating the need for a human narrator. The narration must work fully offline with no cloud services. This is a **research-heavy phase** — the specific TTS technology will be evaluated and selected during refinement.

## Scope

### In Scope
- Research and evaluate offline TTS options for Tauri v2 desktop (macOS + Windows):
  - OS-native TTS APIs (macOS `AVSpeechSynthesizer`, Windows SAPI / `SpeechSynthesis`)
  - Bundled local TTS models (e.g., Piper TTS, Coqui TTS, Sherpa ONNX)
  - Hybrid approach (OS-native as fallback, bundled model as default)
- TTS integration: generate audio from `NarratorAction[]` instruction strings
- Narration playback during night phase: plays each action's instruction with appropriate pauses between actions
- Pacing controls: global speed setting (slow/normal/fast), per-action pause duration
- Voice selection: at minimum, one clear voice per platform; ideally user-selectable from available voices
- Narration toggle: user can enable/disable narration (silent mode = read-from-screen, as currently works)
- Audio control UI: play/pause, skip to next action, volume control
- Pre-generation: generate all audio for a night script before night phase begins (avoid mid-game latency)
- Integration with the existing `ScriptReader.tsx` component and `Timer.tsx`

### Out of Scope
- Cloud-based TTS (AWS Polly, Google TTS, etc.) — this phase is offline-only
- Custom voice training or cloning
- Background music or sound effects
- Mobile narration (Phase 08 — Mobile App handles platform-specific audio)
- Narration for non-night phases (discussion timer announcements, voting prompts)
- Recording or exporting narration audio

## Key Deliverables

| # | Deliverable | Description | Likely Features |
|---|-------------|-------------|-----------------|
| 1 | TTS Technology Evaluation | Research document comparing offline TTS options with recommendation | Planning deliverable |
| 2 | TTS Service Interface | TypeScript interface for TTS: `speak(text, options)`, `pregenerate(actions)`, voice listing | Type definitions |
| 3 | TTS Implementation | Concrete implementation using the selected TTS approach | Engine module |
| 4 | Narration Playback Controller | Orchestrates sequential playback of `NarratorAction[]` with pauses and pacing | Engine module |
| 5 | Audio Control UI | Play/pause, skip, volume, speed controls in the facilitator UI | Frontend components |
| 6 | Settings Integration | Narration on/off toggle, voice selection, speed preference persisted to SQLite | Settings UI |

## Technical Context

- Night script output: `NarratorAction[]` from the Phase 04 game engine — each action has `instruction` (text to speak), `duration_seconds`, `role_name`
- Facilitator UI: `src/components/ScriptReader.tsx` — displays the script; narration plays alongside this
- Timer component: `src/components/Timer.tsx` — narration pacing must coordinate with timers
- Tauri provides access to native platform APIs via Rust plugins — OS-native TTS can be accessed through a custom Tauri plugin or existing community plugins
- Bundled model approach: Piper TTS (ONNX-based) produces high-quality speech from small models (~20-80MB); can run via Rust FFI in the Tauri backend
- User preferences (Phase 05): narration settings stored in the local SQLite preferences table
- Audio playback: Web Audio API in the WebView, or Tauri audio plugin for native playback

### TTS Option Overview (for research phase)

| Option | Quality | Size Impact | Offline | Platform | Complexity |
|--------|---------|-------------|---------|----------|------------|
| OS-native TTS | Medium (varies) | None | Yes | Per-platform implementation | Low |
| Piper TTS (bundled ONNX model) | High | +20-80MB per voice | Yes | Cross-platform via Rust | Medium |
| Sherpa ONNX | High | +20-100MB | Yes | Cross-platform via Rust | Medium |
| Hybrid (bundled default + OS fallback) | High | +20-80MB | Yes | Cross-platform | Medium-High |

## Dependencies & Risks

- **Dependency**: Phase 06 Tauri desktop app must be functional — narration runs in the native app context
- **Dependency**: Phase 04 game engine `NarratorAction[]` output must be stable
- **Risk**: TTS quality variance across platforms — OS-native voices differ significantly between macOS (good) and Windows (mediocre); bundled models avoid this but increase app size
- **Risk**: Audio latency — TTS generation must happen before playback starts; pre-generation mitigates this but adds a loading step before night phase
- **Risk**: Tauri plugin ecosystem for TTS may be immature — may need to write a custom Rust plugin
- **Risk**: App size increase if bundling TTS models — 20-80MB per voice is acceptable for desktop; may be an issue for mobile (Phase 08 decision)
- **Mitigation**: Start with OS-native TTS as baseline (zero size cost, works immediately), then evaluate bundled models for quality improvement

## Success Criteria

- [ ] TTS technology evaluation document is written with clear recommendation
- [ ] Night phase narration plays automatically with correct instructions for each role
- [ ] Narration works fully offline on macOS and Windows
- [ ] Pacing controls (slow/normal/fast) adjust narration speed
- [ ] User can enable/disable narration with a toggle
- [ ] Audio controls (play/pause, skip, volume) work during night phase
- [ ] Pre-generation completes before night phase begins (no mid-game stuttering)
- [ ] Narration settings persist across app restarts
- [ ] Silent mode (narration disabled) behaves identically to the current facilitator UI

## QA Considerations

- Manual QA required: listen to narration for all 30 seed roles and verify correct instructions
- Test pacing: slow/normal/fast speeds all produce coherent speech
- Test narration toggle: enable → disable → enable mid-game should work seamlessly
- Test pre-generation: verify no blocking or freezing during generation
- Platform-specific testing: narration quality and behavior on both macOS and Windows

## Notes for Feature - Decomposer

This phase begins with research (TTS evaluation) before implementation. Decomposition: TTS evaluation → TTS service interface → TTS implementation → playback controller → audio control UI → settings integration. The TTS evaluation should be the first feature since it determines the approach for all subsequent features. The playback controller is the most complex feature — it orchestrates timing, pauses, and coordination with the existing script reader.
- Background job execution and failure recovery need testing

## Notes for Feature - Decomposer

Suggested decomposition: (1) statistics models + migrations, (2) stats aggregator service, (3) balance score + recommendation engine, (4) analytics API endpoints, (5) facilitator dashboard page, (6) community stats section, (7) background jobs. Features 1-3 are pure backend with no UI. Feature 4 exposes them via API. Features 5-6 are frontend-only. Feature 7 is infrastructure. The aggregator (2) and engines (3) are the core logic — everything else wraps them.
