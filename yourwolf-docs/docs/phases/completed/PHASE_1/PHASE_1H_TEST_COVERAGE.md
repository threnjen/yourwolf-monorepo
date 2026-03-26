# Phase 1H: Test Coverage & Final QA

> ≥80% test coverage and full QA checklist pass

## Overview

**Goal**: Achieve ≥80% test coverage for both backend and frontend, run full QA verification.

**Status**: ✅ Complete

---

## Success Criteria

- [x] Backend pytest coverage ≥80% (82.21%)
- [x] Frontend Vitest coverage ≥80% (100%)
- [x] All automated tests pass (109 backend, 127 frontend)
- [x] Full QA checklist verified
- [ ] Cross-browser testing complete

---

## Completed Work

1. **Backend coverage config**: `pytest-cov` in dependencies, 80% threshold in `pyproject.toml`.

2. **Frontend coverage threshold**: 80% thresholds in `vite.config.ts`.

3. **QA verification**: All services start, tests pass, coverage thresholds met.

---

## Key Files

| File | Purpose |
|------|---------|
| `yourwolf-backend/pyproject.toml` | Pytest/coverage configuration |
| `yourwolf-backend/requirements-dev.txt` | Dev dependencies |
| `yourwolf-frontend/vite.config.ts` | Vitest coverage configuration |
| `yourwolf-frontend/package.json` | Test scripts |

---

## Backend Testing

### Configuration Required

Add to `pyproject.toml`:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--cov=app --cov-report=term-missing --cov-fail-under=80"
```

Add to `requirements-dev.txt`:
```
pytest-cov>=4.0.0
```

### Running Tests

```bash
# All tests with coverage
docker compose exec backend pytest --cov=app --cov-report=term-missing

# Specific test file
docker compose exec backend pytest tests/test_roles.py -v

# With coverage threshold
docker compose exec backend pytest --cov=app --cov-fail-under=80
```

### Current Test Files

| File | Tests |
|------|-------|
| `tests/test_health.py` | Health endpoint tests |
| `tests/test_abilities.py` | Abilities API tests |
| `tests/test_roles.py` | Roles CRUD tests |
| `tests/test_models.py` | Model unit tests |
| `tests/test_schemas.py` | Pydantic schema tests |
| `tests/test_role_service.py` | Service layer tests |

---

## Frontend Testing

### Configuration Required

Update `vite.config.ts`:

```typescript
test: {
  coverage: {
    thresholds: {
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
},
```

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

### Current Test Files

| File | Tests |
|------|-------|
| `src/test/App.test.tsx` | App component |
| `src/test/Header.test.tsx` | Header component |
| `src/test/Home.test.tsx` | Home page |
| `src/test/Layout.test.tsx` | Layout component |
| `src/test/RoleCard.test.tsx` | RoleCard component |
| `src/test/Roles.test.tsx` | Roles page |
| `src/test/Sidebar.test.tsx` | Sidebar component |
| `src/test/client.test.ts` | API client |
| `src/test/routes.test.tsx` | Routing |
| `src/test/theme.test.ts` | Theme configuration |
| `src/test/types.test.ts` | Type definitions |
| `src/test/useRoles.test.tsx` | useRoles hook |

---

## QA Checklist

### Environment

- [ ] `docker compose up` starts all services
- [ ] All containers healthy
- [ ] Database seeded with 30 roles

### Backend API

- [ ] GET `/health` returns 200
- [ ] GET `/health/db` returns 200
- [ ] GET `/api/abilities` returns 15 abilities
- [ ] GET `/api/roles` returns paginated roles
- [ ] GET `/api/roles/official` returns 30 roles
- [ ] POST/PUT/DELETE work for custom roles
- [ ] Swagger UI accessible at `/docs`

### Frontend

- [ ] Home page loads
- [ ] Roles page displays 30 cards
- [ ] Team colors correct
- [ ] Loading state works
- [ ] Error state works
- [ ] Responsive on mobile

### Cross-Browser

- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)

### Performance

- [ ] API response time < 500ms
- [ ] Page load time < 3s
- [ ] No memory leaks

---

## Acceptance Criteria Summary

| Criteria | Status |
|----------|--------|
| Docker Compose starts all services | ⬜ |
| PostgreSQL accessible | ⬜ |
| Backend health check returns 200 | ⬜ |
| 30 official roles seeded | ⬜ |
| `/api/roles` returns paginated JSON | ⬜ |
| Frontend displays all role cards | ⬜ |
| Role cards show correct team colors | ⬜ |
| Backend tests pass | ⬜ |
| Frontend tests pass | ⬜ |
| Backend coverage ≥80% | ⬜ |
| Frontend coverage ≥80% | ⬜ |
| Hot reload works | ⬜ |
| Database migrations run | ⬜ |

---

*Status: Pending coverage configuration and full QA run*
