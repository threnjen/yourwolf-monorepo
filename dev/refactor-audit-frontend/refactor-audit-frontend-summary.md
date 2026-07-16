# Refactor Audit — yourwolf-frontend — Executive Summary

**Date:** 2026-07-16 · **Scope:** `yourwolf-frontend/src/` · Full report: `refactor-audit-frontend-report.md`

## Overview

- **Files audited:** 26 source files, 33 test files
- **Findings:** 0 Critical / 2 High / 10 Medium / 8 Low
- **Overall:** The frontend is well-layered (pages → hooks → api → client, acyclic, one violation). The dominant structural risk is that **game-rule logic lives inside React hooks/pages**, directly in the path of Phase 04's pure-TypeScript engine (`src/engine/`).

## Architectural Health

| Organization | Dependencies | Decomposition | Coupling | Concerns | Encapsulation |
|---|---|---|---|---|---|
| 4/5 | 4/5 | 3/5 | 3/5 | 2.5/5 | 3.5/5 |

## High-Severity Findings

1. **AbilitiesStep.tsx god component (492 lines)** — palette UI, schema-driven parameter forms, and step-ordering business rules in one file (`src/components/RoleBuilder/steps/AbilitiesStep.tsx`).
2. **[ENGINE] Game rules embedded in the React layer** — role-dependency cascade (`hooks/useGameSetup.ts`), wake-group build/shuffle/flatten (`pages/WakeOrderResolution.tsx`), ability-step renumbering (`AbilitiesStep.tsx`). Phase 04 will duplicate all of this unless extracted to pure modules first.

## Priority Actions

**Before Phase 04 (important):**
1. Create `src/domain/` (engine landing zone): extract `roleSelection.ts`, `wakeOrder.ts`, `abilitySteps.ts`, `roleDraft.ts`, single-source team constants (currently encoded in 4 places), `ABILITY_CATEGORIES`/`STRING_TARGET_OPTIONS`, `MODIFIER_LABELS`.
2. Split `types/role.ts` into transport DTOs vs domain/draft types so the engine can own domain types cleanly.
3. Add ESLint import-boundary rule: `src/domain|engine` must not import React/api/hooks/components/styles; components must not import `src/api` (one violation exists: `BasicInfoStep` → `rolesApi`).

**Quick wins:** move `capitalize` out of `styles/theme.ts`; extract `shuffleArray`/`SortableTile` from the WakeOrder page; share the `WakeOrderRouterState` router-state contract; delete or wire the orphaned `hooks/useDrafts.ts` and dead API methods; restructure the flat 33-file `src/test/` folder to mirror source.

**With/after Phase 04:** split `AbilitiesStep.tsx` (+ its 455-line test); extract `SelectableRoleCard` from GameSetup; replace the `location.state` handoff with shared setup state once the engine owns session construction; adopt the unused `@/` alias and per-layer barrels.
