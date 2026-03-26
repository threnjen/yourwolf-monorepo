# Context: Finish Phase 2 — Game Facilitation (Backend)

## Key Files

| File | Role |
|------|------|
| `tests/test_games_router.py` | Router integration tests; class-based, uses `client: TestClient` and `seeded_roles: list[Role]` fixtures |
| `tests/conftest.py` | Fixtures: `client`, `db_session`, `seeded_roles`, `seeded_roles_with_deps` |
| `app/routers/games.py` | Game endpoints; phase transition validation lives in `GameService.start_game` and `GameService.advance_phase` |
| `app/services/game_service.py` | `start_game` raises `HTTPException(400)` if game is not in `SETUP` phase; `advance_phase` raises `HTTPException(400)` if game is already `COMPLETE` |
| `docs/phases/PHASE_2/PHASE_2_QA.md` (yourwolf-docs) | QA spec section 3.2 step 2 and section 3.4 step 2 define the required error responses |

## Patterns to Follow

- Tests live inside the existing `TestStartGameEndpoint` and `TestAdvancePhaseEndpoint` classes — no new classes needed
- Setup pattern: POST `/api/games` to create, then POST `/api/games/{id}/start` to advance to night before testing the second start attempt
- For the complete-phase advance test: create → start → advance four times (night→discussion→voting→resolution→complete), then attempt a fifth advance
- Assert `response.status_code == 400` — do not assert specific error message text (implementation detail)

## Decisions

- These are pure test additions — no production code changes are needed
- `seeded_roles` fixture (8 roles) is sufficient for both tests; `seeded_roles_with_deps` is not needed
