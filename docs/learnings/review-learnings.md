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

## An unmodified regression anchor is evidence only for the behavior it actually exercises

**Pattern:** A refactor keeps its big pre-existing test file byte-for-byte unmodified and offers "the anchor still passes" as proof of zero drift. The claim is seductive because it is cheap to verify (compare blob hashes) and feels airtight. But an anchor is only evidence for contracts it *covers*. Component splits routinely carry load-bearing guards that the anchor never touched — most dangerously guards behind a `disabled` control, which no DOM-driven test can reach *by construction*: the UI correctly prevents the interaction, so the handler's own defensive check is never invoked, and its deletion is invisible to every rendering test.

**Impact:** The strongest-looking evidence in the review is silently scoped to rendered behavior, while the subtlest contract — reference identity, an early-return guard, an idempotence check — sits entirely outside it. Reviewers stop at "anchor green" and ship a suite that would stay green if the guard were deleted outright. The guard then reads as dead code to the next person, gets removed as cleanup, and the regression lands with a clean CI.

**Watch for:** Never accept a passing anchor as proof of a specific contract without asking *which test would fail if this were broken*. Answer it by mutation, not inspection: delete the guard, run the suite, and observe. If everything passes, the contract is unpinned regardless of how green the board is — that is a finding even when the implementer preserved the code correctly, because the safety net, not the code, is the defect. Watch specifically for guards paired with a `disabled`/`readonly`/`hidden` UI affordance: the affordance makes the guard unreachable through the DOM, so pin it at the seam instead (mock the child, capture the callback props, invoke the intent directly). Assert both directions — zero calls on the no-op path *and* exactly one call on the real path — or a test that never fires the callback at all will pass vacuously.

## Verify a lint/boundary rule fires on new files, rather than inferring it from config plus a clean run

**Pattern:** A feature adds files under a directory an architectural rule already governs (`no-restricted-imports`, layer boundaries, naming), and evidence offered is "the config has the rule" plus "lint is clean." Both can be true while the rule does not actually apply to the new files — a `files:` glob that does not match, a specifier shape the pattern misses (aliases vs. relative paths), or an override later in the config array silently relaxing it.

**Impact:** The boundary is believed enforced and is not. This fails open and stays quiet: nothing warns you that a rule matched zero files, so the architectural constraint the earlier feature paid for quietly stops applying exactly where new code is being added.

**Watch for:** A clean lint run on a file proves the file has no violations — not that the rule would catch one. These are different claims and only the second is what the AC asserts. Prove it positively: inject the forbidden import into the new file, confirm the rule fires with the expected message, then revert. Cheap, decisive, and it distinguishes "compliant" from "protected."

## A tightening is only a breaking change if a client can reach the tightened path

**Pattern:** A refactor wires a stricter rule set into a write endpoint, and the blast radius looks alarming: existing tests fail, payloads that used to be accepted now 400, and the implementation record flags it for sign-off. The reflex — reinforced when the review brief pre-classifies it as High — is to confirm it as a client-breaking regression. But the same rule set was frequently *already* enforced on a dry-run/validate endpoint that the only real client calls first and gates submission on. In that case the tightening changes nothing a client can observe; it closes a hole the UI was politely declining to walk through.

**Impact:** Both errors are expensive. Rating it High triggers a rollback or a scope fight over a change that is correct and net-positive hardening. Waving it through on the author's "no known client" assurance ships a real 400 to a real user. Severity here is not a judgment call — it is a reachability question with a definite answer, and answering it takes minutes.

**Watch for:** Trace the client end-to-end before assigning severity, and demand three specific facts: (1) does the client build the create payload and the validate payload with the **same** function (a shared `draftToPayload` means the two endpoints see identical bodies by construction, so they cannot disagree about a payload); (2) is submission **gated** on the validate result (`disabled={!validation?.is_valid}`) — find the actual JSX prop, not the handler, since handlers are often unconditional; (3) did the validate rule **pre-date** the change (check the baseline, not HEAD). All three yes ⇒ defense-in-depth, not a regression, and say so plainly rather than manufacturing a finding to look rigorous. Any one no ⇒ real contract change. Then check the *other* direction, which this analysis tends to miss: tightening a **schema** bound converts a friendly `200 {is_valid: false, errors: [...]}` into a `422` that an axios/fetch client throws on, so a client that renders the error list degrades to a generic "service unavailable" message. The write path is safe and the read-back path silently regresses — grep the client's validate error branch, not just its submit branch.

## "Same rule set, two reporting modes" is only safe if the rule set has one tier

**Pattern:** A service exposes `validate_x() -> list[str]` (dry-run, returns errors) and `create_x()` (raises). Consolidating them so create cannot accept what validate rejects is a standard, correct fix. The failure mode is when the validator quietly mixes tiers — hard rejections alongside advisory/should-warn items — so wiring create to the whole list makes create raise on advice. The tell is a sibling `get_warnings()`: its existence *suggests* the tiers are separated, but does not prove the separation is clean.

**Impact:** Getting this wrong in either direction is bad. Wire in a mixed list and create starts rejecting valid-but-unusual payloads on advice. Refuse to wire it because "some of these look advisory" and the consolidation's entire goal — the two endpoints can never disagree — is unmet by construction, which is worse than not doing it, since the docstring now claims a guarantee that does not hold.

**Watch for:** Do not infer the tiering from rule *names* or from vibes about which rules "feel" advisory. Read the endpoint that consumes the validator and find where the boolean comes from — `is_valid=len(errors) == 0` means every entry in that list is, by the API's own contract, a hard rejection, and create must raise on all of them or the goal is unmet. Confirm the advisory channel is genuinely separate: grep that `get_warnings` is not called from the create path and is not merged into `errors`. If a single function does mix tiers, the fix is to split the function, never to have create honor a subset — a subset is unauditable and drifts immediately.

## A correct change can carry a false diagnosis — test the rationale, not just the outcome

**Pattern:** An implementer swaps a rule/config/API for a stricter-looking equivalent and explains it causally: "we moved to X because the old Y couldn't catch Z." The swap works, the gate is green, and the reviewer confirms the *outcome* (the rule fires) and stops. But the stated cause is often reverse-engineered after the fact, and the real cause was something duller sitting in the same diff — a missing entry in a list, a glob that never matched. The tell is when an earlier feature's reviewer already named the real cause in plain language ("the rule deliberately does not restrict `types`") and the new rationale quietly contradicts it without acknowledging the disagreement.

**Impact:** Asymmetric and easy to under-rate. The code is fine, so nothing breaks and no test catches it — which is exactly why it survives. What ships is a *comment* asserting a false property of a tool ("the base rule can't see `import type`"). That comment is now the repo's institutional memory, and it drives cargo-cult swaps, blocks a simpler option on false grounds, and wastes the next reviewer's time re-deriving the truth. A wrong explanation attached to right code outlives the code.

**Watch for:** Verifying "the new rule fires" confirms the swap works; it does **not** confirm the old one was broken. Those are different claims, and the comment asserts the second. Test the counterfactual directly and cheaply: restore the old rule (file-copy backup, never git), re-run the probe, and see whether it also fires. If it does, the rationale is false — fix the comment even though the code is correct, and rate it Medium rather than waving it through, because comment accuracy in a config file is the only documentation that boundary has. Give extra weight when the diff *also* contains a change that fully explains the symptom on its own; prefer that duller explanation over the sophisticated one.

## Prove "zero runtime change" and "structural typing makes this work" mechanically — both are cheap to settle

**Pattern:** A type-only or mechanical migration touches dozens of files and claims two things a reviewer is tempted to accept by reading: (1) "only imports changed, no logic," and (2) "the DTO satisfies the new projection structurally, so no cast is needed." Both are exactly the claims a wide diff hides a counterexample inside, and both have a mechanical answer that takes one command.

**Impact:** Reading 36 near-identical import rewrites reliably induces pattern-blindness — the one file with a reordered argument or a flipped default is the one that looks like all the others. And "structural typing means it works" is an assertion about the compiler that can simply be wrong at one field (an optional-vs-nullable mismatch), which turns a claimed no-op projection into either a compile break or, worse, a cast someone adds to silence it.

**Watch for:** For (1), do not eyeball the diff — filter it. Extract every changed line that is *not* an import and require the result to be empty; that turns a 36-file review into a one-line assertion. For whitespace/formatting damage specifically, `git diff --ignore-all-space --ignore-blank-lines --stat` compared against the plain `--stat` proves the absence of whitespace-only churn far better than spot-checking files. For (2), do not reason about assignability — compile it. Write a throwaway probe (`const _a: Projection = {} as unknown as Dto;`), run tsc, delete it. If it compiles, structural satisfaction is proven rather than asserted; if it does not, you found the field. Also check the *reverse* direction when two types are claimed "distinct but currently identical" — mutual assignability means tsc will never warn on drift, which is a real (acceptable, but documentable) gap the implementer may not have stated.

## An "approximate" line target that collides with an explicit non-goal is a plan defect — rule on it, don't split the difference

**Pattern:** A refactor plan sets a size target ("each service drops below ~400 lines") and, in the same document, declares the only remaining fat off-limits ("no DTO-mapping extraction — explicitly deferred"). The implementer lands close but over, flags the contradiction, and asks for a decision. The reviewer's temptation is to record it as "partial" and move on, or to authorize the forbidden extraction to make the number go green.

**Impact:** Both reflexes are wrong and both are expensive. Marking it "partial" and deferring leaves the next reviewer to re-litigate the identical conflict with no recorded reasoning, and the AC stays permanently amber. Authorizing the extraction to hit the number expands blast radius on a move-only refactor — the exact change class where scope creep does the most damage — to satisfy a target the plan itself undermined. The number is a *proxy*; enforcing the proxy against the goal it proxies for is how a refactor acquires unplanned risk.

**Watch for:** Measure before ruling — an AST pass giving per-method line counts settles in one command whether the residual really is the forbidden category or whether the implementer just stopped early. Then enumerate *every* path to the target and check each against the plan: if the only unblocked paths are "violate the explicit non-goal", "violate another clause of the same AC" (deleting public wrappers a router calls), or "strip docstrings", the AC is unreachable as written and that is a finding about the plan, not the code. Rule explicitly — accept-with-rationale or authorize — and record it in cross-phase decisions so it is not re-argued. When an *approximate* target conflicts with an *explicit* boundary, the explicit boundary governs; check whether the AC's real intent ("services become orchestration + persistence") is already satisfied, because it usually is, and that is what "met in substance" means.

## Evaluation-order tests must be mutation-tested, not read — construction looks order-sensitive when it isn't

**Pattern:** A validator extraction claims "evaluation order preserved" and ships precedence tests: each builds a payload violating two rules and asserts the earlier message wins. Reading them, they look airtight — the payload plainly violates both. But a precedence test is only order-sensitive if the *second* rule genuinely fires for that payload; if it doesn't, the test passes under any ordering and pins nothing while looking like it pins everything.

**Impact:** Error precedence is an observable contract — which message a multi-violation payload returns first is user-visible and often client-parsed. A tautological precedence test is worse than no test: it makes the contract look defended, so the next refactor reorders the rules with a green suite and ships a silent behavior change.

**Watch for:** Do not verify order by diffing the source and calling it done — that proves the order matches today, not that anything will catch it drifting. Inject the mutation: reorder the rules in the extracted module, run the suite, confirm the corresponding test fails **and that no unrelated test fails** (a mutant killed by ten tests means they're coupled to something other than order). Do this per adjacent rule pair, not once. Back up with a file copy and restore by copy — never `git stash`/`checkout`/`restore`, which destroy concurrent work in a shared tree. If a mutant survives, the payload doesn't violate the later rule and the test is decorative; say so even though the shipped order is correct.

## Prove a "move-only" refactor mechanically — AST-normalize the moved bodies, don't read them

**Pattern:** A refactor moves N functions between modules and claims "zero logic changes, only `self`-removal and reflow." The diff is huge and dominated by relocation, so reading it induces exactly the pattern-blindness that hides the one changed conditional. Reviewers compensate by spot-checking, which samples the wrong lines.

**Impact:** In a move-only refactor *any* behavior delta is a defect by definition, so the reviewer's single job is establishing whether the set of deltas is empty. Eyeballing gives no bound on what was missed; a clean read is not evidence.

**Watch for:** Parse both versions and compare `ast.dump` per function, with a transformer that normalizes the expected mechanical differences (`self.db` → `db`, drop the `self` arg, strip docstrings). Formatting, reflow, and comments vanish for free; what survives is real. Every function reports identical, or the ones that don't get `ast.unparse`'d and diffed line-by-line — which turns "did anything change across 400 moved lines?" into a list you can read in ten seconds. Apply the same trick to the *public API* (class, name, full signature, return annotation, sorted) to settle "no signature changes" as a set comparison rather than a claim, and to *test bodies* to prove relocated tests weren't silently weakened — assertion counts and test-name diffs both miss a body that was gutted but kept its name.

## Deleting a dead branch: prove unreachability by construction, and probe the smuggling path

**Pattern:** An implementer deletes a validation branch as "provably dead" — the schema bounds the input, so the check can never fire — while keeping its mirror-image sibling. The argument is usually right, and coverage flagging the line as never-executed feels like confirmation. Accepting it on the argument alone is the trap: deleting a *reachable* branch is a behavior change wearing a cleanup's clothes, and the asymmetry ("why keep `<2` but delete `>50`?") is exactly where the reasoning tends to be sloppy.

**Impact:** Asymmetric. If the branch really is dead, deleting it is pure win and the coverage report improves. If one caller can smuggle a value past the schema, a validation rule silently disappears and no test fails — because the tests were written against the schema-valid inputs that never reach it.

**Watch for:** Coverage proves the branch didn't execute under the existing tests; it does **not** prove it can't. Settle it by construction instead: (1) enumerate every caller and confirm the parameter type is the bounded schema — one caller taking a looser type breaks the whole argument; (2) grep for validation bypasses (`model_construct`, `.construct(`, `validate_assignment`) that would let an out-of-bounds value exist at all; (3) probe the *smuggling* path the argument depends on — if the reasoning is "`max_length` + `strip()` monotonicity", actually try padding a long value with whitespace and confirm the schema rejects on raw length before `strip()` could rescue it. Then verify the *retained* sibling is genuinely reachable with a concrete input rather than assuming symmetry — asymmetric bounds (pre-strip length check, post-strip rule) are why one lives and one dies, and that asymmetry belongs in a comment and a boundary test, not just in the review.

## "The existing suite is the parity oracle" is a claim about assertion *strength*, not test count — check it before it justifies a rewrite

**Pattern:** A plan authorizes a large behavior-preserving refactor and names an existing test file as the safety net, citing its size ("the 1,273-line suite is the parity oracle — audit rates coverage strong"). Line count, test count, and even coverage percentage are all orthogonal to whether the suite pins the behavior being moved. The failure signature is a suite full of `assert result is not None`, `isinstance(result, str)`, `len(result) > 0`, and `assert "stop" in result.lower()` — each of which passes for *any* non-empty string. A file can be 1,273 lines, hold 83 asserts, report high coverage, and still be satisfied by a complete rewrite of the strings it nominally protects.

**Impact:** This is the highest-leverage failure a reviewer can catch, because the oracle claim is doing all the work of justifying the rewrite. If the oracle is vacuous and the refactor is the template for a downstream port (a TS engine, a service extraction), drift is not caught later — it is faithfully transcribed into the port and ships as the new reference behavior. Note the asymmetry: a *few* exact-string asserts may exist and mislead you. Check what they assert, not that they exist — bookend/scaffolding lines (opening narration, wake lines, `data.name`) are commonly pinned exactly while the actual dispatch table under refactor is pinned by nothing.

**Watch for:** Never accept the oracle claim from the plan, the audit, or the implementer. Grep the baseline file with `git show <parent>:<path>` and count strength, not volume: `grep -cE 'assert .*== "'` against `grep -c 'assert '`. Then scope it — if exact asserts exist, list them and confirm whether any covers the functions actually being moved. If the answer is zero, the correct implementer behavior is to **write the oracle first, pre-refactor**, and an implementer who did that has not gold-plated; they have done the only thing that made the change safe. Reward it. Conversely, if an implementer performs the rewrite and reports "existing suite green," that is not parity evidence and the green suite is not a defense.

## An oracle written by the same agent that did the refactor must be validated against the OLD code, not the new

**Pattern:** An implementer writes a strong-looking exact-equality test suite as parity evidence. The tables are hardcoded literals, the assertions are strict, coverage hits 100% — and it can still be worthless. If the expectations were transcribed from the *new* implementation, the suite asserts the new code against itself, and any transcription error that coincidentally matches a port error is invisible. This is subtler than the vacuous-snapshot pattern (`expect(x).toEqual(x)`), because the tables look independent and the assertions are genuinely strict. A related tell is expectations computed from live module constants rather than written as literals.

**Impact:** The suite becomes institutional memory and a downstream port contract while proving nothing about the behavior it claims to preserve. Worse than no oracle, because it stops the next reviewer from looking.

**Watch for:** Two mechanical checks, both cheap. (1) Confirm expectations are literals, not derived — grep the test file for assertions that reference the module under test (`assert ... == templates.SOME_CONST`); a completeness guard like `assert set(TABLE) == set(MODULE_DICT)` on *keys* is fine and even good, but a *value* sourced from the module is self-reference. (2) Decisively: import the committed expectation tables and run them against the OLD implementation loaded read-only via `git show <parent>:<path>`. Zero mismatches proves the tables derive from pre-refactor behavior. If the implementer claims a specific case count ("all 67 matched"), reproducing that exact number independently is strong corroboration that they actually ran it rather than reconstructed the claim afterward.

## 100% line coverage does not pin a de-duplication, guard, or normalization whose code path executes unconditionally

**Pattern:** A behavior is implemented by a construct that runs on every call regardless of whether the condition it handles is present — a `set()` de-dup, a `sorted()`, a `?? default`, a clamp. Line coverage reports it green because the line always executes. No test ever supplies the input that makes it matter (a duplicate, an out-of-order item, a null). The behavior is entirely unasserted, and a coverage report actively conceals this by showing 100%.

**Impact:** Bites hardest where an explicit edge-case list ("duplicate instances de-duplicated via role-ID set") is treated as covered because coverage is 100%. The edge case is real, the code is correct, and nothing pins it — so a downstream port or a later refactor can drop it silently with the full suite green.

**Watch for:** Take any explicit edge-case list from the plan's correctness section and grep the tests for the *input condition*, not the code path — for de-dup, look for a test that actually constructs two rows sharing an ID. Coverage percentage is not evidence for these; ignore it entirely. When you add the missing test, **mutation-test it before believing it**: delete the construct (file-copy backup, never git), re-run, confirm the test fails. If it still passes, you have learned something more valuable than the gap — the stated mechanism is not what enforces the behavior (e.g. SQL `IN (x, x)` already returns one row, so the `set()` enforces nothing). Fix the docstring to pin the *behavior* and state the real mechanism, rather than shipping a test whose comment misattributes its own subject.

## A deliberately preserved bug must be pinned where the next reader will be standing, not only in the test

**Pattern:** A refactor under a copy/behavior freeze correctly preserves a known bug (a naive pluralization, an off-by-one, a wrong default) and pins it with an exact-equality test plus an explanatory comment — in the test file. The source line that produces the bug carries no warning at all. The freeze decision is right; the pin's *location* is wrong.

**Impact:** Scales with distance to the consumer. Within one repo it is survivable — the pinned test fails and the explanation surfaces. But when the module is the reference for a port to another language or service, the porter reads the *source*, recognizes the obvious bug, "corrects" it in the new implementation, and the pinned test never runs against the port. The freeze silently fails exactly where it mattered most, and the two implementations diverge on their first day.

**Watch for:** When an implementer reports "bug X preserved deliberately, pinned in tests," treat that as half a fix and go look at the source line. Require a comment at the point of the bug that states four things: that it is a known bug, that the wrong output is the frozen/shipped behavior, where the pinning test lives, and — if a port is downstream — an explicit instruction to reproduce the bug faithfully rather than fix it. Ask the concrete question: "if someone transcribes this line into another language, what stops them from fixing it?" If the only answer is a test in a language the port does not run, the pin is insufficient. Rate Medium, not Low, when a port is downstream.

## A lint plugin that is absent and a codebase that is clean produce identical green — but `--max-warnings 0` collapses the ambiguity

**Pattern:** A config references a rule (`react-hooks/exhaustive-deps`) via an `eslint-disable` comment long before the plugin is installed. The rule is unenforced repo-wide and nobody notices, because the absence of findings looks exactly like the absence of violations. When the plugin is finally wired and the fallout is reported as *zero*, a reviewer's instinct is to disbelieve it — a React codebase that never had hooks linting having no violations is genuinely surprising. The instinct is right but the check is usually done wrong: re-running lint proves nothing, since that is the output under suspicion.

**Impact:** Two opposite failures. Accept the zero and a fabricated claim ships. Reject it and you burn the review re-litigating a claim that was true. Worse, the reviewer may "verify" by reading the config, which distinguishes *configured* from *unconfigured* but never *enforced* from *inert*.

**Watch for:** Two cheap checks that settle it completely. (1) **Probe, don't read** — write a file with a deliberate violation of each rule, lint it, and confirm the expected diagnostic and severity. This is the only proof the rule is live; config inspection cannot distinguish a wired-but-inert plugin. Delete the probe after. (2) **Use the flags as a proof, not just a gate** — if the lint script sets `--max-warnings 0` and exits 0, then zero warnings exist repo-wide *by arithmetic*, so a zero-fallout claim provably cannot be concealing suppressed findings. Combine with a full-diff grep for `eslint-disable` **added** (not merely present) and for ignore-pattern changes. Also check the effective severity mechanically via `eslint --print-config <file> | grep <rule>`: plugins commonly ship correctness rules as `warn`, so the rule may be gating only by virtue of a CLI flag that a later change can relax without any signal that enforcement went quiet. Promote such rules to `error` — when lint is already green under `--max-warnings 0`, the promotion is provably a no-op today and pure insurance tomorrow.

## When a "fix the tests, not the code" call is made, the deciding evidence is the default the code would fall back to

**Pattern:** A suite has N failures where the tests assert one thing and the implementation does another. The implementer declares the tests stale and edits them. This is the single cheapest way to fake a green, and it is indistinguishable from the legitimate case by looking at the diff — in both cases, failing tests become passing tests. Reviewers typically check provenance (was the implementation change deliberate?) and stop there. Provenance is necessary but not sufficient: a deliberate commit can still have introduced a bug.

**Impact:** If the tests were right, "fixing" them converts a caught bug into a silent production defect *and* destroys the only thing that was reporting it. The failure is permanent, because the next reviewer sees a green suite asserting the buggy behavior as intended.

**Watch for:** Three steps, in order. (1) **Provenance** — `git show` the commit that introduced the divergence. A deliberate feature commit changing behavior and leaving tests unupdated is the stale-test signature; an incidental change during an unrelated refactor is the bug signature. (2) **Direction of the assertion change** — a legitimate staleness fix usually makes assertions *more* specific (`toHaveBeenCalledWith()` → `toHaveBeenCalledWith({...exact args})`). An assertion that got *looser*, vaguer, or was deleted is the tell. (3) **Decisive: ask what the code does if you "fix" it to match the tests.** Chase the value into the system it talks to. A hook sending `limit: 100` against tests expecting no limit looks like an unwanted cap until you read the server's `default=20` — at which point removing it is revealed as the regression and the tests as the stale artifact. The parameter's *default* is the evidence, and it lives outside the diff, outside the tests, and outside the repo layer under review. Do not rule on staleness without it.

## Prove a test relocation with the collected-file set, not the test count — and prove it against the collector

**Pattern:** A mechanical test-tree restructure ships with "count before == count after" as its parity evidence. A count cannot detect a silently-uncollected file whenever anything else in the change also moves the count (tests added, tests deleted) — the arithmetic reconciles and a whole file's worth of coverage is gone. A file that stops matching the collector's globs looks exactly like a file that passes: silent, green, absent.

**Impact:** Coverage disappears at precisely the moment everyone's attention is on the mechanical diff. It surfaces months later as an untested regression in a module everyone believes is covered.

**Watch for:** Count parity is the weakest available evidence; a name-level `fullName` set diff is much better and worth crediting. But the *direct* check is cheaper than either and is the one to run yourself: compare files **on disk** against files **the runner actually collects** (`find src/test -name '*.test.*' | wc -l` vs `vitest list --filesOnly | wc -l`), then confirm no `include`/`exclude` override exists in the runner config — beware that a coverage-scoped `exclude` is not a collection `exclude` and does not affect this. Equal numbers plus default globs disproves silent uncollection outright, independent of any count arithmetic. Then separately reconcile the *file set* (not the test count) across the commit with `git ls-tree -r --name-only <parent>` vs `<head>`, matching on basename: every removal must be an outright deletion with a stated rationale or a rename with a matching addition. This turns "were tests dropped?" into a set-difference, which cannot be argued with.

## Static fixture inputs must match the runtime contract, not only the output

**Pattern:** A fixture is cast through `unknown` into a production input type, so extra source-system fields survive in test data without a compiler error. Output parity still passes because the implementation ignores those fields.

**Impact:** The fixture stops proving that its input represents the contract consumed by the runtime. A later implementation may accidentally depend on leaked transport or domain metadata, and the mismatch remains invisible because output assertions never inspect input shape.

**Watch for:** For committed fixtures that stand in for production inputs, assert the exact runtime keys and strip fields owned by the source system. Keep provenance checks independent by regenerating expected output from the reference implementation, then compare the cleaned fixture to the same reference.

## Boundary-shape tests must reach the intended validator

**A malformed fixture must satisfy earlier guards before asserting rejection.** The signal is a storage-test key that differs from the embedded record identifier, which lets a key-match check return `null` before shape validation runs.

**Runtime record guards must distinguish plain objects from arrays.** The signal is a predicate that checks only `typeof value === 'object'`, allowing array values to pass a `Record<string, unknown>` contract.

## Manual acceptance steps must follow runtime defaults and controls

**A manual checklist is executable only when its scenario reaches the asserted state using the shipped defaults.** The signal is a step that combines named seed roles without totaling their default card counts, expects a warning before the session is created, or names a button that belongs to a later route. Reproduce the flow from the actual page controls and seeded data, then state the route, exact action, visible result, and relevant network path. Keep every row pending until a human or browser-capable runner records the observation.

## File-loader shape checks need one test per validated field family

**A single malformed-field test does not defend a validator loop.** The signal is a loader that validates several fields in one branch but a test that mutates only one field, leaving the other checks removable without a failing test.

## Deterministic nested IDs need collision probes

**A deterministic ID function does not reject source records that collapse to one key.** The signal is an ID derived from normalized names or a parent pair while the converter only checks top-level uniqueness, allowing duplicate nested records to overwrite or coexist ambiguously.

## Async resource seams need failure-path and endpoint-exception probes

- **Start the cleanup boundary before the first awaited resource factory.** Signal: `const resource = await create...` appears outside the `try` that closes and deletes the resource on bootstrap failure.
- **Put retained endpoint exceptions ahead of generic path guards.** Signal: a `/resource/{id}` matcher also matches a named validation or availability endpoint that still needs to call the server.
