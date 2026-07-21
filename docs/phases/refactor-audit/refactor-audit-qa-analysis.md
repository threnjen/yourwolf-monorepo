# QA Readiness Analysis: Refactor Audit Remediation (Features 01–12)

**Date:** 2026-07-16
**Analyst:** prod-code-review (automated)
**Verdict:** GO WITH CONDITIONS
**Branch:** `phase/refactor-audit` — baseline `19b4520`, HEAD `2804969`
**Documents Analyzed:** 64 (12 × 5 per-feature, + QA plan, coverage map, execution manifest, security scan)
**Findings:** 6 (0 blockers, 0 high, 2 medium, 4 low)

---

## Executive Summary

This phase is ready for manual QA. All 60 per-feature documents and both consolidated QA artifacts
are present; every claimed gate was independently re-verified green by this analysis (backend 492
passed / 96.08%, frontend 535 passed, `npm run build` PASS, `npm run lint` PASS at
`--max-warnings 0`); and changed production files carry zero debug artifacts, TODOs, or secrets. No
finding rises above Medium, and none is a blocker.

The single unmet AC — **05/AC5, container packaging** — does not gate entry to QA, because it is
closable *only* by manual QA. Blocking on it would be circular. More importantly, this analysis
**materially downgrades its risk**: the loader's `DATA_FILE` was proven to resolve **absolute**, so
the `__file__`-vs-`WORKDIR` hazard the QA plan foregrounds cannot occur. The only genuine residual
risk is whether `COPY . .` placed the file in the image, which is near-certain and fails loudly at
startup rather than silently.

On the orchestrator's central concern — that five features found fabricated planning claims — the
finding is reassuring: **in every one of the five cases, the reviewer caught the false claim before
the AC closed, and no AC was closed on the strength of one.** The planning documents are indeed
unreliable, but the review layer compensated. Confidence in the QA plan is high: all 11 manual items
trace cleanly to executable checks, and the QA writer independently improved on the execution
manifest by catching the compose bind-mount that would have made the manifest's own AC5 check
vacuous.

---

## Document Inventory

All 12 feature folders contain the full five-document set (`-plan`, `-context`, `-tasks`,
`-implementation`, `-review`). No documents missing; no extraneous documents.

| Document | File | Present |
|---|---|---|
| Consolidated QA plan | `dev/refactor-audit-qa.md` (258 lines) | Yes |
| Coverage map | `dev/refactor-audit-coverage-map-qa.md` (99 lines) | Yes |
| Execution manifest | `dev/feature/refactor-audit-execution-manifest.md` (95 lines) | Yes |
| Security scan | `docs/phases/refactor-audit/refactor-audit-security-scan.md` (356 lines) | Yes — Pass with Conditions |
| Cross-phase handoff | `.github/learnings/cross-phase-decisions.md` (124 lines) | Yes |

**Verdicts confirmed** — extracted directly from each review, matching the orchestrator's summary
exactly: 01 AwR, 02 AwR, 03 AwR, 04 Approved, 05 AwR, 06 Approved, 07 AwR, 08 Approved, 09 AwR,
10 AwR, 11 Approved, 12 Approved. No review is marked Approved while carrying an open Blocker.

---

## Independent Verification Performed

This analysis did not accept the record. The following were re-derived from code:

| Claim | Method | Result |
|---|---|---|
| Backend 492 passed / 96.08% | `pytest -q` | **Confirmed** |
| Frontend 535 passed | `vitest run` | **Confirmed** (42 files) |
| `npm run build` PASS | executed | **Confirmed** |
| `npm run lint` PASS, `--max-warnings 0` | executed | **Confirmed**, exit 0 |
| Seed loader is cwd-independent | ran loader with `os.chdir('/tmp')` | **Confirmed** — 30 roles, 9 deps; `DATA_FILE.is_absolute() == True` |
| Dockerfile `COPY . .`, no `.dockerignore`, not git-ignored | inspected | **Confirmed** |
| compose bind-mounts `.:/app` (masks image copy) | inspected `docker-compose.yml` | **Confirmed — QA plan's trap is real** |
| `role_service.py` = 425 lines | `wc -l` + AST composition analysis | **Confirmed** — `list_roles` 74, `get_role` 71, ~120 docstring lines |
| Wrapper deletion blocked by AC4's own clause | grepped routers | **Confirmed** — `roles.py:101,102,151` call all three |
| Name bounds 2–50, single source | `app/schemas/role.py:63,121` | **Confirmed** |
| Win-condition rule live | `app/services/role_validation.py:119` | **Confirmed** |
| Wizard gates Save on `is_valid` | `Wizard.tsx:177-179` | **Confirmed** — contract change is client-unreachable |
| Fallback retained for real outages | `RoleBuilder.tsx:52` `serverErrors ?? [...]` | **Confirmed** |
| Exactly one `eslint-disable` remains, load-bearing | grep `src/` | **Confirmed** — `useRoles.ts:21`, not a boundary suppression |
| `BasicInfoStep` boundary violation fixed | inspected imports | **Confirmed** — uses `useNameCheck`, no `api/` import |
| "Werewolfs" frozen + pinned at source | `templates.py:94-103` | **Confirmed** — exemplary |
| SQL `IN` de-dup trap recorded | `test_script_service.py:163-178` | **Confirmed** — pinned as behavior, not mechanism |
| Debug artifacts / secrets in changed prod files | grep TODO/FIXME/print/console.log/secrets | **None found** |
| `__pycache__` committed | `git ls-files` | **None** |

Docker was unavailable to this analysis as well (`docker info` fails — daemon down), so 05/AC5 could
not be closed here either. This independently corroborates that the gap is environmental and real.

---

## Assessment of the Orchestrator's Five Concerns

### 1. Feature 05 AC5 is genuinely UNMET — does it gate release?

**No, it does not gate entry to manual QA — and its risk is lower than recorded.**

The AC is closable only by a container build, which is precisely what manual QA provides. Gating QA
entry on an AC that requires QA to close is circular.

**New evidence that downgrades the risk:** the QA plan and coverage map both foreground a
"`__file__`-vs-`WORKDIR`" hazard. That hazard **does not exist**. `Path(__file__)` has been absolute
since Python 3.9, and the image is `python:3.14-slim`; this analysis proved `DATA_FILE.is_absolute()`
is `True` and loaded all 30 roles after `chdir('/tmp')`. `WORKDIR` cannot affect the resolution.
`.github/learnings/cross-phase-decisions.md:23` states this correctly — it is the QA plan that
overstates it.

The one real residual risk is whether `COPY . .` included the file. Given no `.dockerignore`, the
file is not git-ignored, and it sits inside the copied tree, this is near-certain. Crucially, failure
would be **loud and immediate** (`SeedDataError` at container start), not silent corruption.

The QA plan's design is nonetheless correct and should be executed as written: its **image-only check
is the true gate**, and the QA writer deserves credit for catching that the execution manifest's
original `docker compose up` check (manifest L91) could never have proven the AC, because
`volumes: - .:/app` masks the image's own copy. That is the QA writer improving on its input.

**Ruling:** condition, not blocker. Risk: Likelihood Low, Impact Blocker-if-wrong, Detection Yes.

### 2. Feature 08 AC5 is partial

**Accepted.** Suite parity is proven by execution and the 29-test anchor is byte-for-byte unmodified.
The unproven half — "renders and operates identically" — is a claim JSDOM structurally cannot make.
QA plan Section 3 covers it with a concrete walkthrough. Appropriate.

### 3. Feature 09 AC4 ruling (425 vs ~400 lines) — is it sound?

**Confirmed sound. Do not re-litigate.** This analysis verified the ruling independently rather than
accepting it:

- AST composition confirms the implementer's claim: `list_roles` (74 lines) and `get_role` (71) are
  overwhelmingly field-by-field DTO construction — the exact work the plan's non-goal defers
  (*"no DTO-mapping extraction — explicitly deferred"*).
- ~120 lines are convention-standard docstrings; stripping them degrades the artifact.
- The third route — deleting the three delegating wrappers (~36 lines) — is blocked by **AC4's own**
  "no public signature changes" clause. Verified: `routers/roles.py:101`, `:102`, and `:151` call
  `validate_role`, `get_warnings`, and `check_duplicate_name` respectively. All three are live.

Every path to <400 is blocked by the plan's own constraints. An approximate target correctly yields
to an explicit scope boundary, and AC4's actual intent — every rule leaves the service — is fully
met. `game_service.py` hit the target outright (520→321).

### 4. Planning artifacts are the weak link — was any AC closed on a false claim?

**No. This is the key finding, and it is reassuring.** All five fabrications were caught by reviewers
*before* AC closure, and each was remediated by doing real work rather than by accepting the claim:

| # | Fabricated claim | Feature | Resolution | AC closed on false claim? |
|---|---|---|---|---|
| 1 | Regression anchor that did not exist | 04 | Tests written new | No |
| 2 | `TestCardCountValidation` covers a different rule than its name implies; §F self-contradictory | 07 | `TestRoleCountMatchesPlayersAndCenter` written new; nothing moved | No |
| 3 | Plan §A contradicts its own Discovery Delta ("relocate from `test_roles.py`" — nothing to relocate) | 09 | Nothing relocated; `test_role_validation_module.py` written new | No |
| 4 | `test_script_service.py` described as a parity oracle; all 83 assertions pinned no exact strings | 10 | Oracle built independently and validated against the **old** module | No |
| 5 | `PHASE_04_SUMMARY.md` L76 "retention contract" is a descriptive inventory (omits live `getById`) | 12 | `gamesApi.delete` retained anyway, under directive | **Decision rests on false evidence — but action is inert** |

Case 5 is the only decision resting on a disproven claim. Its risk is negligible: the action taken
was to *retain* dead code (the conservative direction), the reviewer disqualified the evidence
explicitly, and `cross-phase-decisions.md:51` hands the call to Phase 04 with the reasoning intact.
Retaining an uncalled method cannot cause a QA failure.

The review layer did its job. The planning stage is genuinely unreliable — feature 09's reviewer
correctly escalated it as systemic — but no defect reached the code.

### 5. Was freezing the "Werewolfs" bug correct, and is the follow-up recorded?

**Yes on both counts, and the recording is exemplary.**

Freezing was correct. Feature 10's entire value is a byte-parity oracle for the Phase 04 TypeScript
port; fixing the copy would have (a) violated AC4, (b) corrupted the oracle, and (c) shipped an
undocumented behavior change inside a phase whose contract is "structure changed, behavior did not."
The right sequencing is exactly what happened: freeze now, fix in a dedicated copy-fix feature that
updates the pinned test and the TS port together.

The follow-up is recorded in four places, which is more than adequate:
`templates.py:94-103` (source-level `KNOWN COPY BUG — DO NOT "FIX" HERE` with a Phase 04 port note),
`test_narration_templates.py:155-158` (pinned case + rationale), `cross-phase-decisions.md:119`, and
the QA plan's Notes ("If you see it, do not file it"). Feature 10's reviewer added the source-level
pin specifically because a porter reading `templates.py` would never have seen a test-only pin — that
is the correct instinct.

---

## Phase 04 Handoff Readiness

**Strong — the strongest artifact in this phase.** `.github/learnings/cross-phase-decisions.md` (124
lines) is a genuinely high-quality porter's briefing. The traps the orchestrator asked about are all
recorded with mechanism, evidence, and explicit instruction:

- **SQL `IN` de-dup trap (entry 120):** correctly recorded. Verified at `script_service.py:171` —
  `role_ids = list({gr.role_id for gr in game_roles})` is not what enforces de-duplication;
  `Role.id.in_([x, x])` is. `TestDuplicateRoleDeduplication` (`test_script_service.py:163-178`) pins
  the **behavior, not the mechanism**, and its docstring states plainly that a TS port using a
  different data-access path "gets no help from SQL `IN` semantics and must de-duplicate explicitly."
  This is exactly right — the reviewer disproved the plan by mutation testing and pinned the truth.
- **One-way single-level cascade (entry 45):** recorded with the porter-facing warning that it "reads
  like a bug and may well be one, but changing it is a product decision" — and the test failure is
  framed as "the intended conversation, not a broken test to update."
- **`domain/abilitySteps.ts` sharp edges (entries 41, 100):** all three recorded, with the crucial
  note that guards live in the UI layer and direct callers get no protection.
- **Narration oracle (entry 118):** correctly marked load-bearing with a "do not regenerate from the
  implementation" warning — regenerating an oracle from the code it tests would destroy its value.

No Phase 04 handoff gap identified.

---

## Findings

| # | Finding | Severity | Evidence | Recommendation |
|---|---|---|---|---|
| 1 | **Feature 01 implementation record contradicts itself.** L14 and L20 correct the contract change to "400 → 422 (was 400, not 500)", but **L117 and L128 still assert "500 → 422"** in the same document. | Medium | `01-backend-schema-surface-implementation.md:14,20` vs `:117,128` | Correct L117/L128. The record is the designated source of truth per `cross-phase-decisions.md:71`; a source of truth that contradicts itself is not one. |
| 2 | **Coverage map summary arithmetic is wrong.** Table contains **69** AC rows (verified per-feature: 4/6/7/5/5/7/5/5/5/6/5/9); summary claims "Total ACs classified: 62" and "Manual QA not needed: 51". Correct figures: 69 total, 58 not needed. Manual-needed count (11) is correct. | Medium | `refactor-audit-coverage-map-qa.md:97-99` | Correct the two totals. No tester impact — the 11 manual items are correctly enumerated and all trace to QA plan sections — but an artifact that miscounts its own table invites doubt about the rest. |
| 3 | **Feature 12's plan defines AC1–AC6; the coverage map and record carry AC1–AC9.** AC7 (`npm run build`), AC8 (react-hooks enforcement), AC9 (422 parsing) were orchestrator-directed additions. Properly attributed in the record ("AC7 (added) \| orchestrator scope #2"), but **the plan was never updated**. | Low | `12-…-plan.md:17-22` vs `12-…-implementation.md:55-57` | No action needed for QA — scope is documented and traceable. Flag to planning: when the orchestrator expands scope mid-flight, the plan should be amended or the record should be declared authoritative. |
| 4 | **QA plan overstates the AC5 `WORKDIR` risk.** Plan L60/L74-78 frame `__file__`-vs-`WORKDIR` as an open hazard. `Path(__file__)` is absolute in Python ≥3.9; image is `python:3.14-slim`. Proven: `DATA_FILE.is_absolute() == True`; loader returns 30 roles from `chdir('/tmp')`. The `-w /tmp` check is near-vacuous. | Low | `refactor-audit-qa.md:60,74-78`; contrast `cross-phase-decisions.md:23`, which is correct | Keep the check (it costs seconds and is harmless insurance), but the **image-only check at L66-72 is the true gate**. Testers should not read an AC5 pass on the `-w /tmp` check as meaningful. |
| 5 | **QA plan §5 grep will return one hit that the expected-result text does not name.** `grep -rn "eslint-disable" src/` returns `useRoles.ts:21` — load-bearing and correct. The expected result is properly qualified ("no `no-restricted-imports` suppressions"), but a tester scanning quickly may read any hit as failure. | Low | `refactor-audit-qa.md:220-226`; verified exactly one disable exists | Name the expected hit inline: "one hit is expected — `useRoles.ts:21`, an `exhaustive-deps` disable that is load-bearing; it is not a boundary suppression." |
| 6 | **Feature 01 plan AC3 still carries the disproven 500 claim** ("instead of raising an unwrapped `ValueError` at `role_service.py:335`"). Known and recorded, but unfixed in the plan itself. | Low | `01-…-plan.md:19` | Leave for QA. Fix opportunistically; `cross-phase-decisions.md:71` already directs readers to the record instead. |

---

## Risk Register

| # | Risk | Likelihood | Impact | QA Detection | Recommendation |
|---|---|---|---|---|---|
| 1 | `roles.json` absent from built image → seeding fails in any deployment without a source bind-mount | **Low** (downgraded — `COPY . .`, no `.dockerignore`, path resolution proven absolute) | **Blocker** | **Yes** — QA §1 image-only check is purpose-built and correct | Execute QA §1 first. Do not accept a `docker compose up` pass as evidence. |
| 2 | Wizard interaction regression from the `AbilitiesStep` decomposition (492-line component → 160-line container + 3 components) | Low | High | **Yes** — QA §3 walkthrough | Execute the full §3 walk; every rendering seam moved. |
| 3 | `POST /roles` win-condition tightening breaks a non-wizard client | Very Low | Medium | **Yes** — QA §2 + §3 client-path confirmation | Verified client-unreachable (`Wizard.tsx:177-179` gates Save on `is_valid`). Product sign-off outstanding. |
| 4 | Real backend 422 shape ≠ `extractApiErrorMessages` fixture (unit tests use hand-written bodies) | Low | Medium | **Yes** — QA §3 over-long-name check is the only real-wire test | This is the seam where feature 07's contract change meets feature 12's parser. Do not skip. |
| 5 | `location.state` handoff breaks across the setup → wake-order → facilitator chain | Low | High | **Yes** — QA §4 | Recorded Phase 04 deferral; QA confirms no raw crash. |
| 6 | `axios ^1.6.5` High advisories in the production bundle | Certain (present) | High | No — out of QA scope | **Pre-existing, not phase-attributable.** Schedule the upgrade to `>=1.16.0` as dependency maintenance. Does not gate this phase. |
| 7 | Phase 04 porter "fixes" a frozen quirk (Werewolfs / cascade / sharp edges), silently diverging the engine | Low | High | N/A — future phase | Already mitigated by source pins + `cross-phase-decisions.md`. No further action. |

---

## Conditions

Manual QA may proceed. The following must hold:

1. **QA §1's image-only packaging check must be executed and must pass before this phase is
   considered releasable.** This is the only outstanding unmet AC (05/AC5) and the only check whose
   failure means a broken deployment. It must not be signed off on the strength of a
   `docker compose up` pass — `volumes: - .:/app` masks the image's copy and makes that run
   incapable of proving the AC. If the image-only check fails, this becomes a NO-GO and returns to
   `@z-feature-implementer` for feature 05.
2. **Findings 1 and 2 (documentation defects) should be corrected**, ideally before QA sign-off.
   Neither affects tester behavior; both undermine the credibility of artifacts that Phase 04 will
   rely on. Correcting them is a five-minute edit.
3. **Feature 07's win-condition contract change requires explicit product sign-off** during QA §2.
   It is verified client-unreachable and judged defense-in-depth, but it was unplanned and the
   implementer explicitly requested a human decision. Do not let it pass by default.
4. **The "Werewolfs" bug must not be filed as a new defect** (QA plan Notes covers this), and a
   dedicated copy-fix feature — updating the pinned test and the TS port together — should be
   scheduled, not forgotten.
5. **The `axios` advisory should be tracked as a separate dependency-maintenance item.** It is
   pre-existing and not attributable to this phase, but it is a High in the shipped bundle and must
   not be absorbed into "the refactor passed QA."

---

## Recommendations

Ordered by priority:

1. **Execute QA §1 first, exactly as written.** It is the only check standing between this phase and
   a potentially broken deployment, and it is well-designed. Everything else in the plan is
   confirmation of intent or walkthrough.
2. **Correct findings 1 and 2** (feature 01 record self-contradiction; coverage map totals). Cheap,
   and both artifacts feed Phase 04.
3. **Obtain product sign-off on the four recorded contract changes** during QA §2 — win-condition
   requirement, name-length 422, modifier 422, and the 2–50 bounds.
4. **Escalate the planning-quality pattern to `@Feature - Decomposer` as process feedback.** Five of
   twelve features found fabricated or self-contradictory claims in their own plans. No defect
   reached the code — the review layer caught all five — but that is a review layer absorbing cost
   that should not exist. The specific failure mode is plans asserting that tests exist without
   verifying them. This is the single highest-leverage process fix available.
5. **Schedule the copy-fix feature for "Werewolfs"** so the freeze does not become permanent by
   inattention.
6. **Schedule the `axios` upgrade** (`>=1.16.0`) as dependency maintenance, independent of this phase.

---

## Conclusion

**GO WITH CONDITIONS.** The implementation is sound, the gates are green and independently
re-verified, the code is clean, and the Phase 04 handoff is unusually well-prepared. The three
partial/unmet ACs are each correctly characterized, correctly routed to manual QA, and — in the case
of 09/AC4 — correctly ruled upon. The documentation defects found are cosmetic and do not affect what
a tester does.

The phase's notable weakness is its planning artifacts, not its code. That weakness was contained by
the review layer, and this analysis found no instance of it reaching the implementation.
