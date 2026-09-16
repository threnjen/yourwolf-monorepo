import {describe, expect, it} from 'vitest';
import {
  getRoleWarnings,
  hasRoleNameCollision,
  validateRoleDraft,
} from '../../domain/roleValidation';
import type {AbilityStepDraft, RoleDraft, WinConditionDraft} from '../../domain/roleDraft';

// Literal oracle transcribed from backend TestValidateRole, TestValidateRoleModule,
// TestRoleNameLengthBounds, TestGetWarnings, and TestGetWarningsModule.
// Excluded: TestValidateEndpoint, TestCheckNameEndpoint, and
// TestCreateValidateAgreement because they require HTTP/database integration.
// TestRoleRulePrecedence is caller-composition coverage owned by Feature 2.
// Deliberate frontend-only divergences: the trimmed 50-character error and the
// local collision message "Name is already taken".

const VALID_ABILITY = {type: 'view_card', is_active: true};

function makeStep(
  id: string,
  order: number,
  modifier: AbilityStepDraft['modifier'] = 'none',
  abilityType = 'view_card',
): AbilityStepDraft {
  return {
    id,
    order,
    modifier,
    is_required: true,
    parameters: {},
    ability_type: abilityType,
    ability_name: abilityType,
  };
}

function makeWinCondition(id: string, isPrimary: boolean): WinConditionDraft {
  return {
    id,
    condition_type: 'team_wins',
    is_primary: isPrimary,
    overrides_team: false,
  };
}

function makeDraft(overrides: Partial<RoleDraft> = {}): RoleDraft {
  return {
    id: 'role-1',
    name: 'Test Role',
    description: 'A test role',
    team: 'village',
    wake_order: 1,
    wake_target: null,
    votes: 1,
    is_primary_team_role: false,
    ability_steps: [],
    win_conditions: [makeWinCondition('win-1', true)],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('validateRoleDraft', () => {
  it('returns a transport-compatible valid result for a valid draft', () => {
    expect(validateRoleDraft(makeDraft(), [VALID_ABILITY])).toEqual({
      is_valid: true,
      errors: [],
      warnings: [],
    });
  });

  it('preserves backend error ordering for several independent violations', () => {
    const draft = makeDraft({
      name: '  a  ',
      ability_steps: [
        makeStep('step-2', 2, 'and', 'missing'),
        makeStep('step-1', 1, 'or', 'inactive'),
        makeStep('step-1b', 1, 'and'),
      ],
      win_conditions: [],
    });

    expect(validateRoleDraft(draft, [{type: 'inactive', is_active: false}, VALID_ABILITY])).toEqual({
      is_valid: false,
      errors: [
        'Role name must be at least 2 characters.',
        "The first ability step must have modifier 'none'.",
        "Ability type 'missing' is not a valid active ability.",
        "Ability type 'inactive' is not a valid active ability.",
        'Ability step orders must not have duplicates.',
        'At least one win condition is required.',
      ],
      warnings: [],
    });
  });

  it('reports the frontend-only trimmed upper-bound error', () => {
    expect(validateRoleDraft(makeDraft({name: `  ${'x'.repeat(51)}  `}), [])).toMatchObject({
      is_valid: false,
      errors: ['Role name must be at most 50 characters.'],
    });
  });

  it('reports the lower-bound error for a one-character name', () => {
    expect(validateRoleDraft(makeDraft({name: 'a'}), []).errors).toEqual([
      'Role name must be at least 2 characters.',
    ]);
  });

  it('reports a trimmed one-character name and accepts the two-character boundary', () => {
    expect(validateRoleDraft(makeDraft({name: ' a '}), []).errors).toEqual([
      'Role name must be at least 2 characters.',
    ]);
    expect(validateRoleDraft(makeDraft({name: 'ab'}), []).errors).toEqual([]);
  });

  it('rejects a whitespace-only name and accepts the 50-character boundary', () => {
    expect(validateRoleDraft(makeDraft({name: '     '}), []).errors).toEqual([
      'Role name must be at least 2 characters.',
    ]);
    expect(validateRoleDraft(makeDraft({name: 'x'.repeat(50)}), []).errors).toEqual([]);
  });

  it('uses the lowest-order step for the first-step modifier rule', () => {
    const draft = makeDraft({
      ability_steps: [makeStep('later', 2, 'none'), makeStep('first', 1, 'and')],
    });

    expect(validateRoleDraft(draft, [VALID_ABILITY]).errors).toEqual([
      "The first ability step must have modifier 'none'.",
    ]);
  });

  it('reports absent and inactive abilities in draft order with one literal message', () => {
    const draft = makeDraft({
      ability_steps: [
        makeStep('one', 1, 'none', 'absent'),
        makeStep('two', 2, 'and', 'inactive'),
        makeStep('three', 3, 'and', 'absent'),
      ],
    });

    expect(validateRoleDraft(draft, [{type: 'inactive', is_active: false}]).errors).toEqual([
      "Ability type 'absent' is not a valid active ability.",
      "Ability type 'inactive' is not a valid active ability.",
      "Ability type 'absent' is not a valid active ability.",
    ]);
  });

  it('reports a duplicate-order error instead of a gap error', () => {
    const draft = makeDraft({
      ability_steps: [makeStep('one', 1), makeStep('two', 1, 'and'), makeStep('three', 3, 'and')],
    });

    expect(validateRoleDraft(draft, [VALID_ABILITY]).errors).toEqual([
      'Ability step orders must not have duplicates.',
    ]);
  });

  it('reports a gap when distinct orders do not start at one sequentially', () => {
    const draft = makeDraft({
      ability_steps: [makeStep('one', 1), makeStep('three', 3, 'and')],
    });

    expect(validateRoleDraft(draft, [VALID_ABILITY]).errors).toEqual([
      'Ability step orders must be sequential starting at 1 with no gaps.',
    ]);
  });

  it('reports each win-condition cardinality rule with the backend wording', () => {
    expect(validateRoleDraft(makeDraft({win_conditions: []}), []).errors).toEqual([
      'At least one win condition is required.',
    ]);
    expect(validateRoleDraft(makeDraft({win_conditions: [makeWinCondition('one', false)]}), []).errors).toEqual([
      'Exactly one win condition must be marked as primary.',
    ]);
    expect(validateRoleDraft(makeDraft({win_conditions: [
      makeWinCondition('one', true),
      makeWinCondition('two', true),
      makeWinCondition('three', true),
    ]}), []).errors).toEqual([
      'Exactly one win condition must be marked as primary (found 3).',
    ]);
  });

  it('does not report step-specific errors for an empty step list', () => {
    expect(validateRoleDraft(makeDraft(), []).errors).toEqual([]);
  });

  it('returns an independent error list without throwing for an invalid draft', () => {
    const errors = validateRoleDraft(makeDraft({win_conditions: []}), []).errors;

    expect(errors).toEqual(['At least one win condition is required.']);
    expect(Array.isArray(errors)).toBe(true);
  });
});

describe('getRoleWarnings', () => {
  it('returns no warnings for a plain role', () => {
    expect(getRoleWarnings(makeDraft())).toEqual([]);
  });

  it('returns backend warnings in their declared order', () => {
    const steps = Array.from({length: 6}, (_, index) => makeStep(
      `step-${index}`,
      index + 1,
      index === 0 ? 'none' : 'and',
      index === 0 ? 'copy_role' : index === 1 ? 'change_to_team' : 'view_card',
    ));

    expect(getRoleWarnings(makeDraft({wake_order: null, ability_steps: steps}))).toEqual([
      'This role has more than 5 ability steps, which may make it complex to balance.',
      'This role has ability steps but no wake_order set. It may not execute its abilities without a wake order.',
      "Using both 'copy_role' and 'change_to_team' abilities may cause conflicts.",
    ]);
  });

  it('keeps warnings non-blocking', () => {
    const draft = makeDraft({
      wake_order: null,
      ability_steps: [makeStep('one', 1)],
    });

    expect(validateRoleDraft(draft, [VALID_ABILITY])).toEqual({
      is_valid: true,
      errors: [],
      warnings: [
        'This role has ability steps but no wake_order set. It may not execute its abilities without a wake order.',
      ],
    });
  });

  it('reports the many-step warning independently', () => {
    const steps = Array.from({length: 6}, (_, index) => makeStep(
      `step-${index}`,
      index + 1,
      index === 0 ? 'none' : 'and',
    ));

    expect(getRoleWarnings(makeDraft({ability_steps: steps}))).toContain(
      'This role has more than 5 ability steps, which may make it complex to balance.',
    );
  });

  it('reports the conflicting-ability warning independently', () => {
    const steps = [makeStep('copy', 1, 'none', 'copy_role'), makeStep('team', 2, 'and', 'change_to_team')];

    expect(getRoleWarnings(makeDraft({ability_steps: steps}))).toEqual([
      "Using both 'copy_role' and 'change_to_team' abilities may cause conflicts.",
    ]);
  });
});

describe('hasRoleNameCollision', () => {
  it('returns false for a novel name', () => {
    expect(hasRoleNameCollision([{name: 'Villager'}], 'Unique Hero')).toBe(false);
  });

  it('trims and compares case-insensitively across private and official local roles', () => {
    const roles = [{name: 'Private Hero'}, {name: 'Official Hero'}];

    expect(hasRoleNameCollision(roles, '  pRiVaTe HeRo  ')).toBe(true);
    expect(hasRoleNameCollision(roles, ' official hero ')).toBe(true);
  });

  it('returns false for an empty normalized name or no matching role', () => {
    const roles = [{name: 'Private Hero'}];

    expect(hasRoleNameCollision(roles, '   ')).toBe(false);
    expect(hasRoleNameCollision(roles, 'Another Hero')).toBe(false);
  });

  it('treats a private local role as taken, unlike the backend public-role filter', () => {
    expect(hasRoleNameCollision([{name: 'My Custom'}], 'My Custom')).toBe(true);
  });
});
