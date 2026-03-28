# Issue 001: Role Cards Not Sorted/Grouped by Team

**Source:** Phase 3 QA  
**Severity:** Medium  
**Area:** Frontend — Roles page, GameSetup page

## Problem

Role cards on both `/roles` and `/games/new` are displayed in the order returned by the API (insertion/default order). They are not grouped or sorted by team, making it hard to scan for roles of a particular affiliation.

## Current Behavior

- `Roles.tsx` renders `roles.map(...)` directly with no sorting.
- `GameSetup.tsx` renders `roles.map(...)` directly with no sorting.

## Expected Behavior

Role cards should be visually grouped by team (e.g., Village, Werewolf, Vampire, Alien, Neutral) with team section headers, or at minimum sorted by team so cards of the same team are adjacent.

## Affected Files

- `yourwolf-frontend/src/pages/Roles.tsx` — needs sort/group before rendering
- `yourwolf-frontend/src/pages/GameSetup.tsx` — needs sort/group before rendering
- Optionally: backend `GET /api/roles/official` could accept a `sort` parameter

## Suggested Approach

1. Define a canonical team ordering (e.g., Village → Werewolf → Vampire → Alien → Neutral).
2. Sort the `roles` array by team order before mapping to `<RoleCard>`.
3. Optionally, insert team header dividers between groups.
4. Apply the same logic in both `Roles.tsx` and `GameSetup.tsx` (extract a shared utility if desired).
