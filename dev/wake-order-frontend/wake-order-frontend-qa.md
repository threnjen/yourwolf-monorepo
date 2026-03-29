# QA Plan: Wake Order Frontend

**Date:** 2026-03-28
**Mode:** Feature QA Plan
**Scope:** "Review Wake Order" page — grouped drag-and-drop wake order review between GameSetup and game creation
**Environment:** Local dev (`npm run dev` at `http://localhost:5173`)
**Prerequisites:**
- Backend running: `cd yourwolf-backend && docker compose up -d && uvicorn app.main:app --reload`
- Frontend running: `cd yourwolf-frontend && npm run dev`
- Database seeded with official roles: `cd yourwolf-backend && python -m app.scripts.seed_roles`
- At least one role with `wake_order > 0` exists (e.g., Werewolf, Seer, Robber, Troublemaker)

## References

- Plan: `dev/wake-order-frontend/wake-order-frontend-plan.md`
- Context: `dev/wake-order-frontend/wake-order-frontend-context.md`
- Tasks: `dev/wake-order-frontend/wake-order-frontend-tasks.md`
- Implementation: `dev/wake-order-frontend/wake-order-frontend-implementation.md`
- Review: `dev/wake-order-frontend/wake-order-frontend-review.md`
- Coverage Map: `dev/wake-order-frontend/wake-order-frontend-coverage-map-qa.md`

---

## Summary of Changes

Modified `WakeOrderResolution.tsx` to display waking roles grouped by `wake_order` value with visible "Wake #N" headers. Each group uses its own `SortableContext` so drag-and-drop is constrained within groups. Roles are randomly shuffled within each group on page load. The "Start Game" button is always enabled (removed old conflict-resolution paradigm). Page title changed to "Review Wake Order". GameSetup's "Next" button navigates to this page with Router state.

## Automated Test Coverage (21 tests, all passing)

The following behaviors are **fully covered by unit tests** — skip during manual QA:

- Waking role filtering (`wake_order > 0` only) — AC3
- Duplicate role deduplication (2× Werewolf → 1 tile) — AC4
- Group header text content ("Wake #1", "Wake #4", etc.) — AC5 (text only)
- Random shuffle across renders (20-render probabilistic test) — AC6
- "Start Game" always enabled on load — AC9
- API payload includes correct `wake_order_sequence` in group order — AC10
- Navigation to `/games/{id}` after game creation — AC10
- Error banner on API failure — AC10
- Empty `wake_order_sequence` when no waking roles — AC10
- Redirect to `/games/new` without Router state — AC12
- Page title "Review Wake Order" and subtitle text — page text
- Tile text content and border-left presence — AC11 (presence only)

---

## Manual QA Checklist

### 1. Visual Appearance — Group Headers, Tile Borders, Layout

**Covers ACs:** AC5, AC11
**Why manual:** Unit tests verify text content and CSS property existence, but cannot verify that the visual rendering looks correct — colors, spacing, font weight, and layout require human eyes.

#### Happy Path
- [ ] **View grouped layout** — Navigate to GameSetup, select Werewolf (wake 1), Seer (wake 4), Robber (wake 4), Troublemaker (wake 5), and enough non-waking roles to fill the card count. Click "Next". **Expected:** The Review Wake Order page shows three distinct groups with headers "Wake #1", "Wake #4", "Wake #5" in that order. Each header is visually distinct from the tiles (muted color, smaller font, bold weight).
- [ ] **Verify team-colored tile borders** — On the same page, inspect the tiles. **Expected:** Werewolf tile has a red/dark left border (werewolf team color). Seer, Robber, Troublemaker tiles have a blue/teal left border (village team color). The 4px left border is clearly visible.
- [ ] **Verify tile content** — Each tile shows the role name on the left and a "Wake #N" badge on the right in muted text. **Expected:** Text is legible, properly aligned, and not truncated.
- [ ] **Verify group separation** — Groups have visible vertical spacing between them. **Expected:** Each group (header + tiles) is visually distinct from the next group, with clear whitespace between the last tile of one group and the header of the next.
- [ ] **Verify page layout** — Page has title "Review Wake Order", subtitle "Drag roles to customize order within each wake group", tile area, and "Start Game" button at the bottom. **Expected:** Standard page layout consistent with other pages (GameSetup, etc.) — centered content, dark background, appropriate padding.

#### Edge Cases
- [ ] **Single-role groups** — Select only roles with unique wake orders (e.g., Werewolf wake 1, Seer wake 4). **Expected:** Each group has exactly one tile under its header. Tiles still show grab cursor (review note: known open issue #1 — cursor shows grab even though drag has no effect).
- [ ] **Many groups** — Select 5+ roles spanning different wake orders. **Expected:** All groups render without overlap or layout breakage. Page scrolls naturally if content exceeds viewport.

### 2. Drag-and-Drop Interactions

**Covers ACs:** AC7, AC8
**Why manual:** jsdom cannot simulate pointer events for drag-and-drop. This is the primary manual QA surface.

#### Happy Path
- [ ] **Drag within a multi-role group** — Select Seer (wake 4) and Robber (wake 4). On the Review Wake Order page, click and drag the Seer tile below the Robber tile within the "Wake #4" group. **Expected:** The tiles swap positions smoothly. The tile follows the cursor during drag with a visible transform/animation.
- [ ] **Verify reorder persists** — After dragging Seer below Robber, release. Then click "Start Game". **Expected:** The game is created successfully (no errors). The page navigates to the facilitator page.
- [ ] **Drag with 3+ roles in a group** — Select Seer, Robber, and Witch (all wake 4, if available; otherwise use any 3 roles sharing a wake order). Drag the bottom role to the top of the group. **Expected:** The role moves to the top position. The other two roles shift down. Animation is smooth.
- [ ] **Keyboard reorder** — Focus a tile using Tab, then use Space/Enter to pick it up and arrow keys to move it within the group. Press Space/Enter to drop. **Expected:** The tile reorders via keyboard. This is built into `@dnd-kit`'s `KeyboardSensor`.

#### Cross-Group Constraint
- [ ] **Attempt cross-group drag** — With Werewolf (wake 1) and Seer (wake 4) visible, attempt to drag Werewolf into the Wake #4 group area. **Expected:** The tile does NOT move into the other group. It either snaps back to its original position or is not accepted by the other group's drop zone.

#### Edge Cases
- [ ] **Single-role group drag attempt** — With only Werewolf in Wake #1, attempt to drag the Werewolf tile. **Expected:** The tile may lift (grab cursor is shown — known issue #1) but has nowhere to go. Releasing it returns it to its original position. No errors.

### 3. Full Navigation Flow — GameSetup → Wake Order → Game

**Covers ACs:** AC1, AC2, AC10
**Why manual:** While individual steps are unit-tested, the end-to-end flow across real pages with real navigation and a live API call requires manual verification.

#### Happy Path
- [ ] **Complete flow** — Open `http://localhost:5173/games/new`. Set players=5, center=3. Select 8 roles (including at least 2 waking roles sharing a wake order). Click "Next". **Expected:** Navigate to Review Wake Order page showing the selected waking roles grouped correctly.
- [ ] **Start Game from wake order page** — On the Review Wake Order page, optionally reorder a tile, then click "Start Game". **Expected:** Button shows "Creating Game..." briefly, then navigates to `/games/{id}` (the facilitator page). The facilitator page loads without errors.
- [ ] **Verify wake order in facilitator** — On the facilitator page, check that the night phase wake order reflects the sequence from the Review Wake Order page. **Expected:** Roles wake in the order shown on the review page (group 1 first, then group 2, etc., with within-group order matching any reordering you did).

#### Edge Cases
- [ ] **No waking roles flow** — Select only non-waking roles (e.g., Villager ×5, Tanner, etc.) to fill the card count. Click "Next". **Expected:** Review Wake Order page shows "No waking roles selected. You can start the game immediately." with "Start Game" enabled. Clicking it creates the game and navigates to the facilitator.
- [ ] **Browser back button** — From the Review Wake Order page, click the browser back button. **Expected:** Returns to GameSetup page. Previously selected roles and config (player count, center count, timer) are visible. (Note: Router state may or may not be fully preserved depending on React Router behavior — verify what actually happens.)
- [ ] **Direct URL access** — Open `http://localhost:5173/games/new/wake-order` directly in a new tab (no prior navigation). **Expected:** Redirects to `/games/new` (GameSetup page) because Router state is missing.

### 4. Mobile / Touch Behavior

**Covers ACs:** AC7 (touch variant)
**Why manual:** Touch drag behavior uses `@dnd-kit`'s `PointerSensor` which supports touch, but actual touch interaction cannot be tested in jsdom.

- [ ] **Touch drag on mobile viewport** — Open Chrome DevTools, enable device toolbar (mobile viewport, e.g., iPhone 14). On the Review Wake Order page with a multi-role group, touch-drag a tile within its group. **Expected:** The tile follows the touch point and reorders on release. Basic functionality works (per non-goal: "basic @dnd-kit touch support is sufficient").
- [ ] **Page layout on mobile** — On a mobile viewport, verify the page layout. **Expected:** Content is readable, tiles are full-width, groups are visually separated, "Start Game" button is accessible without horizontal scrolling.

---

## Cross-Cutting Concerns

### Performance
- [ ] **Large role set** — Select the maximum number of roles with overlapping wake orders (e.g., 8+ waking roles). **Expected:** Page renders without noticeable delay. Drag interactions remain smooth (no jank or dropped frames).

### Accessibility
- [ ] **Screen reader announcement** — With a screen reader enabled (or VoiceOver on macOS: Cmd+F5), navigate the wake order page. **Expected:** Group headers are announced. Tile names are announced. The "Start Game" button is reachable and announced with its label.
- [ ] **Keyboard-only navigation** — Tab through the page without using a mouse. **Expected:** All tiles are focusable. "Start Game" button is reachable via Tab. Focus order follows the visual order (group 1 tiles, then group 2 tiles, etc.).

---

## Notes

- **Known open issue #1 (Low):** Single-item group tiles show `cursor: grab` even though dragging has no effect. Cosmetic only — deferred to next cleanup pass.
- **Known open issue #2 (Low):** Each tile redundantly shows a "Wake #N" badge when the group header already displays this information. Arguably improves usability during drag. Deferred.
- **Known open issue #3 (Low):** `wakingRoles`, `roleById`, `sortedGroupKeys` recomputed every render without `useMemo`. Harmless for small data sets from immutable Router state.
- **Shuffle is not cryptographic:** Uses `Math.random()` via Fisher-Yates. Sufficient for game UX randomization.
- **Router state is ephemeral:** Page refresh on the wake order page loses state and redirects to `/games/new`. This is expected MVP behavior.
- **Pre-existing test failures:** 3 tests in `useRoles.test.ts` fail (unrelated to this feature). All 21 WakeOrderResolution tests pass.
