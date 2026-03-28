# Review Record: Win Condition Labels UX Clarity

## Summary
Clean, minimal implementation that matches the plan exactly. Two low-severity issues found and fixed: ReviewStep label inconsistency and missing `aria-describedby` associations. High confidence — no blockers.

## Verdict
Approved with Reservations

## Traceability

| AC | Status | Code Location | Notes |
|----|--------|---------------|-------|
| AC1 | Verified | `WinConditionsStep.tsx:135` | Label text and aria-label both say "Primary win condition" |
| AC2 | Verified | `WinConditionsStep.tsx:140` | Subtext span with correct text, now linked via aria-describedby |
| AC3 | Verified | `WinConditionsStep.tsx:145` | Label text and aria-label both say "Independent win" |
| AC4 | Verified | `WinConditionsStep.tsx:150` | Subtext span with correct text, now linked via aria-describedby |
| AC5 | Verified | No behavior changes | Handlers untouched; existing test queries `/primary/i` still matches |

## Issues Found

| # | Issue | Severity | File:Line | AC | Status |
|---|-------|----------|-----------|-----|--------|
| 1 | ReviewStep shows "(primary)" and "(overrides team)" while WinConditionsStep uses new labels | Medium | `ReviewStep.tsx:145-148` | — | Fixed |
| 2 | Subtext not linked to checkbox via `aria-describedby` | Low | `WinConditionsStep.tsx:133-150` | — | Fixed |
| 3 | `subtextStyles` uses same color as `labelStyles` — visual hierarchy relies on font-size only | Low | `WinConditionsStep.tsx:36,48` | — | Wont-Fix |

**Status values**: Fixed (applied during this review) | Open (not addressed) | Wont-Fix (declined with rationale)

## Fixes Applied

| File | What Changed | Issue # |
|------|--------------|---------|
| `ReviewStep.tsx` | Updated "(primary)" → "(primary win condition)" and "(overrides team)" → "(independent win)" | 1 |
| `WinConditionsStep.tsx` | Added `aria-describedby` on both checkbox inputs and `id` on subtext spans | 2 |

## Remaining Concerns
- Issue #3: same `textMuted` color for label and subtext — low severity, purely cosmetic, current design is acceptable

## Test Coverage Assessment
- Covered: AC1, AC2, AC3, AC4, AC5
- Missing: No test verifies clicking subtext does NOT toggle the checkbox (low risk — subtext is outside `<label>`)
- ReviewStep tests don't assert on label text of annotations, so no updates needed for fix #1

## Risk Summary
- `ReviewStep.tsx:145-148` — label change is cosmetic; no tests assert old text, but manual verification recommended
- `aria-describedby` IDs use index-based naming (`primary-hint-0`) — safe since list items are keyed by `wc.id` and indices are stable within a render
