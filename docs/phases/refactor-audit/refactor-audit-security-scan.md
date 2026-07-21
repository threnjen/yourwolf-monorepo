# security-scan: refactor-audit

## Scan Metadata

- **Repository revision:** `7d12ef7e8c01150420165ffcb7949c7447499e99` (branch `phase/refactor-audit`)
- **Phase baseline:** `19b4520`
- **Scan date:** 2026-07-16
- **Scan scope:** **DIFF-SCOPED** — `git diff --name-only 19b4520..HEAD` (173 files; 14,948 insertions / 4,032 deletions)
- **Phase artifacts reviewed:** feature implementation/review/tasks records for features 01–12 under `dev/feature/`, `docs/ARCHITECTURE.md`, `docs/CODEBASE_CONTEXT.md`
- **Baseline comparison method:** read-only `git show 19b4520:<path>` and `git diff 19b4520..HEAD`. No working-tree-mutating command was run. No source code was modified.

### Scope and exclusions

This is **not** the full-repository scan the security-scan role normally performs. It is explicitly scoped to
the phase diff at the parent's direction. Consequences:

- Files unchanged since `19b4520` were assessed **only** where a changed file's behavior depends on them
  (e.g. `app/routers/health.py`, `app/schemas/base.py`, `.env.example`).
- Findings below are drawn from the diff plus dependency state. A clean result here is **not** a statement
  that the repository is free of security issues outside the diff.
- Generated/vendored content excluded: `node_modules/`, build output, caches. `package-lock.json` was
  reviewed as a manifest, not as vendored code.

---

## Verdict

### PASS WITH CONDITIONS

The refactor is **security-neutral-to-positive**. It introduced **no Critical and no High findings**, and it
did not worsen any pre-existing finding. Several changes are genuine hardening wins (see
[Hardening Wins](#hardening-wins-phase-introduced)).

The conditional verdict is driven **entirely by pre-existing dependency vulnerabilities** that the phase
neither introduced nor touched. Per the role's rules, pre-existing Critical/High findings are not dismissed.

If the release gate is scoped strictly to "did this refactor regress security", the answer is **no** — that
portion is a clean **PASS**.

### Finding counts by severity

| Severity | Count |
|---|---|
| Critical | 1 |
| High | 2 |
| Medium | 1 |
| Low | 5 |
| **Total** | **9** |

### Finding counts by phase relationship

| Relationship | Count | Severities |
|---|---|---|
| Introduced | 3 | Low ×3 |
| Worsened | 0 | — |
| Pre-existing | 6 | Critical ×1, High ×2, Medium ×1, Low ×2 |
| Unclear | 0 | — |

**No Critical or High finding is attributable to this phase.**

---

## Coverage Matrix

| Category | Artifact classes reviewed | Method/tool | Status | Limitations |
|---|---|---|---|---|
| 1. Secrets and credentials | All 173 diff-scoped files; `.gitignore`; `.env.example` | Regex sweep (password/secret/key/token/DSN-with-credentials patterns); `git ls-files` for tracked env files | **Assessed** | Pattern-based; no entropy scan, no git-history scan (`gitleaks`/`trufflehog` unavailable). History prior to `19b4520` not scanned. |
| 2. Dependencies and supply chain | `package.json`, `package-lock.json` | `npm audit --json` | **Assessed (JS)** | **Python NOT assessed** — `pip-audit`/`safety`/`bandit` unavailable and the role forbids installing tools solely to scan. Backend dep manifests are unchanged by the diff, so this is out of diff scope regardless. |
| 3. App attack surface and injection | Backend `app/**`, frontend `src/**` | Manual review + sink grep (raw SQL, `text()`, f-string SQL, `eval`, `subprocess`, `os.system`, `pickle`, `yaml.load`, `open()`, `innerHTML`, `dangerouslySetInnerHTML`) | **Assessed** | Static reasoning only; no DAST/fuzzing. |
| 4. AuthN / authZ / session | `app/routers/**`, `app/services/role_service.py` | Manual review; baseline guard comparison | **Partially assessed** | The API has **no authentication layer at all** (pre-existing; Cognito is roadmapped Phase 4+). Only the lock/official guards were assessable. See F-04. |
| 5. Data protection and cryptography | `app/config.py`, `app/database.py`, `alembic/env.py` | Manual review + baseline diff | **Assessed** | No crypto is implemented in-repo; nothing to assess beyond credential handling. TLS/at-rest posture is deployment-layer, not in diff. |
| 6. API and input-boundary defenses | `app/schemas/**`, `app/services/role_validation.py`, `app/services/game_setup_validation.py`, `app/services/pagination.py` | Manual review + exhaustive constraint diff | **Assessed** | — |
| 7. Filesystem, process, runtime safety | `app/seed/roles.py`, `app/seed/data/roles.json`, `app/seed/__init__.py` | Manual review; path-flow trace | **Assessed** | — |
| 8. Infrastructure, CI/CD, deployment | — | — | **NOT ASSESSED** | **No infra/CI/CD/deployment artifact appears in the diff.** No Dockerfile, compose file, IaC template, or workflow file changed. Out of diff scope. |
| 9. Observability and operational security | `app/seed/**`, `app/database.py`, `app/main.py` | Manual review of logging/error paths | **Assessed** | Only diff-scoped log sites. No runtime log inspection. |
| 10. Security architecture / cross-cutting | `app/exceptions.py`, `app/main.py`, `eslint.config.js`, `tests/conftest.py` | Manual review + baseline diff | **Assessed** | — |

---

## Findings

| ID | Severity | Category | Location | Phase relationship | Evidence | Impact | Recommended remediation |
|---|---|---|---|---|---|---|---|
| F-01 | **Critical** | 2. Dependencies | `yourwolf-frontend/package.json` (`vitest`, `@vitest/coverage-v8`) | **Pre-existing** | `npm audit`: `vitest <=3.2.5` — "When Vitest UI server is listening, arbitrary file can be read and executed"; transitively `@vitest/mocker`, `vite`, `vite-node`. `@vitest/coverage-v8 <=3.2.5` critical via `vitest`. | Arbitrary file read + execution **if** the Vitest UI server is exposed. Mitigating: `devDependencies` only — never shipped to users; no `--ui` flag in any script; exploitation requires a listening UI server reachable by an attacker. Not part of the deployed artifact. | Upgrade `vitest` and `@vitest/coverage-v8` to a patched major. Not caused by this phase; schedule as dependency maintenance rather than blocking the refactor. |
| F-02 | **High** | 2. Dependencies | `yourwolf-frontend/package.json:19` (`axios: ^1.6.5`) | **Pre-existing** | `npm audit`: `axios 1.0.0 – 1.15.2` carries ~23 advisories, incl. prototype-pollution gadgets enabling credential injection / response tampering / request hijacking, NO_PROXY→SSRF bypasses, and Proxy-Authorization credential leak across redirect. | **This is a production runtime dependency** — the only High finding in the shipped bundle. Real-world exposure is reduced by the app's posture (offline-first, single known API origin, no proxy config, no credentials in axios config), but the prototype-pollution gadgets are the material risk. | Upgrade `axios` to `>=1.16.0` (or current patched release) and re-run `npm audit`. Highest-value dependency action. |
| F-03 | **High** | 2. Dependencies | `yourwolf-frontend/package.json` (`vite`) | **Pre-existing** | `npm audit`: `vite <=6.4.2` — path traversal in optimized-deps `.map` handling; `server.fs.deny` bypass on Windows alternate paths; `launch-editor` NTLMv2 hash disclosure (Windows). | Dev-server only; not in the production bundle. Requires a reachable dev server. Windows-specific for two of the three. | Upgrade `vite` to a patched release (likely coupled to the F-01 vitest upgrade). |
| F-04 | Medium | 4. AuthN/AuthZ | `app/routers/roles.py`, `app/routers/games.py`, `app/routers/abilities.py` — every route depends only on `Depends(get_db)` | **Pre-existing** (out of diff scope) | No route declares any auth dependency. `grep -rnE "Depends\(\|current_user\|Security\(" app/routers/` returns only `Depends(get_db)`. `Role.creator_id` is accepted from the client payload (`role_service.py:37` — `creator_id=role_data.creator_id`) and is never verified against an authenticated principal. | All mutating endpoints (role create/update/delete, game create/start) are unauthenticated. `creator_id` is client-asserted and therefore spoofable. Mitigating: the product is an offline-first, locally-run facilitator, and AWS Cognito is explicitly roadmapped (`.env.example` reserves `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` for "Phase 4+"). | No action for this phase — this is a known, roadmapped architectural gap that the refactor correctly left alone. It **must** be closed before any multi-tenant or internet-exposed deployment. The verdict is not gated on it. |
| F-05 | Low | 10. Cross-cutting / test isolation | `tests/conftest.py:32-45` (`pytest_configure`) | **Introduced** (new pinning surface) | `pytest_configure` pins **only** `DATABASE_URL` and `ENVIRONMENT`. `Settings` (`app/config.py:16-19`) declares `env_file=".env"`, so any *other* `Settings` field resolves from the developer's ambient environment or on-disk `.env`. Today that is only `CORS_ORIGINS`. | **No credential path today** — the credential-bearing field (`DATABASE_URL`) is pinned unconditionally and pydantic-settings ranks env vars above `.env`, so an ambient developer `DATABASE_URL` genuinely cannot reach the suite. The gap is that the pinning is per-field allowlist rather than an env firewall: when the roadmapped `COGNITO_*` settings are added, they will silently inherit ambient values unless someone remembers to extend this hook. | Prefer pinning the whole surface over enumerating fields — e.g. set `model_config["env_file"] = None` for the test run, or pin every `Settings` field in `pytest_configure`. Add a regression test asserting the suite's resolved `DATABASE_URL` is the in-memory SQLite URL. |
| F-06 | Low | 9. Observability | `app/seed/roles.py:104, 106, 111, 115, 138, 158, 162, 230, 236, 288` | **Introduced** | Every `SeedDataError` message interpolates `path` — the absolute filesystem path of `roles.json` (e.g. `f"Seed data file not found: {path}"`). Raised at **import time** from module scope (`roles.py:300`). | Absolute-path disclosure. Reaches operator-facing startup logs / tracebacks only. **Never reaches an HTTP response**: `app/main.py` does not import `app.seed`, so this path cannot be triggered by a request. Deployment-path disclosure to whoever can already read the server's logs. | Accept, or log `path.name` instead of the full path. Low value; no user-facing exposure. |
| F-07 | Low | 7. Filesystem/runtime | `app/seed/roles.py:300` — `ROLES_DATA, ROLE_DEPENDENCIES_DATA = load_seed_data()` | **Introduced** | Module-scope call executes a file read + full validation as an import side effect. `DATA_FILE = Path(__file__).parent / "data" / "roles.json"` (`roles.py:25`). | **Path traversal is not reachable** — confirmed by tracing every call site: `DATA_FILE` is a `__file__`-relative constant; `load_seed_data(path=...)` is parameterized but the only non-default caller is the test suite. No request data, env var, CLI arg, or config value flows into `path`. The file is repo-controlled and trusted, and JSON parsing (`json.loads`) is not code execution. The residual concern is **availability, not confidentiality**: a corrupt/unreadable `roles.json` converts an import into a hard failure rather than a handled error. | Accept. The import-time validation is a deliberate design choice — it makes a bad data file fail loudly before any partial seed can be committed, which is the safer failure mode. Optionally make `load_seed_data()` lazy (`@cache`d accessor) to match the `get_settings`/`get_engine` pattern the phase established elsewhere. |
| F-08 | Low | 9. Observability | `app/seed/__init__.py:38` — `logger.error("Error during seeding: %s", e)` | **Pre-existing** (line unchanged; only `SessionLocal` → `get_session_factory()` on `:22`) | `sa_exc.SQLAlchemyError` stringification can embed the failing SQL statement and bound parameters. | SQL/parameter disclosure into operator logs during seeding failures. Data involved is non-sensitive official game-role content. Not request-reachable. | Accept, or log `type(e).__name__` with the detail at `DEBUG`. |
| F-09 | Low | 9. Observability | `app/database.py:26` — `echo=settings.ENVIRONMENT == "development"` | **Pre-existing** (behavior identical to baseline `database.py:14`) | SQLAlchemy `echo=True` logs every statement when `ENVIRONMENT == "development"`. | Full SQL logging in development. Gated on a non-production environment value; `Literal` type on `ENVIRONMENT` prevents typo'd values from silently enabling it in prod. | Accept. Correctly environment-gated. |

---

## Directed-Attention Assessment

The parent flagged seven areas for focused attention. Each is answered here against baseline `19b4520`.

### 1. `app/config.py` / `app/database.py` restructure — **No regression. Net improvement.**

`Settings` is byte-for-byte identical in field declarations, types, `env_file` config, and `cors_origins_list`
(`config.py:9-24` vs. baseline `:8-23`). The only change is `settings = Settings()` at module scope becoming
`@cache def get_settings()`.

`get_engine()` (`database.py:15-27`) constructs the engine with **identical** arguments to baseline
(`DATABASE_URL`, `pool_pre_ping=True`, `echo=<development>`). No new credential sink. No connection string is
logged, formatted, returned, or placed in an exception message anywhere in the diff — verified by grep across
`app/`.

**Improvement:** the credential is no longer resolved at import time. Baseline `app/config.py:26` executed
`Settings()` on import, meaning importing *any* app module — including `app.models.role` in a tooling or test
context — required and read `DATABASE_URL`, and would consult a developer's on-disk `.env` to do it. That
import-time coupling is gone, and `tests/test_database.py:100-110` locks it in by asserting a model imports
cleanly in a subprocess with `env={"PATH": "/usr/bin:/bin"}` — no `DATABASE_URL` present.

`alembic/env.py:18` changed only `settings.DATABASE_URL` → `get_settings().DATABASE_URL`. Same value, same sink.

### 2. `tests/conftest.py` env handling — **Hermetic for credentials. Confirmed.**

The final state (`conftest.py:43-45`) assigns `os.environ["DATABASE_URL"]` and `os.environ["ENVIRONMENT"]`
**unconditionally**, then calls `get_settings.cache_clear()`. This is equivalent in strength to the baseline's
module-level assignment (baseline `conftest.py:13-14`) and strictly stronger than the intermediate
`os.environ.setdefault` state the parent described — `setdefault` would have let an ambient developer
`DATABASE_URL` win. That transient regression is **not present at HEAD**.

Verified the ambient-credential path is genuinely closed:
- Unconditional assignment beats any ambient env var. ✅
- pydantic-settings precedence ranks env vars **above** `.env`, so an on-disk `.env` holding a real DSN cannot win. ✅
- The ordering hazard the baseline comment worried about is dissolved rather than worked around: nothing at
  conftest import time constructs `Settings` anymore (that was F-01's whole point), so `pytest_configure`
  running after conftest's module body is now harmless. ✅
- Every env value across the entire test suite is a SQLite URL — `grep -rn "setenv\|DATABASE_URL" tests/`
  returns only `sqlite:///:memory:`, `sqlite:///lazy.db`, `sqlite:///first.db`, `sqlite:///second.db`. No
  test can reach a real credential. ✅
- No test calls `delenv("DATABASE_URL")`. The one test that runs without it
  (`test_database.py:100-110`) does so in an isolated subprocess and never constructs `Settings`. ✅

Residual gap is **F-05** (Low): the pinning is a per-field allowlist, not an env firewall. Correct today,
fragile as `Settings` grows.

### 3. `app/exceptions.py` + `app/main.py` handlers — **No new leak. Net reduction in disclosure.**

Handler body (`main.py:38-39`) returns `{"detail": str(exc)}`. Every message reaching that sink is
author-controlled — all 15 raise sites were enumerated and inspected
(`role_service.py:216,270,328,378,382`; `game_setup_validation.py:54,67,75,80,86,93`;
`game_service.py:112,119,172`). All are hand-written prose or joined validation strings. **None** interpolates
a stack trace, SQL fragment, filesystem path, or connection detail. The strongest interpolation is a role name
the client itself supplied (`f"Role '{role.name}' is locked..."`).

**This is a disclosure *reduction*, not parity.** Baseline routers caught broad builtins and echoed them:
`except ValueError as e: raise HTTPException(400, detail=str(e))` (baseline `roles.py`, `create_role`/
`update_role`). That caught *any* `ValueError` — including incidental ones raised from deep inside SQLAlchemy,
pydantic, or the stdlib — and reflected their internals-bearing messages to the client at 400. After the
refactor only the explicitly-typed `DomainValidationError` is echoed; an incidental `ValueError` now falls
through to the generic 500 path. Confirmed no `except ValueError` / `except PermissionError` remains anywhere
in `app/` (the three `except ValueError` hits in `seed/roles.py` are enum-parsing at import time, not request
handling).

**Bare `DomainError` → 500 does not leak.** `DomainError` is absent from `_DOMAIN_ERROR_STATUS`
(`main.py:19-23`), so it reaches Starlette's `ServerErrorMiddleware`. `debug` is never enabled — `grep -rn
"debug=True\|DEBUG\|reload=True" app/` returns nothing — and Starlette's non-debug path emits a plain
`Internal Server Error` with no traceback. Confirmed safe.

The three `raise ValueError` in `app/schemas/role.py:81,87,93` are inside a pydantic `model_validator`;
pydantic converts them to a 422 with the authored message. Correct and intended.

### 4. `app/seed/data/roles.json` + import-time loader — **Path traversal not reachable. Low.**

Reasoning stated in full at **F-07**. In short: `DATA_FILE` is a `__file__`-relative constant; no untrusted
input reaches the `path` parameter (traced every call site — only tests pass a non-default); the file is
repo-controlled; `json.loads` is parsing, not execution. The loader's own validation
(`_parse_role`, `_parse_dependency`, `_require_keys`) is defense against a *malformed* trusted file, not
against an attacker. Residual issues are availability (F-07) and path disclosure in logs (F-06), both Low.

### 5. Validation tightening — **Hardening win. Nothing was loosened.**

Verified exhaustively via `git diff 19b4520..HEAD -- app/schemas/` filtered to every constraint token
(`Field|min_length|max_length|ge=|le=|gt=|lt=|pattern|max_items|constr`). The **complete** set of constraint
changes across the phase:

| Change | Direction |
|---|---|
| `RoleBase.name`: `min_length=1, max_length=100` → `min_length=2, max_length=50` | **Tightened** |
| `RoleUpdate.name`: `min_length=1, max_length=100` → `min_length=2, max_length=50` | **Tightened** |
| `AbilityStepInRole.modifier`: `str` → `StepModifier` | **Tightened** (enum now rejects arbitrary strings) |
| `AbilityStepCreateInRole.modifier`: `str = "none"` → `StepModifier = StepModifier.NONE` | **Tightened** |

**Nothing was loosened.** The `AbilityStepCreate` / `AbilityStepRead` removals from `app/schemas/__init__.py`
are dead-code deletion, not constraint relaxation.

`create_role` (`role_service.py:214-216`) now runs the full `validate_role` rule set and raises
`DomainValidationError` on any violation. This closes a real **create/validate divergence**: baseline
`create_role` did not invoke `validate_role`, so a payload that `POST /roles/validate` rejected could still be
accepted by `POST /roles`. That is the most substantive security improvement in the phase.

Authorization guards were compared line-by-line against baseline and are **preserved 1:1** — same conditions,
same order, same resulting status (`is_locked` → 403, `Visibility.OFFICIAL` delete → 403; baseline
`PermissionError` → 403 became `LockedError` → 403). No guard was weakened, reordered, or dropped.

### 6. `yourwolf-frontend/src/api/errors.ts` — **Cannot render unsafely. No internals surfaced.**

- **No XSS sink exists.** `grep -rnE "dangerouslySetInnerHTML|\.innerHTML|eval\(|new Function"` across the
  **entire** `yourwolf-frontend/src` tree returns **zero** matches. The sole consumer
  (`pages/RoleBuilder.tsx:49`) routes the result into `setValidation({errors: serverErrors ?? [...]})`, which
  React renders as escaped text children. Server-controlled strings cannot become markup.
- **Return type is a hard boundary.** `extractApiErrorMessages` returns `string[] | null` and constructs each
  string from `detail.msg` / `detail.loc` only (`errors.ts:37-45`). Non-string, non-array `detail` shapes →
  `null` (`errors.ts:77`). Objects are never spread into output.
- **No internals surfaced.** It returns `null` for network failures, 5xx, and unrecognized bodies
  (`errors.ts:54-58, 77`) — precisely the responses most likely to carry internals — leaving the caller to
  supply a generic fallback (`RoleBuilder.tsx:52`, `'Validation service unavailable'`). The only content it
  surfaces is authored domain prose (per §3 above) and pydantic 422 field messages. The `loc.slice(1)` at
  `errors.ts:43` deliberately drops the request-part prefix, leaving only a field path.
- No `localStorage`/`sessionStorage` use anywhere in `src` — no token-storage surface.

### 7. `eslint.config.js` — react-hooks plugin. **Modest indirect security value.**

`eslint-plugin-react-hooks@5.2.0` added as a `devDependency` (`package.json:36`). The config comment records
that an `eslint-disable react-hooks/exhaustive-deps` existed in `src/hooks/useRoles.ts` while the plugin was
absent — the disable was inert and the rules were unenforced repo-wide.

Security-relevant implication is **indirect but real**: `exhaustive-deps` violations cause stale closures, and
stale closures over auth/session state are a recognized source of authorization bugs (a component acting on a
previous user's or previous permission's captured value). YourWolf has no auth state today, so there is no
live exposure — the value is preventative, and lands ahead of the roadmapped Cognito work. `rules-of-hooks`
violations are correctness/crash bugs rather than security bugs.

The config also promotes `exhaustive-deps` from warning to `error` so the gate does not depend on the
`--max-warnings 0` CLI flag surviving future edits — a defensible durability choice. The new import-boundary
rules (`no-restricted-imports` for `src/domain`/`src/engine`) are architectural, not security.

**Supply chain:** the plugin is the phase's **only** new dependency. `package-lock.json` is purely additive
(+14 lines, 0 deletions), pinned to `5.2.0` with an integrity hash, and carries **no advisories**. `axios`
remained at `^1.6.5` — unchanged. Clean.

---

## Hardening Wins (phase-introduced)

Recorded because a security scan that reports only findings misrepresents this diff.

| # | Win | Evidence |
|---|---|---|
| H-1 | **Create/validate divergence closed.** `create_role` now enforces the full `validate_role` rule set; payloads rejected by `POST /roles/validate` can no longer be accepted by `POST /roles`. | `role_service.py:214-216` |
| H-2 | **Error-disclosure surface reduced.** Broad `except ValueError → detail=str(e)` removed from routers. Incidental library/stdlib exception messages are no longer reflected to clients at 400; only authored domain messages are echoed. | `roles.py` diff vs. baseline; `main.py:19-23,38-39` |
| H-3 | **Input surface tightened, nothing loosened.** Role-name bounds 1–100 → 2–50; `modifier` `str` → `StepModifier` enum (arbitrary strings now rejected at the schema boundary). | `schemas/role.py:63,111,121` |
| H-4 | **Import-time credential resolution eliminated.** Importing app modules no longer requires or reads `DATABASE_URL`, removing an import-order coupling that the baseline test suite had to defend against with a module-level `os.environ` hack. Locked in by a regression test. | `config.py:27-37`; `database.py:15-37`; `tests/test_database.py:100-110` |
| H-5 | **Previously-inert lint rules now enforced.** `rules-of-hooks` and `exhaustive-deps` go from unenforced repo-wide to blocking. | `eslint.config.js` |

---

## No-Finding Categories

**Fully assessed at diff scope, no supported findings:**

- **1. Secrets and credentials.** No secret, credential, private key, token, or DSN-with-credentials in any of
  the 173 diff-scoped files. All regex hits were false positives (`css-tokenizer`/`js-tokens` package names in
  `package-lock.json`; the word "token" in a test title). No `.env` is tracked — only `.env.example` files,
  and `.env`/`.envrc` are gitignored (`yourwolf-backend/.gitignore:138-139`). *(Observation, out of diff scope:
  `yourwolf-backend/.env.example` carries a placeholder local-compose DSN. It is a documented example, is
  unchanged by this phase, and its value is a well-known local dev placeholder — not a live credential.)*
- **3. Application attack surface and injection.** No SQL injection: all queries are SQLAlchemy ORM with bound
  parameters; the only `text()` call is a static `SELECT 1` liveness probe in the unchanged
  `app/routers/health.py:37`. No `eval`, `new Function`, `subprocess`, `os.system`, `pickle`, or `yaml.load` in
  application code. No XSS sink in the frontend.
- **5. Data protection and cryptography.** Credential handling is behavior-identical to baseline with the
  import-time resolution removed (H-4). No connection string is logged or exposed.
- **6. API and input-boundary defenses.** Every constraint change is a tightening (§5). Pagination arithmetic
  in `app/services/pagination.py` is a pure refactor of duplicated `count → ceil → offset` logic with no bound
  changes.

**Not fully assessed, with reason:**

- **2. Dependencies — Python side.** `pip-audit`, `safety`, and `bandit` are all unavailable in this
  environment, and the role forbids installing tooling solely to run a scan. Mitigating: `requirements.txt` /
  `pyproject.toml` / `poetry.lock` are **unchanged** by the diff, so the Python supply chain is out of diff
  scope regardless. **This is the single largest confidence gap in this report.** A full-repo scan with
  `pip-audit` available should be run before production release.
- **4. AuthN / authZ / session.** Only partially assessable — there is no authentication layer to assess (F-04).
  The lock/official guards were the only authorization controls in scope and were verified unchanged.
- **8. Infrastructure, CI/CD, deployment.** **Zero** infra, CI/CD, container, or IaC artifacts appear in the
  diff. Entirely out of diff scope; not assessed. Requires a full-repo scan.
- **9. Observability.** Only diff-scoped log sites reviewed. No runtime log output was inspected.
- **Git history.** Not scanned for secrets (no `gitleaks`/`trufflehog`; history before `19b4520` out of scope).

---

## Cross-Cutting Risks

1. **The phase's security posture is sound; the repository's dependency posture is not.** Every Critical/High
   finding in this report is a pre-existing npm advisory. The refactor itself is clean. Do not let the
   dependency backlog obscure that, and do not let the clean refactor obscure the dependency backlog — they
   need separate remediation tracks.
2. **Dev-vs-prod exposure asymmetry.** Of the three Critical/High dependency findings, only **F-02 (axios)**
   is in the shipped bundle. F-01 (vitest) and F-03 (vite) are `devDependencies`, materially reducing real
   exposure — but they still run on developer machines and in CI, which are themselves targets.
3. **Config hermeticity is enumerated, not enforced (F-05).** The test suite pins `DATABASE_URL` and
   `ENVIRONMENT` by name. This is correct today because those are the only sensitive fields. When the
   roadmapped `COGNITO_*` settings land, they will silently inherit ambient developer values unless someone
   remembers this hook. The pattern will not scale with `Settings`.
4. **The refactor prepared the ground for auth without adding it.** Lazy settings (H-4), the typed error
   vocabulary (H-2), and enforced hooks lint (H-5) all reduce friction for the Phase 4+ Cognito work. F-04
   remains the dominant architectural gap and must be closed before any internet-exposed deployment.
5. **`creator_id` is client-asserted.** Benign while unauthenticated, but it becomes a privilege-escalation
   vector the moment auth exists unless it is bound to the authenticated principal at that time.

---

## Priority Remediation Order

| # | Action | Severity | Blocks this phase? |
|---|---|---|---|
| 1 | Upgrade `axios` to `>=1.16.0`. Only High in the production bundle. | High (F-02) | **No** — pre-existing |
| 2 | Upgrade `vitest` + `@vitest/coverage-v8` + `vite` to patched majors (likely one coordinated bump). | Critical (F-01), High (F-03) | **No** — pre-existing, dev-only |
| 3 | Run a full-repo scan with `pip-audit` available to close the Python supply-chain gap. | Unknown | **No** — but required before production release |
| 4 | Bind `creator_id` to an authenticated principal; add auth to mutating routes. | Medium (F-04) | **No** — roadmapped Phase 4+ |
| 5 | Make test config hermeticity structural (`env_file = None` under test) rather than a per-field allowlist. | Low (F-05) | **No** |
| 6 | Optional polish: log `path.name` in `SeedDataError` (F-06); make `load_seed_data()` lazy (F-07). | Low | **No** |

**Nothing in this list blocks the refactor-audit phase.** Items 1–3 are release-gate items for the repository
that predate this branch.

---

## Residual Risk and Exceptions

**Accepted for this phase:**

- **F-01 / F-02 / F-03** — pre-existing dependency vulnerabilities. Out of the phase's remit (a pure
  structural refactor); dependency bumps would expand the diff and risk the refactor's behavior-preservation
  guarantee. Tracked for the release gate.
- **F-04** — no authentication. Deliberate, roadmapped (Cognito, Phase 4+), consistent with the product's
  offline-first single-user posture today.
- **F-06 / F-08 / F-09** — operator-log disclosure (absolute path, SQL-on-seed-error, dev SQL echo). None is
  request-reachable; all require prior log access; F-09 is correctly environment-gated.
- **F-07** — import-time seed load. Availability trade-off deliberately chosen in favor of fail-loud-before-
  partial-seed. Path traversal not reachable.

**Explicit limitations on this report's confidence:**

1. **This is a diff-scoped scan, not the full-repository phase gate the security-scan role normally performs.**
   It answers "did this refactor regress security" — not "is this repository secure". **A clean verdict here
   is not a statement that the repository is free of security issues.**
2. **Python dependencies were not scanned** (no `pip-audit`/`safety`/`bandit`; installing them is out of
   bounds). Largest single confidence gap. Mitigated only by the fact that Python dep manifests are unchanged.
3. **Infrastructure, CI/CD, and deployment configuration were not assessed at all** — no such artifact is in
   the diff.
4. **Git history was not scanned for secrets.** Only the working tree at diff scope was pattern-matched.
5. **No dynamic testing.** All conclusions are from static review and baseline comparison. No DAST, fuzzing,
   penetration testing, or runtime observation was performed.
6. **Secret detection is regex-based**, not entropy-based. A high-entropy secret not matching a keyword
   pattern would not be caught.

**Before production release, run a full-repository security scan with Python dependency tooling and
infrastructure artifacts in scope.**
