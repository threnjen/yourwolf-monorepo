# Review Learnings

Durable, reusable review rules distilled from past feature reviews. No dates, no feature-specific references.

## Test bootstrap must be hermetic, not merely present

**Pattern:** A refactor replaces an explicit test-environment assignment (`os.environ["X"] = ...`) with a "safer-looking" conditional one (`os.environ.setdefault("X", ...)`, `if "X" not in os.environ`, `os.getenv("X", default)`). The suite still passes, so the change reads as harmless.

**Impact:** The test suite's configuration now depends on the developer's or CI runner's ambient environment. It stays invisible while every test mocks the resource, then bites the first time a test exercises the real one — at which point the suite may silently read from or write to a dev/staging database instead of the test fixture. Silent, environment-dependent, and hard to reproduce.

**Watch for:** Any `setdefault`/`getenv`-with-default in `conftest.py`, test setup hooks, or test harness bootstrap. Test bootstrap should assign unconditionally; per-test variation belongs in `monkeypatch.setenv` + explicit cache invalidation. Ask "would this suite behave differently on a developer machine with the production env exported?" — if yes, it is not hermetic.

## Deleting a global is safer than aliasing it — but only if the grep is exhaustive

**Pattern:** Removing import-time globals (`settings`, `engine`, `SessionLocal`, singletons) in favor of lazy accessors. The implementer chooses between deleting the old name and keeping a lazy compat alias.

**Impact:** Deletion is usually correct — a missed call site fails loudly at import instead of silently receiving a stale or half-initialized global. But the safety depends entirely on the migration being complete, and import-time failures in a shared tree can transiently break *other* agents' or developers' work.

**Watch for:** Verify the grep yourself; do not accept "verified zero references" from the record. Search beyond `.py`/source files — alembic env, seed/CLI entry points, `__main__` modules, Dockerfiles, CI config, and docs. Confirm the compat re-exports that *were* kept have a live consumer, or they are dead code.

## `functools.cache` on a resource factory: judge the race by what the constructor touches

**Pattern:** `@cache` on `get_engine()` / `get_client()` / `get_pool()` permits two threads to run the body concurrently on first use; one result wins, the other is discarded. A spec saying "created exactly once" makes this look like a violation.

**Impact:** Usually benign, occasionally not. It is benign when the constructor is pure and connectionless (e.g., SQLAlchemy `create_engine` opens no sockets) — the loser is inert garbage and the single-instance invariant still holds for every caller. It is a real bug when the constructor opens connections, spawns threads, acquires file locks, registers callbacks, or increments external state — then the discarded object leaks a live resource.

**Watch for:** Do not reflexively demand a lock. Ask what the constructor actually does. Reserve the fix for constructors with side effects; adding synchronization to a pure factory is complexity for no behavior change.

## Documentation that names a module's exports rots silently

**Pattern:** Architecture/context docs enumerate a module's public names ("`database.py` — engine, SessionLocal, Base, get_db"). A refactor renames or removes those names; source, tests, and lint all pass.

**Impact:** No test covers prose. The drift persists indefinitely and is especially costly when the doc is loaded as context by AI agents or used for onboarding — it actively teaches an API that no longer exists.

**Watch for:** After any change to a module's public surface, grep docs (`*.md`) for the removed names. If the doc is outside the change's scope or shared with concurrent work, record it as an explicit open issue with the correct replacement text rather than dropping it.

## Distinguish "the record says it works" from "I saw it work"

**Pattern:** An implementation record documents smoke evidence — boot logs, endpoint responses, manual runs — for acceptance criteria that unit tests cannot cover.

**Impact:** Static review confirms that references resolve, not that behavior was observed. Approving a runtime AC on the strength of someone else's transcript converts a claim into a verified fact without evidence.

**Watch for:** For any AC requiring execution, runtime, or visual confirmation, re-run it yourself when it is cheap (booting an app against SQLite, a stripped-env subprocess import, hitting an endpoint with a test client). When it is genuinely not reproducible in the review environment, mark the AC unverified and name the specific check needed — do not mark it met.

## A workaround that removes the documented fragility is a fix, not a workaround

**Pattern:** A plan prescribes mechanism A (e.g., dependency-injection override); the implementer uses mechanism B (e.g., a lifecycle hook) and flags the deviation for review, worrying it masks the coupling the work set out to remove.

**Impact:** Deviations self-flagged as suspect attract reflexive rejection. But the test is not "did it match the plan's example" — it is "does it eliminate the failure mode the AC names, and does the AC's own wording permit it".

**Watch for:** Read the AC's intent and its parenthetical examples ("e.g., ...") as illustrative, not exhaustive. Check the framework's actual lifecycle ordering rather than assuming. If the original fragility was positional/order-dependent and the replacement is guaranteed-ordered by the framework, the AC is satisfied — record the residual coupling separately if it is out of scope.

## A stated behavior-change rationale is a claim — verify the before-state, not just the after

**Pattern:** A plan or implementation record justifies a change by describing the old behavior ("previously returned a 500 from an unwrapped exception", "used to crash", "silently swallowed the error"). The new behavior is tested and correct, so the rationale is read as established fact and never checked. The description then propagates verbatim into the commit message, the record, and test docstrings.

**Impact:** The code can be right while the rationale is wrong, and the rationale is what everyone downstream uses to size risk. Framing matters asymmetrically: "500 → 422" implies no client could reasonably have depended on the old behavior, so the change reads as a pure freebie. If the truth is "400 → 422", it is a real contract change — the status code *and* often the response-body shape move — and consumers may have been handling it. A wrong premise that flatters the change is the one least likely to be challenged.

**Watch for:** When a record claims an unhandled exception reached the client, trace the actual handler chain — routers, framework error handlers, and middleware routinely catch broad exception types (`except ValueError` → 400) and convert them well before they become a 500. Confirm the exception type the old path really raised, then confirm nothing catches it. Where the before-state is cheap to establish (a parent-commit read, a one-line probe of the exception type, a grep for `except`), establish it rather than inheriting the claim. Then check the *corrected* contract change against consumers and existing tests — the answer may still be "safe", but it must be reached from the real premise. Correct the wording everywhere it was copied, docstrings included.

## De-duplication converts private copies into shared mutable singletons

**Pattern:** A refactor collapses duplicated constants/arrays/objects from several modules into one shared export. Each consumer previously owned a private copy, so an in-place mutation (`.sort()`, `.push()`, `.reverse()`, index assignment, nested-object edit) was contained. After consolidation every consumer shares one object, and one mutation corrupts all of them — including nested arrays handed out by accessors (`CONSTANTS.find(...)?.items` returns the shared inner reference, not a copy).

**Impact:** Cross-module action-at-a-distance bugs that are non-deterministic, order-dependent, and hard to trace back to the refactor that enabled them. Typically dormant for a long time, then triggered by an unrelated feature adding a `.sort()`. The DRY change that created the hazard looks like a pure improvement in review.

**Watch for:** Any "define it once" consolidation of exported *data* (as opposed to functions). Check whether the consolidated export is typed mutable (`T[]`, mutable interface fields), and check nested structures too — a `readonly Outer[]` whose elements hold a mutable `inner: string[]` is still exposed. Verify every consumer is read-only, then pin the contract with `readonly`/`as const` rather than relying on nobody ever mutating it. The type-level fix costs nothing at runtime; the bug it prevents is expensive.

## Derivation tests that compare a value to its own source cannot fail

**Pattern:** When `B` is derived from `A` by direct aliasing (`export const B = A`), a test asserting `expect(B).toEqual([...A])` is a tautology — it holds by reference identity no matter how wrong `A` is. The test name usually claims to verify the derivation ("derives B to cover exactly A"), which is precisely what it does not do.

**Impact:** An AC whose headline claim is "single source of truth" appears covered while nothing guards the values. The gap surfaces only when someone changes the source and no test complains.

**Watch for:** Tests importing both a source constant and its derivative and comparing them. Ask the blunt question: *can this assertion fail?* Real coverage requires pinning at least one side against an independent literal, or asserting the structural property that matters (key coverage, ordering, exhaustiveness). Aliasing derivations are best guarded by the type system (`Record<Union, T>` for exhaustiveness) plus one literal pin — not by comparing the alias to itself.

## A lint disable for a rule whose plugin was never registered

**Pattern:** An `eslint-disable-next-line <plugin>/<rule>` (or equivalent suppression in any linter) exists for a plugin that is not installed and not registered in the config. The suppression comment is the *only* evidence anyone believed the rule was running. The linter emits `Definition for rule '...' was not found`, which reads like a cosmetic config nit.

**Impact:** Silent, repo-wide loss of enforcement — and the blast radius is the whole plugin, not the one rule named in the comment. Developers write suppressions in good faith believing a rule caught something real, while every other file goes unchecked. Enabling the plugin later surfaces a backlog of accumulated genuine violations, so the "one-line fix" is not one line.

**Watch for:** Treat any "rule definition not found" as a coverage question, not a formatting one. Trace it: is the plugin in the manifest? installed? registered in the config? Then enumerate what *else* that plugin would have enforced and size the remediation honestly. A suppression comment is evidence of intent, never evidence of enforcement.

## Config-based guarantees must be probed, not read

**Pattern:** Enforcement mechanisms defined in configuration — lint rules, import boundaries, layer restrictions — are reported as verified because the config text reads correctly. Glob `files:` scoping, plugin registration order, and pattern syntax all fail in ways that reading does not reveal. (Related to "the record says it works" vs "I saw it work", but the failure here is that the mechanism never matches anything, not that behavior differs.)

**Impact:** An AC claiming an enforcement mechanism is active gets marked met while the rule silently matches nothing. Absence of errors is indistinguishable from absence of enforcement, so this never self-corrects.

**Watch for:** Confirm enforcement empirically — write a throwaway file that deliberately violates each restricted category, lint it, confirm each one fires, then delete it. A rule never observed rejecting anything has not been verified. Note also that string-pattern import restrictions match the raw import *specifier*, not the resolved module: they catch relative imports at any depth but are silently defeated by path aliases (`@/api/...`) or re-export barrels in permitted layers. If no aliases exist today, record the coupling — adding aliases later must extend the patterns in the same change.

## Exemptions must be self-cleaning

**Pattern:** A known violation is deferred to a later feature and exempted with a lint suppression. The exemption is only safe if it is (a) line-scoped rather than file-scoped, (b) names the specific rule rather than blanket-disabling, (c) names the owning feature/ticket in an adjacent TODO with the intended remedy, and (d) runs under `--report-unused-disable-directives` (or the linter's equivalent) so that removing the violation while leaving the directive fails the build.

**Impact:** Without (d) especially, exemptions outlive the problem they documented and become permanent invisible holes. Without (a)/(b), the exemption also suppresses future unrelated violations on the same file — the hole widens over time with nobody deciding that it should.

**Watch for:** Grade every deferred-violation exemption against all four properties. An exemption that cannot rot is a legitimate engineering tool and should be approved without friction; one that can rot is technical debt wearing a comment as a disguise.

## A plan-cited regression anchor may not exist

**Pattern:** A plan names an existing test as the regression anchor for its riskiest change ("`test_x.py` 404-vs-400 cases are the regression anchor for AC3"). The named file exists and the named endpoint appears in it — but only as happy-path *setup*, with nothing asserting the behavior the anchor is supposed to pin. The claim survives into the context doc and the AC traceability matrix by citation, never by verification.

**Impact:** The central change of the feature ships with zero coverage, while every artifact says it is covered. Worse than an acknowledged gap: the false citation actively suppresses the instinct to write the test. Downstream features that inherit the claim compound it.

**Watch for:** Never accept a cited anchor by filename. Open the baseline (`git show <base>:<path>`) and grep for an *assertion* on the specific contract — the endpoint merely appearing is not coverage. When an implementer reports that a planned anchor was fictional, verify both halves independently: that it was genuinely absent before, and that the replacement actually pins the distinction rather than restating post-change behavior. A characterization test written *after* a migration is only valid if its expected values were derived from the baseline.

## An identifier that reads like one status but whose contract is another

**Pattern:** A raise site is named or worded like one error category ("Unknown role IDs", "missing X") while its live HTTP contract is a different one (400, not 404). During a migration to typed exceptions, classifying it by what the *name* implies silently changes a production status code — and every service-level test still passes, because they assert on the exception type and message, not the status.

**Impact:** A wrong-status regression that no test in the suite can see. Service tests are type-and-message assertions; only an HTTP-level test would catch it, and that layer is exactly where coverage is thinnest.

**Watch for:** In any refactor that replaces prose/heuristic routing with typed dispatch, re-derive the mapping per-site from the baseline by tracing each raise through its *actual* caller's handler — do not accept the implementer's classification table, and do not classify by semantics. Sites where the name and the contract disagree are where the defect will be. Confirm each such site has an HTTP-level pin before approving.

## Removing a heuristic catch also narrows what it incidentally caught

**Pattern:** A broad `except ValueError` (or equivalent) wrapped around a service call was routing domain errors *and*, incidentally, any library exception subclassing the same builtin — `pydantic.ValidationError` is a `ValueError`. Replacing it with typed dispatch narrows this silently: what was a 400 becomes a 500.

**Impact:** Usually correct and desirable — an internal library error should not be blamed on the client. But it is a real contract change on paths nobody enumerated, and it lands undocumented because the diff only shows domain exceptions being handled.

**Watch for:** When a broad builtin catch is removed, ask what *else* subclassed that builtin and could surface from inside the try block. Decide explicitly whether the narrowing is intended, and record it as a documented deviation rather than letting it be an accident. Green tests prove nothing here — these paths are unreachable in practice, which is precisely why they are undocumented.

## "No import-time side effects" is a claim about resources, not about code executing

**Pattern:** A codebase establishes a direction — construct settings/engines/clients lazily, remove import-time globals. A later feature adds *something* at module scope (reading a bundled data file, building a lookup table, compiling a regex) and it gets flagged as regressing that direction by pattern-match on "work at import".

**Impact:** Both errors are costly. Reflexively rejecting it produces a lazy accessor that buys nothing, adds indirection, and often *defers* a failure the eager version caught earlier. Reflexively accepting it lets genuinely environment-dependent work back in, one plausible exception at a time.

**Watch for:** Do not adjudicate on "does code run at import" — enum classes, ORM declarative models, and settings classes all run at import; the rule as literally stated is unsatisfiable. Adjudicate on what the work *touches*: ambient environment, network, database, filesystem outside the package, mutable global state. A file shipped adjacent to the module (`Path(__file__).parent / ...`) is part of the package — reading it is nearer to parsing a literal than to opening a socket, and it fails identically in every environment. Settle it empirically: run the import under a stripped environment (`env -i`) and check whether the original invariant still holds; check whether the app's boot path even imports the module (`sys.modules` after importing the entrypoint). Also check what the code did *before* — if a literal was already built at import and a malformed one raised at import, preserving that is behavior preservation, not regression. Then record the precedent with its *actual* boundary, so it is not later cited to justify import-time work that does touch env or network.

## A validating loader's guarantee stops where its callers' `[...]` begin

**Pattern:** Data moves out of code into a data file behind a loader that validates "exhaustively" — file present, JSON well-formed, enum values known, cross-references resolve. The validation covers exactly the categories someone enumerated, while the consumer indexes a dozen fields with `data["field"]` that the loader never checked. The shipped file is valid, so every test passes and the gap is invisible.

**Impact:** The loader's entire purpose is to convert malformed data into one clear error before any side effects. A field it does not check becomes a raw `KeyError` (or `AttributeError` on a non-dict entry) thrown *part-way through* the consumer's loop, after writes have begun — precisely the partial-failure the loader was introduced to prevent. An "exhaustive validation" docstring makes it worse: it is load-bearing documentation that is false, so the next person extends the data file trusting a guarantee that does not exist.

**Watch for:** Derive the required-field set from the *consumer*, not from the loader — grep the seeding/consuming function for direct `[...]` subscripts and contrast with `.get(k, default)` calls; the former are mandatory, the latter genuinely optional (and their *absence* may be semantically load-bearing, so normalizing them changes behavior). Then probe negatively: feed the loader an entry missing each required field, a non-dict entry, and a scalar where a list is expected, and confirm every case raises the loader's own error type rather than leaking `KeyError`/`AttributeError`. Validating that a container is a list is not validating its elements. Never accept "validation is exhaustive" from a docstring — it is a testable claim, so test it.

## Reference identity is load-bearing behavior when extracting pure functions out of React

**Pattern:** React state reducers and event handlers signal "nothing happened" structurally, not explicitly — `setState(prev => prev)` (React bails out of the re-render) or a bare `return;` before `onChange(...)` (no callback fires). When those bodies are lifted into a pure domain module, the natural pure-function instinct is to always return a fresh object/array. That instinct is a behavior change: every rejected no-op now triggers a re-render, and every guarded early-return now fires a spurious callback with a new object. Nothing in a typical suite catches it — the *values* are all still correct, so `toEqual` assertions stay green.

**Impact:** Silent render-loop and callback-storm regressions that pass every test, then surface as performance problems or duplicate side effects far from the refactor. Worse in a staged port: if the extracted module is the contract a later engine consumes, the drift is inherited before anyone notices.

**Watch for:** Enumerate *every* no-op path in the baseline (`return prev`, bare `return`, rejected guards) and confirm the extracted function returns the **input reference**, not an equal copy. Then confirm the caller still checks it — a pure function that correctly returns `prev` is useless if the component unconditionally calls `onChange` with the result. Demand `toBe()` reference assertions, not `toEqual()`; `toEqual` cannot distinguish the two and its passing is not evidence. Note the asymmetry is often intentional: a sibling function may legitimately always return a new object because the baseline did too — mirror the baseline per-path rather than imposing one rule across the module.

## A documented quirk with no test pinning it is an invitation to "fix" it

**Pattern:** An extraction carefully documents a surprising behavior in a docstring — "the cascade is one-way and single-level", "deliberately does not renumber" — and the prose is accurate. But no test asserts it. The docstring is the only artifact holding the behavior in place.

**Impact:** Strictly more dangerous than an undocumented quirk. Undocumented quirks get preserved by copy-paste inertia; *documented* ones read as a rationale a future implementer can disagree with. A downstream author porting the module sees "single-level cascade leaves a transitive dependent orphaned", reasonably concludes it is a bug, makes the cascade transitive — and every test still passes. The comment that was meant to protect the behavior is what licensed changing it.

**Watch for:** For each behavioral claim in a new domain module's docstrings, grep the test file for an assertion pinning it. Where missing, add the test *and* say in a comment why it is pinned, so the next reader knows a change is a conscious decision rather than a cleanup. Derive the expected value by executing the baseline, never by reading the new implementation — a test written from the implementation pins whatever it currently does, including the drift you are checking for. This is the cheapest fix available at review time: pure test addition, zero behavior risk, and it converts prose into a gate.
