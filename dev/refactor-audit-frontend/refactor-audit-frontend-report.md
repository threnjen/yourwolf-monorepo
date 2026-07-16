# Refactor Audit — yourwolf-frontend

**Date:** 2026-07-16
**Scope:** `yourwolf-frontend/src/` (React 18, TypeScript, Vite) — source and test files
**Auditor:** Refactor Auditor (structural/architectural lens; file-level quality is out of scope)
**Forward context:** Phase 04 will add a pure-TypeScript game engine under `src/engine/`. Findings flagged **[ENGINE]** directly affect that work.

---

## 1. Executive Summary

- **Files audited:** 26 source files (`src/` excluding tests), 33 test files (reduced lens)
- **Findings:** 0 Critical / 2 High / 10 Medium / 8 Low

### Architectural Health Scores (1–5)

| Dimension | Score | Note |
|---|---|---|
| Organization | 4 | Clear layer folders (`api/`, `hooks/`, `pages/`, `components/`); flat test dir and naming drift |
| Dependencies | 4 | Clean acyclic graph, correct direction (pages → hooks → api → client); one orphaned hook, one layer skip |
| Decomposition | 3 | One god component (492 lines); three pages near/over 250 lines with embedded sub-components |
| Coupling | 3 | Router-state contract between pages; hook coupled to router; team enum encoded in 4 places |
| Separation of concerns | 2.5 | Game-rule logic (dependency cascade, wake-order grouping, step ordering) lives inside React hooks/pages — the main Phase 04 risk |
| Encapsulation | 3.5 | No barrels; DTO and UI-draft types mixed in one module; utility leaking from `styles/theme.ts` |

### Top 5 Priority Items

1. **[H-1]** `components/RoleBuilder/steps/AbilitiesStep.tsx` (492 lines) is a god component mixing palette UI, schema-driven forms, and step-ordering rules — split before the engine phase touches ability semantics.
2. **[H-2] [ENGINE]** Game-rule logic is embedded in the React layer (`useGameSetup` dependency cascade, `WakeOrderResolution` wake-group building/shuffling, `AbilitiesStep` renumbering/modifier normalization). Extract to pure TS modules now so Phase 04's `src/engine/` doesn't duplicate or fight it.
3. **[M-1] [ENGINE]** The team enum is independently encoded in four locations (`types/role.ts`, `styles/theme.ts` `TeamColor`, `utils/roleSort.ts` `TEAM_ORDER`, `BasicInfoStep` `TEAMS`) — a divergence trap once the engine defines teams a fifth time.
4. **[M-2]** GameSetup → WakeOrderResolution communicate via an untyped-at-the-boundary `location.state` contract (`WakeOrderRouterState` is declared only on the receiving side and carries the full roles array).
5. **[M-3]** `hooks/useDrafts.ts` is orphaned — imported only by its test; the drafts feature is not wired into any page.

---

## 2. Findings by Category

### Category 1 — Directory & Module Organization

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 1.1 | `src/test/` (33 files) | — | Medium | Flat, layer-agnostic test directory | All tests (pages, components, hooks, api, utils) sit in one flat folder. At 33 files this already obscures grouping; when `src/engine/` adds its own tests the folder becomes a dumping ground. Mirror the source tree (`src/test/hooks/`, `src/test/pages/`, …) or co-locate tests next to sources. |
| 1.2 | `src/pages/Home.tsx`, `src/pages/Roles.tsx` vs `src/pages/GameSetup.tsx` etc. | — | Low | Inconsistent page-component naming | Two conventions coexist: `Home`/`Roles` (bare) vs `GameSetupPage`/`RoleBuilderPage`/`GameFacilitatorPage`/`WakeOrderResolutionPage` (`Page` suffix). Pick one; the suffix convention also disambiguates `pages/RoleBuilder.tsx` from `components/RoleBuilder/`. |
| 1.3 | `src/styles/theme.ts` | L52–L54 | Medium | Non-style utility homed in styles module | `capitalize()` is a generic string formatter exported from the theme file and imported by 4 UI files. Belongs in `src/utils/`. Its presence makes `styles/theme.ts` a grab-bag and inflates its fan-in (see 2.2). |
| 1.4 | `src/pages/WakeOrderResolution.tsx` | L41–L48, L50–L77 | Medium | Page file hosts a generic util and a reusable component | `shuffleArray()` (generic util) and `SortableTile` (component) are defined inside the page. `shuffleArray` in particular is a pure function the engine will also want. |
| 1.5 | `tsconfig.json` | L24–L27 | Low | `@/*` path alias configured but never used | Every import in `src/` is relative (`../../../styles/theme` in the wizard steps). Either adopt the alias (recommended before `src/engine/` adds a fourth nesting level) or remove the config to avoid drift. |

### Category 2 — Import Graph & Dependency Health

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 2.1 | `src/hooks/useDrafts.ts` | — | Medium | Orphaned module | Only importer is `src/test/useDrafts.test.ts`. No page uses draft persistence; `RoleBuilder.tsx` builds drafts in transient state only. Either wire it into the Role Builder (draft save/restore) or delete hook + test. |
| 2.2 | `src/styles/theme.ts` | — | Medium | Highest fan-in file (~22 importers) | Every component/page imports `theme`/`TEAM_COLORS`/`capitalize`. As a token constant this is acceptable, but it makes theme changes the widest blast radius in the codebase and it currently exports non-style code (1.3) and a duplicate team enum (4.2). Keep it constants-only. |
| 2.3 | `src/api/roles.ts` L30–L38, `src/api/games.ts` L29–L37, L58–L60 | as listed | Low | Dead API surface | `rolesApi.listOfficial`, `rolesApi.getById`, `gamesApi.list`, `gamesApi.delete` have no production callers — only tests exercise them. Either they anticipate near-term features or they are speculative surface to prune. |
| 2.4 | `src/components/RoleBuilder/steps/BasicInfoStep.tsx` | L3, L101–L112 | Medium | Layer skip: presentational step calls API directly | `BasicInfoStep` imports `rolesApi` and runs its own debounced `checkName` fetch, while sibling steps are pure controlled components and all other data fetching goes through hooks (`useRoles`, `useAbilities`) or the page (`RoleBuilder` owns validate/preview). Extract a `useNameCheck` hook to restore the pages/hooks → api direction. |
| 2.5 | whole graph | — | Low (positive) | No circular imports detected | Dependency direction is consistently pages → hooks → api → client and components → types/styles. No cycles found. Recorded so the property is deliberately preserved when `src/engine/` lands. |

### Category 3 — Component & Module Decomposition

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 3.1 | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | 1–492 | High | God component | 492 lines combining: (a) ability category palette + tab state, (b) `StepParameterInputs`, a schema-driven dynamic form interpreting JSON-schema `properties` (L148–L227), (c) step list rendering, (d) step-ordering/modifier business rules (L307–L384), (e) parameter parsing (int/array coercion), (f) disabled-state messaging. Split into `StepParameterInputs.tsx`, `AbilityPalette.tsx`, and a pure `abilitySteps.ts` module for the add/remove/move/renumber logic **[ENGINE]** — the engine will need those same semantics. |
| 3.2 | `src/pages/GameSetup.tsx` | L191–L264 | Medium | Inline selectable-role-card widget | The role tile with selection border, quantity badge, and +/− controls (~70 lines of JSX wrapping `RoleCard`) is defined inline in the page map loop. Extract `SelectableRoleCard` so the page reads as layout and the widget becomes testable in isolation. |
| 3.3 | `src/pages/GameFacilitator.tsx` | L59–L172 | Low | Six phase-view components in one page file | `SetupPhaseView` … `CompletePhaseView` are cohesive and small, but the file is 294 lines and the phase views are the natural seam if any phase grows (they will, once the engine drives phases). Consider `components/facilitator/` when Phase 04 touches this flow. |
| 3.4 | `src/test/GameSetup.test.tsx` (485), `src/test/AbilitiesStep.test.tsx` (455), `src/test/WakeOrderResolution.test.tsx` (356), `src/test/Roles.test.tsx` (335) | — | Low | Oversized test files (test lens: decomposition) | Each exceeds 300 lines. Splitting follows naturally from splitting their subjects (3.1, 3.2) — e.g. `abilitySteps` rule tests separate from palette rendering tests. |

### Category 4 — Coupling & Cohesion

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 4.1 | `src/pages/GameSetup.tsx` L105–L116 (via `useGameSetup`), `src/pages/WakeOrderResolution.tsx` L26–L32, L82 | as listed | Medium | Implicit router-state contract between pages | Setup passes `{playerCount, centerCount, timerSeconds, selectedRoleCounts, roles}` through `location.state`; `WakeOrderRouterState` is declared only on the consumer side and cast with `as`. The producer (`useGameSetup.handleNext`) and consumer can silently drift. At minimum share the interface from one module; better, hold in-progress game setup in a shared hook/context or sessionStorage keyed state instead of shipping the full `RoleListItem[]` through history state. |
| 4.2 | `src/types/role.ts` L1, `src/styles/theme.ts` L42, `src/utils/roleSort.ts` L3, `src/components/RoleBuilder/steps/BasicInfoStep.tsx` L11 | as listed | Medium **[ENGINE]** | Team enum encoded in four places | `Team`, `TeamColor` (structural duplicate), `TEAM_ORDER`, and `TEAMS` each restate the five teams. Adding a team requires four coordinated edits, and the engine will add a fifth. Define teams once (a `TEAMS` const array + derived `Team` type in a domain module) and derive order/colors/buttons from it. |
| 4.3 | `src/hooks/useGameSetup.ts` | L2, L13, L105–L116 | Medium | Hook coupled to router and route literal | `useGameSetup` accepts a `NavigateFunction` and hardcodes `'/games/new/wake-order'`. The setup-state logic (counts, cascade selection) is otherwise pure and engine-adjacent. Return `canStart` + a payload and let the page own navigation, so the state logic can migrate toward the engine untouched. |
| 4.4 | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` L28–L33, `src/components/RoleBuilder/steps/ReviewStep.tsx` L4–L9 | as listed | Low | Duplicated `MODIFIER_LABELS` map | Identical modifier-label record in two step components; a third copy is likely when the engine renders scripts. Home it next to `StepModifier` in the domain/types layer. |
| 4.5 | `src/components/RoleBuilder/steps/AbilitiesStep.tsx` | L18–L24, L126–L139 | Medium **[ENGINE]** | Domain vocabularies hardcoded in a UI component | `ABILITY_CATEGORIES` (ability-type taxonomy) and `STRING_TARGET_OPTIONS` (target selectors like `player.self`, `center.main`) are game-domain vocabularies embedded in a presentation file. The engine will interpret exactly these strings; if they live only here, engine and UI will drift. Move to a shared domain constants module. |

### Category 5 — Separation of Concerns

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 5.1 | `src/hooks/useGameSetup.ts` L38–L103; `src/pages/WakeOrderResolution.tsx` L41–L48, L93–L126, L156–L164; `src/components/RoleBuilder/steps/AbilitiesStep.tsx` L307–L384 | as listed | High **[ENGINE]** | Game rules implemented inside React state layer | Pure game logic is entangled with `useState`/`setX` plumbing: role-dependency cascade select/remove (useGameSetup), wake-group construction + within-group shuffle + flattening to `wake_order_sequence` (WakeOrderResolution), ability-step renumbering and modifier normalization (AbilitiesStep). All of it is deterministic input→output logic that Phase 04's engine will also need. Extract now into pure modules (`src/domain/` or the future `src/engine/`): `roleSelection.ts`, `wakeOrder.ts`, `abilitySteps.ts` — each trivially unit-testable without React Testing Library. |
| 5.2 | `src/pages/RoleBuilder.tsx` | L9–L25 | Medium **[ENGINE]** | Domain factory in page file | `createEmptyDraft()` defines the canonical default `RoleDraft` inside a page. Move next to the `RoleDraft` type so the engine and any future edit flow share one source of defaults. |
| 5.3 | `src/api/roles.ts` | L88–L147 | Low (positive) | Transport mapping correctly isolated | `draftToPayload`/`draftToPreviewPayload` keep DTO shaping inside the api layer — the right pattern; noted as the standard to hold new engine↔api boundaries to. |
| 5.4 | all components/pages | — | Low | Three coexisting styling mechanisms | Inline `React.CSSProperties` constants (dominant, ~60% of many files' line counts), shared style objects (`styles/shared.ts`), and two CSS files (`App.css` classes like `sidebar-open`, `hamburger-btn` referenced from `Sidebar.tsx`/`Header.tsx` via `className`). The CSS-class ↔ inline-style split means hover/responsive behavior lives in two places. A structural consolidation decision (one mechanism) would shrink component files substantially; not urgent. |

### Category 6 — API Surface & Encapsulation

| # | File(s) | Line(s) | Severity | Finding | Detail |
|---|---------|---------|----------|---------|--------|
| 6.1 | `src/types/role.ts` | L43–L66 | Medium **[ENGINE]** | Server DTOs and UI draft types mixed in one module | `Role`/`RoleListItem`/`Ability` (API response shapes) share a file with `RoleDraft`/`AbilityStepDraft`/`WinConditionDraft` (client wizard state). `AbilityStepDraft = AbilityStep` is a bare alias and `WinConditionDraft` structurally duplicates `WinCondition`. Phase 04 needs a clean answer to "which types does the engine own?" — split into `types/api.ts` (transport) and domain types the engine can own without importing transport concerns. |
| 6.2 | `src/api/`, `src/hooks/`, `src/components/`, `src/types/` | — | Low | No barrel/index files defining public surfaces | Deep imports everywhere (e.g. `../../../styles/theme` from wizard steps). Barrels per layer (`api/index.ts`, `hooks/index.ts`) plus the unused `@/` alias (1.5) would define public surfaces — and give `src/engine/` a single import point to expose. |
| 6.3 | `src/styles/theme.ts` | L42–L54 | Low | Theme module leaks non-theme exports | `TeamColor` type and `capitalize` widen the theme's public surface beyond design tokens (see 1.3, 4.2). |

### Category 7 — Migration & Restructuring Opportunities

See §4 Recommended Restructuring Priority and §5 Risk Matrix for the ordered plan. Key co-locations/moves:

- **Create `src/domain/` (pre-engine landing zone).** Move: dependency-cascade + selection logic out of `useGameSetup`; wake-group build/shuffle/flatten out of `WakeOrderResolution`; step renumber/modifier rules out of `AbilitiesStep`; `createEmptyDraft` out of `RoleBuilder`; team constants (single source, 4.2); `ABILITY_CATEGORIES`/`STRING_TARGET_OPTIONS`; `MODIFIER_LABELS`. Phase 04 can then either rename `src/domain/` → `src/engine/` or have the engine consume it. Rule to enforce from day one: `src/domain|engine` imports nothing from `react`, `src/api`, `src/hooks`, `src/components`, `src/styles` (add an ESLint `no-restricted-imports`/boundaries rule — currently nothing enforces layer direction).
- **`capitalize` → `src/utils/format.ts`**; `shuffleArray` → `src/utils/` (or domain, since the engine will shuffle).
- **Split `AbilitiesStep.tsx`** into `AbilityPalette.tsx`, `StepParameterInputs.tsx`, `StepList.tsx` + domain `abilitySteps.ts`.
- **`SortableTile` → `components/`** (or a `components/wakeOrder/` folder) out of the page.
- **`useDrafts`**: wire in or delete.
- **Restructure `src/test/`** to mirror source layout (mechanical, no importer impact outside tests).

---

## 3. Dependency Graph Observations

**Layering (observed, acyclic):**
`main.tsx → App.tsx → routes.tsx → pages/* → hooks/* → api/* → api/client.ts`, with `components/*`, `types/*`, `styles/*`, `utils/*` as leaves. No layer imports upward. No circular chains found.

**Highest fan-in (fragile change points):**

| File | Approx. importers | Note |
|---|---|---|
| `styles/theme.ts` | ~22 | Tokens + leaked utils (findings 1.3, 6.3) |
| `types/role.ts` | ~12 | Mixed DTO/draft types (6.1) |
| `styles/shared.ts` | ~8 | Shared page styles |
| `api/client.ts` | 3 | Correctly narrow |
| `hooks/useFetch.ts` | 3 | Good abstraction, consistently reused |

**Highest fan-out:** `pages/GameFacilitator.tsx` (9 internal imports), `pages/GameSetup.tsx` (7), `Wizard.tsx` (7) — all composition roots, acceptable.

**Layer violations:** one — `BasicInfoStep` (component) → `api/roles` directly (finding 2.4).

**Orphaned files:** `hooks/useDrafts.ts` (test-only importer). Dead exports: `rolesApi.listOfficial`, `rolesApi.getById`, `gamesApi.list`, `gamesApi.delete`.

**Hidden coupling:** `location.state` contract between GameSetup and WakeOrderResolution (4.1) — invisible to the import graph, which is exactly why it's flagged.

---

## 4. Recommended Restructuring Priority

### 1. Quick wins (low risk, immediate benefit)
1. Move `capitalize` → `src/utils/format.ts` (4 importers to update).
2. Move `shuffleArray` and `SortableTile` out of `WakeOrderResolution.tsx` (0 external importers).
3. Hoist `MODIFIER_LABELS` next to `StepModifier` (2 importers).
4. Decide on `useDrafts` (wire or delete) and dead API methods (2.3).
5. Share the `WakeOrderRouterState` interface between producer and consumer (2 files).
6. Restructure `src/test/` into subfolders mirroring source (test-only churn).

### 2. Important restructurings (do before Phase 04 starts)
7. **Create `src/domain/` with single-source team constants** and derive `TEAM_ORDER`, `TEAM_COLORS` keys, and `TEAMS` from it (4.2).
8. **Extract pure game-rule modules**: `domain/roleSelection.ts` (cascade logic from `useGameSetup`), `domain/wakeOrder.ts` (grouping/shuffle/flatten), `domain/abilitySteps.ts` (renumber/modifier rules), `domain/roleDraft.ts` (`createEmptyDraft`) (5.1, 5.2). Hooks/pages become thin adapters.
9. **Split `types/role.ts`** into transport DTOs vs domain/draft types (6.1).
10. **Add an ESLint import-boundary rule** so `src/domain`/`src/engine` cannot import React/api/hooks/components/styles, and components cannot import `src/api` directly (prevents recurrence of 2.4).
11. Extract `useNameCheck` hook from `BasicInfoStep` (2.4).

### 3. Major reorganizations (schedule with Phase 04 or after)
12. Split `AbilitiesStep.tsx` into palette/params/list components on top of `domain/abilitySteps.ts` (3.1), and split its 455-line test alongside.
13. Extract `SelectableRoleCard` from GameSetup (3.2) and consider `components/facilitator/` for the phase views (3.3).
14. Replace `location.state` handoff with shared setup state (context/hook) once the engine owns game-session construction (4.1).
15. Adopt the `@/` alias repo-wide and add per-layer barrels (1.5, 6.2); optionally consolidate styling mechanism (5.4).

---

## 5. Risk Matrix

| Move | Files Affected | Importers to Update | Test Coverage | Risk |
|------|---------------|--------------------|---------------|------|
| `capitalize` → `utils/format.ts` | 1 new, 1 edited | 4 | Indirect (component tests) | Low |
| `shuffleArray`/`SortableTile` out of `WakeOrderResolution.tsx` | 1 → 3 | 0 external | `WakeOrderResolution.test.tsx` (356 lines) | Low |
| Hoist `MODIFIER_LABELS` to domain | 3 | 2 | AbilitiesStep/ReviewStep tests | Low |
| Delete or wire `useDrafts` | 1–2 | 0 (orphan) | `useDrafts.test.ts` (172 lines) | Low |
| Share `WakeOrderRouterState` type | 2 | 2 | GameSetup + WakeOrder tests | Low |
| Restructure `src/test/` into subfolders | 33 | 0 (tests only) | n/a | Low |
| Single-source team constants (`src/domain/teams.ts`) | 5 | 4 | roleSort, BasicInfoStep, RoleCard tests | Medium |
| Extract `domain/roleSelection.ts` from `useGameSetup` | 2 | 1 (`GameSetup.tsx`) | `GameSetup.test.tsx` (485 lines) covers behavior | Medium |
| Extract `domain/wakeOrder.ts` | 2 | 1 | `WakeOrderResolution.test.tsx` | Medium |
| Extract `domain/abilitySteps.ts` + split `AbilitiesStep.tsx` | 1 → 4–5 | 1 (`Wizard.tsx`) | `AbilitiesStep.test.tsx` (455 lines) | Medium |
| Split `types/role.ts` (api vs domain types) | 1 → 2 | ~12 | Type-only; tsc catches breaks | Medium |
| `useNameCheck` extraction from `BasicInfoStep` | 1 → 2 | 1 | `BasicInfoStep.test.tsx` (246 lines) | Low |
| Replace `location.state` handoff with shared state | 3–4 | 2 pages + hook | Setup/WakeOrder tests need rework | High |
| Adopt `@/` alias + barrels repo-wide | ~26 | all | Mechanical; tsc/vitest verify | Medium |

---

## 6. Cross-Cutting Observations

- **The codebase is well-layered for its size** — the useFetch abstraction, api-object pattern, and transport mapping in `api/roles.ts` are consistently applied. The structural debt is concentrated in exactly one theme: *game semantics living in React files*, which is precisely what Phase 04 stresses.
- **Duplication pattern:** domain vocabularies (teams, modifiers, ability categories, target selectors) are each defined where first needed rather than in one domain module — four separate instances of the same pattern (findings 4.2, 4.4, 4.5).
- **Nothing enforces the (currently clean) layer direction.** One violation (2.4) already slipped in; an ESLint boundary rule is cheap insurance before the engine adds a layer that must stay React-free.
- **Test structure mirrors none of these seams** — one flat folder, with the largest test files attached to the largest components; both split together.
