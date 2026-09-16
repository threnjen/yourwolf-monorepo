# Phase 04b Discovery Context

Phase-scoped context from refinement. Read by Phase - Execute alongside `docs/phases/DISCOVERY_CONTEXT.md`.

## Corrections to the project discovery context

- The project discovery context and the learnings file say Phase 04b extends the transport `Role` type with counts, primary-team flag, and dependencies. Refinement dropped that. `RoleListItem` in `src/types/transport.ts` already carries those fields, and the setup page already holds the list items. The adapter merges a list item with its `GET /roles/{id}` detail response, taking only ability steps and wake target from the detail. The transport `Role` type stays as declared.

## Facts verified during refinement

- The frontend HTTP layer is axios (`src/api/client.ts`), and `src/test/setup.ts` replaces axios with stub methods for every test. Any test-side guard against `/games` requests has to live in that stub.
- Phase 04a pins setup validation messages to the Python wording, so the wake-order error banner shows the engine's message with no separate comparison.

No external research or user-provided documents were used.
