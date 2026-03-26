# Tasks: Finish Phase 2 — Game Facilitation (Backend)

## Stage 1: Add Edge-Case Router Tests

- [x] In `TestStartGameEndpoint`: write a failing test — create a game, start it (→ night), then attempt to start it again; assert 400
- [x] In `TestAdvancePhaseEndpoint`: write a failing test — create, start, and advance through all phases to `complete`, then attempt one more advance; assert 400
- [x] Confirm both new tests pass; confirm no regressions in existing tests (`pytest tests/`)
- [ ] Commit: `test(backend): add invalid phase transition router tests`

## Sign-off

- [x] All tests pass (`pytest tests/`)
- [x] Confirm frontend `finish-phase-2` tasks are also complete
- [ ] Remove `dev/active/finish-phase-2/` from both repos once all tasks done
