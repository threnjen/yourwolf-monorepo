# Automated QA: PHASE_04A

VERDICT: PASS

**Date:** 2026-09-14
**Scope:** Pure TypeScript engine contracts, narration templates and assembly, seed-role parity fixtures, setup validation, and immutable game-session transitions for Phase 04A.  
**Run by:** Codex remediation pass
**Repository root:** `/Users/jennywadkins/github_repos/personal/yourwolf-monorepo`

Every check below is a command. The runner executes these checks and records the results at the bottom. No check requires a live service, browser, database, API key, or UI caller.

## Checks

### Frontend engine parity

**Covers ACs:** `01-engine-types-templates/AC1-AC6`, `01-engine-types-templates/AC9`, `02-narration-scripts-preview/AC1-AC7`, `02-narration-scripts-preview/AC9`, `03-game-session-state-machine/AC1-AC8`, `03-game-session-state-machine/AC10`

- **A1 — Run the focused frontend engine suites**
  - Command: `cd yourwolf-frontend && npm test -- --run src/test/engine`
  - Expected: exit code `0`; Vitest reports no failed test files or tests.
  - Status: PASS

### Backend reference and service oracles

**Covers ACs:** `01-engine-types-templates/AC3-AC6`, `02-narration-scripts-preview/AC1-AC8`, `03-game-session-state-machine/AC2-AC4`, `03-game-session-state-machine/AC8`

- **A2 — Run the read-only narration and setup reference suites**
  - Command: `cd yourwolf-backend && uv run pytest --no-cov tests/test_narration_templates.py tests/test_narration_script_builder.py tests/test_script_service.py tests/test_game_setup_validation.py`
  - Expected: exit code `0`; pytest reports no failed tests.
  - Status: PASS

### Full regression and frontend quality gates

**Covers ACs:** `01-engine-types-templates/AC9`, `02-narration-scripts-preview/AC9`, `03-game-session-state-machine/AC10`

- **A3 — Run the full frontend regression suite**
  - Command: `cd yourwolf-frontend && npm test -- --run`
  - Expected: exit code `0`; Vitest reports no failed test files or tests.
  - Status: PASS
- **A4 — Run the full backend regression suite**
  - Command: `cd yourwolf-backend && uv run pytest`
  - Expected: exit code `0`; pytest reports no failed tests and the configured coverage gate passes.
  - Status: PASS
- **A5 — Run frontend lint with unused-disable and warning gates**
  - Command: `cd yourwolf-frontend && npm run lint`
  - Expected: exit code `0`; ESLint reports no errors or warnings.
  - Status: PASS
- **A6 — Run the frontend TypeScript and production build**
  - Command: `cd yourwolf-frontend && npm run build`
  - Expected: exit code `0`; TypeScript completes and Vite reports a successful production build.
  - Status: PASS

### Coverage

**Covers ACs:** `01-engine-types-templates/AC9`, `02-narration-scripts-preview/AC9`, `03-game-session-state-machine/AC10`

- **A7 — Generate the configured frontend coverage report**
  - Command: `cd yourwolf-frontend && npm run test:coverage`
  - Expected: exit code `0`; Vitest completes with no failed tests and the configured global coverage thresholds pass.
  - Status: PASS
- **A8 — Check executable engine coverage against the phase threshold**
  - Command:

    ```sh
    python - <<'PY'
    from pathlib import Path

    records = Path('yourwolf-frontend/coverage/lcov.info').read_text().split('end_of_record')
    metrics = {'lines/statements': [0, 0], 'branches': [0, 0], 'functions': [0, 0]}
    empty = []
    for record in records:
        lines = record.splitlines()
        source = next((line[3:] for line in lines if line.startswith('SF:')), None)
        if not source or not source.startswith('src/engine/'):
            continue
        values = {}
        for line in lines:
            if ':' in line:
                key, value = line.split(':', 1)
                if key in {'LF', 'LH', 'BRF', 'BRH', 'FNF', 'FNH'}:
                    values[key] = int(value)
        if values.get('LF', 0) == 0:
            empty.append(source)
            continue
        for name, found, hit in (
            ('lines/statements', 'LF', 'LH'),
            ('branches', 'BRF', 'BRH'),
            ('functions', 'FNF', 'FNH'),
        ):
            metrics[name][0] += values[found]
            metrics[name][1] += values[hit]

    assert empty == ['src/engine/types.ts']
    assert all(hit * 100 / total >= 90 for total, hit in metrics.values())
    print('Executable src/engine coverage meets the 90% lines/statements, branches, and functions thresholds; type-only declarations have no executable lines.')
    PY
    ```

  - Expected: exit code `0` and the exact output `Executable src/engine coverage meets the 90% lines/statements, branches, and functions thresholds; type-only declarations have no executable lines.`
  - Status: PASS

### Fixture provenance and parity

**Covers ACs:** `02-narration-scripts-preview/AC6-AC8`

- **A9 — Recreate fixture inputs and outputs from the seed data and Python builders**
  - Command:

    ```sh
    cd yourwolf-backend
    uv run python - <<'PY'
    import json
    import re
    from pathlib import Path

    from app.services.narration.inputs import AbilityStepInput, RoleScriptInput
    from app.services.narration.script_builder import build_night_script_actions, build_preview_actions

    seed = json.loads(Path('app/seed/data/roles.json').read_text())
    fixture = json.loads(Path('../yourwolf-frontend/src/test/engine/night-script.fixture.json').read_text())
    previews = json.loads(Path('../yourwolf-frontend/src/test/engine/preview.fixture.json').read_text())

    def role_id(name):
        return 'role-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

    def converted(raw):
        return {
            'name': raw['name'],
            'wake_target': raw.get('wake_target'),
            'ability_steps': [
                {
                    'order': step['order'],
                    'modifier': step['modifier'],
                    'ability_type': step['ability_type'],
                    'parameters': step.get('parameters') or {},
                    'is_required': step['is_required'],
                }
                for step in raw.get('ability_steps', [])
            ],
            'id': role_id(raw['name']),
            'wake_order': raw.get('wake_order'),
            'team': raw['team'],
            'is_primary_team_role': raw.get('is_primary_team_role', False),
            'min_count': raw.get('min_count', 1),
            'max_count': raw.get('max_count', 1),
        }

    expected_roles = [converted(raw) for raw in seed['roles']]
    assert fixture['roles'] == expected_roles
    waking = [role for role in expected_roles if role['wake_order'] is not None and role['wake_order'] > 0]
    ordered = sorted(waking, key=lambda role: (role['wake_order'], role['name']))
    assert fixture['custom_sequence'] == [role['id'] for role in reversed(ordered)]

    def script_input(role):
        return RoleScriptInput(
            name=role['name'],
            wake_target=role['wake_target'],
            ability_steps=[
                AbilityStepInput(
                    ability_type=step['ability_type'],
                    order=step['order'],
                    modifier=step['modifier'],
                    is_required=step['is_required'],
                    parameters=step['parameters'],
                )
                for step in role['ability_steps']
            ],
        )

    def dump(actions):
        return [action.model_dump() for action in actions]

    assert fixture['default'] == dump(build_night_script_actions([script_input(role) for role in ordered]))
    custom_by_id = {role['id']: role for role in waking}
    custom_ordered = [custom_by_id[role_id] for role_id in fixture['custom_sequence']]
    assert fixture['custom'] == dump(build_night_script_actions([script_input(role) for role in custom_ordered]))

    for role in expected_roles:
        expected = [] if role['wake_order'] is None or role['wake_order'] <= 0 else dump(build_preview_actions(script_input(role)))
        assert previews[role['name']] == expected
    assert set(previews) == {role['name'] for role in expected_roles}
    print('Fixture conversion and Python narration parity: OK')
    PY
    ```

  - Expected: exit code `0` and the exact output `Fixture conversion and Python narration parity: OK`.
  - Status: PASS

### Engine boundary and phase scope

**Covers ACs:** `01-engine-types-templates/AC7-AC8`, `02-narration-scripts-preview/AC8-AC9`, `03-game-session-state-machine/AC5`, `03-game-session-state-machine/AC9`

- **A10 — Check engine purity, conditional helper scope, absent callers, and allowed phase changes**
  - Command:

    ```sh
    if rg -n -e "(from|import)[[:space:]]*['\"][^'\"]*(react|react-dom)" -e "(from|import)[[:space:]]*['\"][^'\"]*/(api|hooks|components|pages|styles)(/|['\"])" -e "(from|import)[[:space:]]*['\"][^'\"]*/types(['\"]|/)" yourwolf-frontend/src/engine; then
      exit 1
    fi
    if rg -n -i -e 'Math\.random' -e 'crypto' -e '\bDate\b' -e '\bfetch\b' -e '\baxios\b' -e 'localStorage' -e 'sessionStorage' -e '\bdocument\b' -e '\bwindow\b' -e 'console\.' -e '\blogger\b' -e 'XMLHttpRequest' -e 'WebSocket' yourwolf-frontend/src/engine; then
      exit 1
    fi
    if rg -n -e 'setStepModifier' -e 'moveStepUp' -e 'moveStepDown' yourwolf-frontend/src/engine; then
      exit 1
    fi
    if rg -n -e "from ['\"][^'\"]*engine/" -e "import ['\"][^'\"]*engine/" yourwolf-frontend/src --glob '!**/test/engine/**' --glob '!**/engine/**'; then
      exit 1
    fi
    unexpected=$(git diff --name-only aa8c4814fa92395e75efd21d6764da0c4493e257 -- 'yourwolf-backend/**' 'yourwolf-frontend/src/**' 'yourwolf-frontend/vite.config.ts' 'yourwolf-frontend/eslint.config.js' 'yourwolf-frontend/package.json' 'yourwolf-frontend/package-lock.json' | rg -v '^yourwolf-frontend/src/(engine/|test/engine/)' || true)
    if [ -n "$unexpected" ]; then
      echo "$unexpected"
      exit 1
    fi
    extra=$(find yourwolf-frontend/src/test/engine -maxdepth 1 -type f ! -name '*.test.ts' ! -name '*.fixture.json' -print)
    if [ -n "$extra" ]; then
      echo "$extra"
      exit 1
    fi
    echo 'Engine boundary and Phase 04a scope checks: OK'
    ```

  - Expected: exit code `0` and the exact output `Engine boundary and Phase 04a scope checks: OK`.
  - Status: PASS

## Run results

**Run result:** PASS

**Run date:** 2026-09-14 16:30 PDT
**Branch:** `phase/phase-04-client-side-game-engine`  
**Revision:** working tree based on `8b8931fd2b9ff352892413ac1a0740cf2d10b563`
**Host:** `Jennys-MacBook-Air.local`  
**Repository:** `/Users/jennywadkins/github_repos/personal/yourwolf-monorepo`  
**Paired coverage:** `dev/feature/PHASE_04A-phase-close/test-analysis/coverage-comparison.md`

| Check ID | Surface | Command | Expected | Actual | Status |
|---|---|---|---|---|---|
| A1 | Frontend engine parity | `cd yourwolf-frontend && npm test -- --run src/test/engine` | Exit `0`; no failed files or tests | Exit `0`; 4 files passed, 144 tests passed. Evidence: `A1.stdout`, `A1.stderr`, `A1.exit` | PASS |
| A2 | Backend reference and service oracles | `cd yourwolf-backend && uv run pytest --no-cov tests/test_narration_templates.py tests/test_narration_script_builder.py tests/test_script_service.py tests/test_game_setup_validation.py` | Exit `0`; no failed tests | Exit `0`; 185 tests passed. Evidence: `A2.stdout`, `A2.stderr`, `A2.exit` | PASS |
| A3 | Full frontend regression | `cd yourwolf-frontend && npm test -- --run` | Exit `0`; no failed files or tests | Exit `0`; 46 files passed, 679 tests passed. Stderr contains React Router and React `act(...)` warnings. Evidence: `A3.stdout`, `A3.stderr`, `A3.exit` | PASS |
| A4 | Full backend regression | `cd yourwolf-backend && uv run pytest` | Exit `0`; no failed tests; coverage gate passes | Exit `0`; 492 tests passed, 47,741 warnings; total coverage 96.08%, configured 80% gate passed. Evidence: `A4.stdout`, `A4.stderr`, `A4.exit` | PASS |
| A5 | Frontend lint | `cd yourwolf-frontend && npm run lint` | Exit `0`; no errors or warnings | Exit `0`; no stdout or stderr diagnostics. Evidence: `A5.stdout`, `A5.stderr`, `A5.exit` | PASS |
| A6 | Frontend TypeScript and build | `cd yourwolf-frontend && npm run build` | Exit `0`; TypeScript and Vite production build succeed | Exit `0`; TypeScript completed, 133 modules transformed, Vite build succeeded. Evidence: `A6.stdout`, `A6.stderr`, `A6.exit` | PASS |
| A7 | Frontend coverage | `cd yourwolf-frontend && npm run test:coverage` | Exit `0`; no failed tests; global thresholds pass | Exit `0`; 46 files passed, 679 tests passed; clean-export coverage was 94.34% statements/lines, 95.01% branches, and 93.57% functions. | PASS |
| A8 | Engine coverage threshold | Documented inline Python script | Exit `0`; exact configured coverage sentence | Executable engine coverage was 98.58% lines/statements, 96.14% branches, and 100% functions. | PASS |
| A9 | Fixture provenance and parity | Documented backend inline Python script | Exit `0`; exact parity sentence | Exit `0`; exact expected sentence printed. | PASS |
| A10 | Engine boundary and phase scope | Documented shell script | Exit `0`; exact boundary sentence | Exit `0`; exact expected sentence printed against the complete working tree. | PASS |

### Tally

- Total checks: 10
- PASS: 10
- FAIL: 0
- BLOCKED: 0
- UNRUNNABLE: 0
- EVIDENCE ONLY: 0
