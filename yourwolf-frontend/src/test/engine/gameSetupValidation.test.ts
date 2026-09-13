import {describe, expect, test} from 'vitest';

import type {EngineRoleInput} from '../../engine/types';
import {
  type RoleDependencyInput,
  type SetupValidationInput,
  validateGameSetup,
} from '../../engine/gameSetupValidation';

const role = (
  id: string,
  name: string,
  overrides: Partial<EngineRoleInput> = {},
): EngineRoleInput => ({
  id,
  name,
  wake_order: null,
  wake_target: null,
  team: 'village',
  is_primary_team_role: false,
  min_count: 1,
  max_count: 1,
  ability_steps: [],
  ...overrides,
});

const ROLES: readonly EngineRoleInput[] = [
  role('ww', 'Werewolf', {
    wake_order: 1,
    team: 'werewolf',
    is_primary_team_role: true,
    max_count: 2,
  }),
  role('minion', 'Minion', {team: 'werewolf'}),
  role('squire', 'Squire', {team: 'werewolf'}),
  role('seer', 'Seer', {wake_order: 4}),
  role('robber', 'Robber', {wake_order: 3}),
  role('troublemaker', 'Troublemaker', {wake_order: 5}),
  role('insomniac', 'Insomniac', {wake_order: 9}),
  role('villager', 'Villager', {max_count: 3}),
  role('mason', 'Mason', {min_count: 2, max_count: 2}),
  role('apprentice', 'Apprentice Tanner'),
  role('tanner', 'Tanner'),
  role('beholder', 'Beholder'),
  role('vampire-minion', 'Vampire Minion', {
    team: 'vampire',
  }),
  role('alien-minion', 'Alien Minion', {
    team: 'alien',
  }),
  role('villager-0', 'Villager0'),
  role('villager-1', 'Villager1'),
  role('villager-2', 'Villager2'),
  role('villager-3', 'Villager3'),
  role('villager-4', 'Villager4'),
  role('villager-5', 'Villager5'),
  role('villager-6', 'Villager6'),
  role('villager-7', 'Villager7'),
];

const DEPENDENCIES: readonly RoleDependencyInput[] = [
  {
    role_id: 'apprentice',
    required_role_id: 'tanner',
    dependency_type: 'requires',
  },
  {
    role_id: 'beholder',
    required_role_id: 'seer',
    dependency_type: 'recommends',
  },
];

const validRoleIds = (): string[] => [
  'ww',
  'ww',
  'seer',
  'robber',
  'villager',
  'villager',
  'villager',
  'insomniac',
];

const validInput = (
  overrides: Partial<SetupValidationInput> = {},
): SetupValidationInput => ({
  player_count: 5,
  center_card_count: 3,
  discussion_timer_seconds: 300,
  role_ids: validRoleIds(),
  roles: ROLES,
  dependencies: DEPENDENCIES,
  ...overrides,
});

const expectError = (input: SetupValidationInput, message: string): void => {
  expect(() => validateGameSetup(input)).toThrow(new Error(message));
};

describe('engine setup validation', () => {
  test('returns no warnings for a valid setup', () => {
    expect(validateGameSetup(validInput())).toEqual({warnings: []});
  });

  test('normalizes a valid wake order sequence to strings', () => {
    const sequence = ['ww', 'robber', 'seer', 'insomniac'];
    expect(validateGameSetup(validInput({wake_order_sequence: sequence}))).toEqual({
      warnings: [],
      wake_order_sequence: sequence,
    });
  });

  test('rejects a broken setup', () => {
    expectError(
      validInput({role_ids: ['villager']}),
      'Must select exactly 8 roles (5 players + 3 center)',
    );
  });
});

describe('engine setup rule precedence', () => {
  test('count rule precedes unknown role id check', () => {
    expectError(
      validInput({role_ids: ['ww', 'unknown']}),
      'Must select exactly 8 roles (5 players + 3 center)',
    );
  });

  test('unknown role id precedes card count rule', () => {
    expectError(
      validInput({
        role_ids: ['ww', 'ww', 'ww', 'unknown', 'villager', 'villager', 'villager', 'insomniac'],
      }),
      'Unknown role IDs: unknown',
    );
  });

  test('card count rule precedes primary team rule', () => {
    expectError(
      validInput({
        role_ids: ['squire', 'squire', 'seer', 'robber', 'villager', 'villager', 'villager', 'insomniac'],
      }),
      "'Squire' allows at most 1 card(s), but 2 provided",
    );
  });

  test('primary team rule precedes dependency rule', () => {
    expectError(
      validInput({
        role_ids: ['squire', 'apprentice', 'seer', 'robber', 'villager', 'villager', 'villager', 'insomniac'],
      }),
      "'werewolf' team requires at least one primary role (e.g., Werewolf)",
    );
  });

  test('dependency rule precedes wake sequence rule', () => {
    expectError(
      validInput({
        role_ids: ['ww', 'ww', 'apprentice', 'seer', 'villager', 'villager', 'villager', 'insomniac'],
        wake_order_sequence: [],
      }),
      "'Apprentice Tanner' requires 'Tanner' to be in the game",
    );
  });
});

describe('engine create-boundary setup cases', () => {
  test('rejects an unknown role id', () => {
    expectError(
      validInput({role_ids: ['ww', 'ww', 'seer', 'robber', 'villager', 'villager', 'villager', 'unknown']}),
      'Unknown role IDs: unknown',
    );
  });

  test('rejects multiple unknown role ids', () => {
    expectError(
      validInput({role_ids: ['ww', 'ww', 'seer', 'robber', 'villager', 'villager', 'unknown-a', 'unknown-b']}),
      'Unknown role IDs: unknown-a, unknown-b',
    );
  });

  test('rejects too few roles', () => {
    expectError(
      validInput({role_ids: ['ww', 'ww', 'seer', 'robber', 'villager']}),
      'Must select exactly 8 roles (5 players + 3 center)',
    );
  });

  test('rejects too many roles', () => {
    expectError(
      validInput({
        player_count: 4,
        role_ids: [...validRoleIds(), 'villager'],
      }),
      'Must select exactly 7 roles (4 players + 3 center)',
    );
  });

  test('accepts an exact role count', () => {
    expect(validateGameSetup(validInput())).toEqual({warnings: []});
  });

  test('count rule precedes unknown role id check', () => {
    expectError(
      validInput({role_ids: ['ww', 'unknown', 'villager', 'villager', 'villager']}),
      'Must select exactly 8 roles (5 players + 3 center)',
    );
  });

  test('rejects exceeding max count', () => {
    expectError(
      validInput({role_ids: ['ww', 'ww', 'ww', 'seer', 'villager', 'villager', 'villager', 'robber']}),
      "'Werewolf' allows at most 2 card(s), but 3 provided",
    );
  });

  test('rejects below min count', () => {
    expectError(
      validInput({role_ids: ['mason', 'ww', 'seer', 'robber', 'villager', 'villager', 'villager', 'insomniac']}),
      "'Mason' requires at least 2 card(s), but only 1 provided",
    );
  });

  test('accepts valid card counts', () => {
    expect(
      validateGameSetup(
        validInput({
          role_ids: ['ww', 'ww', 'seer', 'robber', 'troublemaker', 'insomniac', 'villager', 'villager'],
        }),
      ),
    ).toEqual({warnings: []});
  });

  test('rejects a missing required dependency', () => {
    expectError(
      validInput({role_ids: ['ww', 'ww', 'seer', 'robber', 'apprentice', 'villager', 'villager', 'villager']}),
      "'Apprentice Tanner' requires 'Tanner' to be in the game",
    );
  });

  test('accepts a satisfied required dependency', () => {
    expect(
      validateGameSetup(
        validInput({
          role_ids: ['ww', 'ww', 'seer', 'apprentice', 'tanner', 'villager', 'villager', 'villager'],
        }),
      ),
    ).toEqual({warnings: []});
  });

  test('warns on a missing recommends dependency', () => {
    expect(
      validateGameSetup(
        validInput({
          role_ids: ['beholder', 'ww', 'robber', 'troublemaker', 'insomniac', 'villager', 'villager', 'villager'],
        }),
      ),
    ).toEqual({
      warnings: ["'Beholder' works best with 'Seer' in the game"],
    });
  });

  test('returns no warnings when recommends is satisfied', () => {
    expect(
      validateGameSetup(
        validInput({
          role_ids: ['beholder', 'ww', 'seer', 'robber', 'troublemaker', 'villager', 'villager', 'villager'],
        }),
      ),
    ).toEqual({warnings: []});
  });

  test('rejects only a minion without a primary wolf', () => {
    expectError(
      validInput({role_ids: ['minion', 'seer', 'robber', 'troublemaker', 'insomniac', 'villager', 'villager', 'villager']}),
      "'werewolf' team requires at least one primary role (e.g., Werewolf)",
    );
  });

  test('accepts a werewolf and minion', () => {
    expect(
      validateGameSetup(
        validInput({role_ids: ['ww', 'minion', 'seer', 'robber', 'troublemaker', 'villager', 'villager', 'villager']}),
      ),
    ).toEqual({warnings: []});
  });

  test('rejects only a squire without a primary wolf', () => {
    expectError(
      validInput({role_ids: ['squire', 'seer', 'robber', 'troublemaker', 'insomniac', 'villager', 'villager', 'villager']}),
      "'werewolf' team requires at least one primary role (e.g., Werewolf)",
    );
  });

  test('rejects multiple teams without primary roles', () => {
    expectError(
      validInput({role_ids: ['squire', 'vampire-minion', 'seer', 'robber', 'troublemaker', 'villager', 'villager', 'villager']}),
      "'werewolf' team requires at least one primary role (e.g., Werewolf); 'vampire' team requires at least one primary role (e.g., Werewolf)",
    );
  });

  test('stores a valid wake order sequence', () => {
    const sequence = ['insomniac', 'robber', 'seer', 'ww'];
    expect(validateGameSetup(validInput({wake_order_sequence: sequence}))).toEqual({
      warnings: [],
      wake_order_sequence: sequence,
    });
  });

  test('rejects an extra role in the sequence', () => {
    expectError(
      validInput({wake_order_sequence: ['ww', 'robber', 'seer', 'insomniac', 'outside']}),
      'wake_order_sequence contains IDs not in role_ids',
    );
  });

  test('rejects a missing waking role in the sequence', () => {
    expectError(
      validInput({wake_order_sequence: ['ww', 'robber', 'seer']}),
      'Missing waking role(s) from wake_order_sequence: Insomniac',
    );
  });

  test('rejects duplicate ids in the sequence', () => {
    expectError(
      validInput({wake_order_sequence: ['ww', 'robber', 'seer', 'insomniac', 'ww']}),
      'Duplicate IDs found in wake_order_sequence',
    );
  });

  test('accepts an omitted sequence', () => {
    expect(validateGameSetup(validInput())).toEqual({warnings: []});
  });

  test('accepts an empty sequence with no waking roles', () => {
    const nonWakingRoles = ROLES.filter((item) => item.id.startsWith('villager-'));
    expect(
      validateGameSetup(
        validInput({
          role_ids: nonWakingRoles.map((item) => item.id),
          roles: nonWakingRoles,
          wake_order_sequence: [],
        }),
      ),
    ).toEqual({warnings: [], wake_order_sequence: []});
  });

  test('rejects a non-waking role in the sequence', () => {
    expectError(
      validInput({wake_order_sequence: ['ww', 'robber', 'seer', 'insomniac', 'villager']}),
      'wake_order_sequence contains IDs that are not waking roles',
    );
  });
});

describe('engine setup edge paths', () => {
  test('checks vampire primary roles', () => {
    expectError(
      validInput({
        role_ids: ['vampire-minion', 'ww', 'seer', 'robber', 'troublemaker', 'villager', 'villager', 'villager'],
      }),
      "'vampire' team requires at least one primary role (e.g., Werewolf)",
    );
  });

  test('checks alien primary roles', () => {
    expectError(
      validInput({
        role_ids: ['alien-minion', 'ww', 'seer', 'robber', 'troublemaker', 'villager', 'villager', 'villager'],
      }),
      "'alien' team requires at least one primary role (e.g., Werewolf)",
    );
  });
});
