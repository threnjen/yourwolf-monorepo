# QA Skeleton: Role Card Copies & Dependency Auto-Selection

**Date:** 2026-03-26
**Mode:** Pre-Implementation QA Skeleton
**Scope:** Multi-copy role selection with +/– quantity controls, copy-count badge on RoleCard, and REQUIRES dependency auto-selection in GameSetup
**Status:** Draft — to be expanded into a Release QA Plan after implementation

## References

- Plan: `role-card-copies-plan.md`
- Context: `role-card-copies-context.md`
- Tasks: `role-card-copies-tasks.md`

---

## Planned Feature Summary

This task adds three capabilities to the existing game setup flow:

1. **Multi-copy role selection** — Roles like Werewolf (1–2 copies), Villager (1–3), and Mason (fixed 2) are added at their `default_count` and adjustable via +/– controls within `min_count`/`max_count` bounds.
2. **Copy-count badge on RoleCard** — Roles with `max_count > 1` display a badge (e.g., "×1–3" or "×2") wherever RoleCard renders (Roles page and GameSetup).
3. **REQUIRES dependency auto-selection** — Selecting a role with a REQUIRES dependency (e.g., Apprentice Tanner → Tanner) auto-adds the required role; removing a required role cascade-removes its dependents.

The backend list endpoint (`GET /api/roles/official`) will be updated to include `dependencies` per role, and frontend types/mocks will be extended to match.

---

## Anticipated Manual QA Areas

### 1. Backend — Dependencies on List Endpoint

**Acceptance Criteria:** AC6
**Why manual QA:** Real API response verification against seed data; confirms eager loading and schema mapping work end-to-end beyond unit tests

- [ ] **Fetch official roles list** — Call `GET /api/roles/official` with seed data loaded. **Expected:** Every role item includes a `dependencies` array (may be empty)
- [ ] **Verify dependency shape** — Inspect a role with a known REQUIRES dependency (Apprentice Tanner). **Expected:** `dependencies` contains an object with `required_role_id`, `required_role_name: "Tanner"`, and `dependency_type: "requires"`
- [ ] **Verify empty dependencies** — Inspect a role with no dependencies (e.g., Villager). **Expected:** `dependencies` is an empty array `[]`
- [ ] **Verify RECOMMENDS dependencies** — Inspect a role with a RECOMMENDS dependency (e.g., Minion). **Expected:** `dependencies` contains an entry with `dependency_type: "recommends"` and `required_role_name: "Werewolf"`

### 2. Copy Count Badge on RoleCard

**Acceptance Criteria:** AC2
**Why manual QA:** Visual rendering of badge text, positioning, and styling across different role types

- [ ] **Multi-copy role badge (variable range)** — View Werewolf card (min=1, max=2) on the Roles page or GameSetup. **Expected:** Badge displays "×1–2"
- [ ] **Multi-copy role badge (fixed count)** — View Mason card (min=2, max=2). **Expected:** Badge displays "×2"
- [ ] **Multi-copy role badge (larger range)** — View Villager card (min=1, max=3). **Expected:** Badge displays "×1–3"
- [ ] **Single-copy role — no badge** — View any single-copy role (e.g., Seer, max=1). **Expected:** No copy-count badge is rendered
- [ ] **Badge styling** — Observe badge appearance across multiple cards. **Expected:** Small, muted badge in the footer area; consistent with wake-order badge styling

### 3. Multi-Copy Role Selection (GameSetup)

**Acceptance Criteria:** AC3, AC4, AC5
**Why manual QA:** Interactive UI state management — quantity controls, counter display, button enable/disable states

- [ ] **Default count on first click** — Click Werewolf card (default_count=2) in GameSetup. **Expected:** Role is selected; total card counter increments by 2
- [ ] **Deselect on second click** — Click the already-selected Werewolf card again. **Expected:** Role is deselected; counter decrements by the role's count
- [ ] **+ button increments** — With Villager selected at count=1, click +. **Expected:** Count changes to 2; total counter increments by 1
- [ ] **– button decrements** — With Villager at count=2, click –. **Expected:** Count changes to 1; total counter decrements by 1
- [ ] **+ disabled at max** — With Villager at count=3 (max), observe + button. **Expected:** + button is visually disabled and clicking does nothing
- [ ] **– at min removes entirely** — With Villager at count=1 (min), click –. **Expected:** Villager is deselected entirely; counter decrements by 1
- [ ] **Mason atomic add** — Click Mason card (min=max=2). **Expected:** Mason is selected with count=2; counter increments by 2; no +/– buttons visible
- [ ] **Mason atomic remove** — Click already-selected Mason card. **Expected:** Mason is deselected; counter decrements by 2
- [ ] **Total card counter accuracy** — Select Werewolf (2) + Villager (3) + Seer (1). **Expected:** Counter shows 6 total selected cards
- [ ] **Start Game button with correct total** — Select exactly `players + center_cards` total cards using multi-copy roles. **Expected:** "Start Game" button becomes enabled

### 4. Role Dependency Auto-Selection (GameSetup)

**Acceptance Criteria:** AC8, AC9, AC10
**Why manual QA:** Multi-role cascading state changes triggered by user action; coordination between auto-selected and manually selected roles

- [ ] **REQUIRES auto-select on add** — Select Apprentice Tanner (requires Tanner). **Expected:** Tanner is automatically selected at its default_count (1); both roles appear selected in the grid
- [ ] **Auto-select when required role already present** — Select Tanner first, then select Apprentice Tanner. **Expected:** Tanner remains unchanged; Apprentice Tanner is added; no duplicate Tanner
- [ ] **Cascade-remove when required role removed** — With both Apprentice Tanner and Tanner selected, deselect Tanner. **Expected:** Both Tanner and Apprentice Tanner are removed; counter decrements by both roles' counts
- [ ] **One-way: removing dependent keeps required** — With both Apprentice Tanner and Tanner selected, deselect Apprentice Tanner. **Expected:** Apprentice Tanner is removed; Tanner remains selected
- [ ] **Auto-selected role visual parity** — After auto-selecting Tanner via Apprentice Tanner. **Expected:** Tanner appears identically to a manually selected role (same border, opacity, badge)
- [ ] **RECOMMENDS dependencies ignored in UI** — Select Minion (recommends Werewolf). **Expected:** Werewolf is NOT auto-selected; no visible dependency behavior in the frontend

### 5. Game Creation with Multi-Copy Roles

**Acceptance Criteria:** AC3, AC4 (integration)
**Why manual QA:** End-to-end flow from quantity selection through API submission to game creation

- [ ] **Create game with multi-copy roles** — Select a valid set including Werewolf ×2 and Villager ×3, fill remaining slots, click "Start Game". **Expected:** Game creates successfully; navigates to facilitator page
- [ ] **Night script includes all copies** — After creating a game with Werewolf ×2, advance to night phase. **Expected:** Script references Werewolf actions appropriately for the configured count

---

## Anticipated Cross-Cutting Concerns

- [ ] **Performance** — Verify role list load time is not noticeably impacted by the addition of `dependencies` to the response payload (≤30 roles × ≤2 deps each)
- [ ] **Accessibility** — Verify +/– buttons are keyboard-navigable and have appropriate aria labels; verify badge text is readable by screen readers
- [ ] **Responsive layout** — Verify quantity controls and badges don't break card layout on narrow viewports

---

## Open Questions

- What is the exact visual design of +/– controls? (Inline buttons on the card? Overlay? — will be resolved during implementation)
- Does the quantity badge position conflict with the existing wake-order badge? (Will be verified once RoleCard changes are implemented)
- Should auto-selected roles have a visual indicator distinguishing them from manually selected roles? (Plan says no — same appearance)
