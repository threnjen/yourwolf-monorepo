# Test Audit — Context & Inventory

> **Date:** 2026-03-27
> **Scope:** Full monorepo — yourwolf-backend (10 test files) + yourwolf-frontend (30 test files)
> **Motivation:** Reduce maintenance burden by removing low-value tests.

---

## Current Test Inventory

### Backend Test Files

| File | Test Count (approx) | Category |
|------|---------------------|----------|
| `tests/conftest.py` | N/A (fixtures only) | Infrastructure |
| `tests/test_health.py` | 7 | Health/smoke |
| `tests/test_models.py` | 20 | ORM models + enums |
| `tests/test_schemas.py` | 28 | Pydantic validation |
| `tests/test_roles.py` | 33 | Roles API (router) |
| `tests/test_abilities.py` | 8 | Abilities API (router) |
| `tests/test_role_service.py` | 34 | Role service layer |
| `tests/test_role_validation.py` | 25 | Role validation (AC1–AC12) |
| `tests/test_game_service.py` | 21 | Game service layer |
| `tests/test_games_router.py` | 22 | Games API (router) |
| `tests/test_script_service.py` | 10 | Night script generation |
| **Backend Total** | **~208** | |

### Frontend Test Files

| File | Test Count (approx) | Category |
|------|---------------------|----------|
| `test/setup.ts` | N/A (config) | Infrastructure |
| `test/mocks.ts` | N/A (factories) | Infrastructure |
| `test/App.test.tsx` | 2 | App shell |
| `test/Home.test.tsx` | 10 | Home page |
| `test/routes.test.tsx` | 3 | Routing |
| `test/theme.test.ts` | 20 | Theme constants |
| `test/types.test.ts` | 10 | TypeScript interfaces |
| `test/client.test.ts` | 5 | Axios client |
| `test/roles.api.test.ts` | 15 | Roles API module |
| `test/abilities.api.test.ts` | 3 | Abilities API module |
| `test/games.api.test.ts` | 7 | Games API module |
| `test/useFetch.test.ts` | 6 | useFetch hook |
| `test/useRoles.test.ts` | 12 | useRoles hook |
| `test/useAbilities.test.ts` | 5 | useAbilities hook |
| `test/useGame.test.ts` | 8 | useGame + useNightScript hooks |
| `test/useDrafts.test.ts` | 11 | useDrafts hook (localStorage) |
| `test/Header.test.tsx` | 4 | Header component |
| `test/Layout.test.tsx` | 6 | Layout component |
| `test/Sidebar.test.tsx` | 5 | Sidebar component |
| `test/Roles.test.tsx` | 8 | Roles page |
| `test/RoleCard.test.tsx` | 17 | RoleCard component |
| `test/RoleBuilder.test.tsx` | 6 | RoleBuilder page |
| `test/BasicInfoStep.test.tsx` | 14 | Basic info wizard step |
| `test/AbilitiesStep.test.tsx` | 12 | Abilities wizard step |
| `test/WinConditionsStep.test.tsx` | 6 | Win conditions wizard step |
| `test/ReviewStep.test.tsx` | 9 | Review wizard step |
| `test/Wizard.test.tsx` | 12 | Wizard navigation |
| `test/GameSetup.test.tsx` | 18 | Game setup page |
| `test/GameFacilitator.test.tsx` | 14 | Game facilitator page |
| `test/ScriptReader.test.tsx` | 9 | Script reader component |
| `test/Timer.test.tsx` | 7 | Timer component |
| `test/ErrorBanner.test.tsx` | 5 | Error banner component |
| **Frontend Total** | **~254** | |

### **Grand Total: ~462 tests**

---

## Key Decisions

### 1. Router vs. Service Layer (Backend)

**Decision:** For roles, keep router tests as primary (they're true integration tests using real SQLite). Remove redundant service-layer CRUD tests. Keep unique service tests (step replacement, edge cases).

**Rationale:** The router tests in `test_roles.py` use `TestClient` → real router → real service → real SQLite. They exercise the same code paths as the service tests but also verify HTTP status codes, serialization, and middleware. The service-only tests are a strict subset of coverage.

For games, the inverse: keep service tests as primary (they're more thorough with 8 start tests vs. 3 in router). Remove redundant thin router wrappers. Keep router tests that verify unique HTTP behavior (E2E lifecycle, dependency validation, script endpoint).

### 2. Schema Tests (Backend)

**Decision:** Keep boundary/validation tests (min_length, max_length, range constraints, card count relationships). Remove "can I construct this?" tests and "from_dict" tests.

**Rationale:** Pydantic guarantees construction works if the schema is defined. The value is in testing the *constraints* (min_length, max vs. min), not the basic construction.

### 3. Frontend Static Value Tests

**Decision:** Delete `theme.test.ts` and `types.test.ts` entirely.

**Rationale:** `theme.test.ts` asserts ~20 hex color strings are exactly what they are — if someone changes a color, they mean to, and this test adds friction without catching bugs. `types.test.ts` tests TypeScript interfaces at runtime, but the compiler already enforces these at build time.

### 4. Frontend Implementation Detail Tests

**Decision:** Remove tests that assert CSS class names, DOM element types (div vs. span), inline hover styles, heading levels, and emoji content.

**Rationale:** These break when implementation changes but the behavior doesn't. They create maintenance burden without protecting against real regressions.

### 5. Axios Client Tests

**Decision:** Delete `client.test.ts`.

**Rationale:** Every test mocks `axios.create` and then asserts the mock was called with certain args. The actual API module tests (`roles.api.test.ts`, etc.) already verify the client works by testing the public API surface.

---

## Test Framework & Infrastructure Notes

### Backend
- **Framework:** pytest
- **DB:** In-memory SQLite via `conftest.py` (per-function scoping with create/drop)
- **Client:** FastAPI `TestClient` with dependency override for DB session
- **Fixtures:** Rich fixture set in `conftest.py` including `seeded_roles`, `seeded_roles_with_deps`, `sample_role_with_steps`

### Frontend
- **Framework:** Vitest + @testing-library/react
- **Mocking:** `vi.mock()` for API modules and hooks
- **Mock factories:** `mocks.ts` with `createMockRole()`, `createMockGameSession()`, etc.
- **Setup:** `setup.ts` mocks axios globally
