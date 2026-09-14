# QA Plan: PHASE_04A

**Date:** 2026-09-13  
**Last Updated:** 2026-09-14
**Mode:** Release QA Plan  
**Scope:** Phase 04A pure client-side engine contracts, narration templates and assembly, seed-role parity fixtures, setup validation, and immutable game-session transitions.  
**Environment:** No deployed environment is required. Phase 04A has no runtime callers or UI changes.  
**Prerequisites:** None for manual verification. The automated document uses the repository's existing `npm`, `uv`, Vitest, pytest, ESLint, TypeScript, Vite, and Python builder commands.

## Features Covered

| Feature | Plan | Implementation Record | Review Record |
|---------|------|-----------------------|---------------|
| `01-engine-types-templates` | `dev/feature/01-engine-types-templates/01-engine-types-templates-plan.md` | `dev/feature/01-engine-types-templates/01-engine-types-templates-implementation.md` | `dev/feature/01-engine-types-templates/reviews/03c-reviewer-plan-conformance-report.md` |
| `02-narration-scripts-preview` | `dev/feature/02-narration-scripts-preview/02-narration-scripts-preview-plan.md` | `dev/feature/02-narration-scripts-preview/02-narration-scripts-preview-implementation.md` | `dev/feature/02-narration-scripts-preview/reviews/03c-reviewer-plan-conformance-report.md` |
| `03-game-session-state-machine` | `dev/feature/03-game-session-state-machine/03-game-session-state-machine-plan.md` | `dev/feature/03-game-session-state-machine/03-game-session-state-machine-implementation.md` | `dev/feature/03-game-session-state-machine/reviews/03c-reviewer-plan-conformance-report.md` |

## Companion Documents

- Coverage Map: `docs/phases/PHASE_04A/PHASE_04A_QA_COVERAGE_MAP.md`
- Automated QA: `docs/phases/PHASE_04A/PHASE_04A_QA_AUTOMATED.md` — run by `z-feature-qa-runner`. Its Run results section is the evidence record for the automated gates.

This document contains only checks that require a human. No command belongs here.

## Summary of Changes

Feature 01 added readonly engine input and narration output contracts, all frozen instruction and wake templates, duration lookup, and the pure TypeScript boundary. Feature 02 added deterministic role ordering, night-script and preview assembly, and static Python-generated parity fixtures for the seed roles. Feature 03 added ordered setup validation, dependency warnings, injected-id session creation, setup-only start, and immutable phase transitions. The phase intentionally adds no frontend callers, API adapters, persistence, routing, or UI behavior.

## Automated Test Coverage

The focused frontend engine suites cover production output shapes, frozen template literals, wake and duration fallthrough, deterministic ordering, role/night/preview assembly, fixture parity, setup-validation precedence and sequences, dependency warnings, observed injected ids, and deeply immutable transitions. Mutation probes prove the shape, identity, and immutability guards fail when their named regressions are introduced. The backend narration, script-service, and setup-validation suites remain read-only reference and service-boundary oracles. Full regression, lint, build, paired coverage, redundancy, and flake evidence is recorded in the companion documents.

## Manual QA Checklist

There are no manual checklist items for Phase 04A. The engine is pure local code, and the phase has no UI or runtime caller for a human to operate. Phase 04b owns live integration, browser behavior, refresh handling, and end-to-end game-flow checks.

## Cross-Cutting Concerns

No manual performance, accessibility, security, or environment-specific checks apply to this no-caller phase. The automated boundary and scope checks cover the deterministic source constraints. Live and browser checks belong to Phase 04b.

## Notes

- Phase 04A has no user-visible change by design.
- The `Werewolfs` thumbs-up spelling remains frozen and is covered by the automated oracle tests.
- Type-only `src/engine/types.ts` declarations have no executable coverage lines. The automated coverage check evaluates executable engine modules and records that type-only exception.
