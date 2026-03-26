# Plan: Finish Phase 2 — Game Facilitation (Backend)

> **Goal**: Close two missing edge-case router tests so the backend fully validates the QA spec for invalid phase transitions.
>
> **Prerequisites**: Phase 2 backend fully implemented. All existing backend tests passing.
>
> **Cross-reference**: `yourwolf-frontend/dev/active/finish-phase-2/` (3 frontend gap fixes)

---

## Stage 1: Add Edge-Case Router Tests for Invalid Phase Transitions

**Goal**: Add two tests to `tests/test_games_router.py` covering rejection of invalid phase transitions that are required by the QA spec but currently untested.

**Success Criteria**:
- `TestStartGameEndpoint` gains a test: starting an already-started game (phase=`night`) returns 400
- `TestAdvancePhaseEndpoint` gains a test: advancing a game that is already in phase=`complete` returns 400
- Both tests follow the existing class-based pattern in `test_games_router.py` — no new fixtures needed
- All existing tests continue to pass

**Status**: Not Started
