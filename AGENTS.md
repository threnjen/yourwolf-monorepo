# Agent Guidelines — yourwolf-monorepo

Repo-specific rules only. General coding standards, testing practice, commit
hygiene, and language style guides live in skills, not here.

## Layout

| Path | What it is |
|------|-----------|
| `yourwolf-backend/` | Python API (FastAPI + SQLAlchemy/Alembic), packaged with `uv` |
| `yourwolf-frontend/` | TypeScript SPA (Vite + Vitest), packaged with `npm` |
| `docs/` | Monorepo-level docs — architecture, data models, roadmap, phases |
| `dev/` | Working artifacts (audits, feature plans, research) — not shipped |

Each package has its own `docs/STYLE_GUIDE.md`. Read the one for the package
you are editing before writing new modules.

## Backend (`yourwolf-backend/`)

- Use `uv` for environment and dependency management. `pyproject.toml` is the
  single source of truth for dependencies, including dev dependencies.
- Create the environment with `uv venv`; install with `uv sync`.
- Do not add dependencies to `requirements.txt` / `requirements-dev.txt`. Those
  files are legacy build inputs, not the dependency source of truth.
- Data models use **Pydantic v2**. Default to
  `model_config = ConfigDict(frozen=True)`; only disable `frozen` when
  mutability is required and the reason is stated.
- Validate at system boundaries (user input, external APIs). Internal Pydantic
  models are trusted after construction — do not re-validate them.
- Property-based tests use [Hypothesis](https://hypothesis.readthedocs.io/),
  a standard dev dependency. Prefer Hypothesis strategies over hand-written
  edge-case inputs for ranges, formats, and invariants.

## Frontend (`yourwolf-frontend/`)

- `package.json` is the single source of truth for all dependencies.
- Always commit `package-lock.json`. Use `npm ci` in CI and automated runs.
- Install dev-only tooling with `npm install --save-dev`.
- Property-based tests use [fast-check](https://fast-check.dev/) inside Vitest
  `test()` blocks via `fc.assert(fc.property(...))`.

## Code navigation: code-review-graph MCP

This repo has a knowledge graph. Use the `code-review-graph` MCP tools before
Grep/Glob/Read when exploring. The graph is cheaper and carries structural
context (callers, dependents, test coverage) that file scanning cannot.

| Tool | Use when |
|------|----------|
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `get_impact_radius` | Understanding the blast radius of a change |
| `get_affected_flows` | Finding which execution paths a change touches |
| `detect_changes` | Reviewing changes — returns risk-scored analysis |
| `get_review_context` | Source snippets for review, token-efficient |
| `get_architecture_overview` / `list_communities` | High-level structure |
| `refactor_tool` | Planning renames, finding dead code |

The graph auto-updates on file change via hooks. If a session warns the graph
was built on a different branch, run `code-review-graph build` before relying
on it. Fall back to Grep/Glob/Read only where the graph does not cover what
you need.

## Documentation

Keep `docs/` current when a change alters behavior described there —
`ARCHITECTURE.md`, `DATA_MODELS.md`, `CODEBASE_CONTEXT.md`,
`LOCAL_DEVELOPMENT.md`, `TROUBLESHOOTING.md`. Phase documents under
`docs/phases/` are reconciled through the `phase-doc-sync` skill, not edited
ad hoc.
