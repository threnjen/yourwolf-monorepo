import {describe, expect, test} from 'vitest';

import type {
  EngineAbilityStepInput,
  EngineRoleInput,
  NarratorAction,
  NarratorPreviewAction,
} from '../../engine/types';
import {
  buildStepInstruction,
  buildWakeInstruction,
  getStepDuration,
} from '../../engine/templates';

const step = (
  ability_type: string,
  parameters: Readonly<Record<string, unknown>> = {},
  modifier: EngineAbilityStepInput['modifier'] = 'none',
): EngineAbilityStepInput => ({
  ability_type,
  order: 1,
  modifier,
  is_required: true,
  parameters,
});

const role = (
  wake_target: string | null,
  name = 'Alice',
): EngineRoleInput => ({
  id: 'role-1',
  name,
  wake_order: 1,
  wake_target,
  team: 'village',
  is_primary_team_role: false,
  min_count: 0,
  max_count: 1,
  ability_steps: [],
});

const WAKE_CASES: readonly [string | null, string][] = [
  [null, 'Alice, wake up.'],
  ['player.self', 'Alice, wake up.'],
  [
    'team.werewolf',
    'Werewolves, wake up and look for other werewolves.',
  ],
  ['team.alien', 'Aliens, wake up and look for other aliens.'],
  ['team.vampire', 'Vampires, wake up and look for other vampires.'],
  ['role.doppelganger', 'Alice and doppelganger, wake up.'],
  ['role.the_thing', 'Alice and the thing, wake up.'],
  ['team.unknown', 'Alice, wake up.'],
  ['garbage', 'Alice, wake up.'],
  ['', 'Alice, wake up.'],
];

const INSTRUCTION_CASES: readonly [
  string,
  Readonly<Record<string, unknown>>,
  string | undefined,
][] = [
  ['view_card', {target: 'player.self'}, 'You may look at your own card.'],
  [
    'view_card',
    {target: 'player.other', count: 1},
    "You may look at one other player's card.",
  ],
  [
    'view_card',
    {target: 'player.other', count: 3},
    "You may look at up to 3 other players' cards.",
  ],
  [
    'view_card',
    {target: 'center.main', count: 1},
    'You may look at one card from the center.',
  ],
  [
    'view_card',
    {target: 'center.main', count: 2},
    'You may look at 2 cards from the center.',
  ],
  ['view_card', {target: 'bogus'}, 'You may look at a card.'],
  ['view_card', {}, "You may look at one other player's card."],
  [
    'swap_card',
    {target_a: 'player.self', target_b: 'center.main'},
    'Exchange your card with one from the center.',
  ],
  [
    'swap_card',
    {target_a: 'player.self', target_b: 'player.other'},
    "Exchange your card with another player's card.",
  ],
  [
    'swap_card',
    {target_a: 'center.main', target_b: 'player.self'},
    'Exchange your card with one from the center.',
  ],
  [
    'swap_card',
    {target_a: 'center.main', target_b: 'player.other'},
    "You may swap that center card with any player's card.",
  ],
  [
    'swap_card',
    {target_a: 'player.other', target_b: 'player.other'},
    "You may swap two other players' cards.",
  ],
  ['swap_card', {}, "You may swap two other players' cards."],
  ['take_card', {target: 'center.main'}, 'Take a card from the center.'],
  ['take_card', {target: 'player.other'}, "Take another player's card."],
  ['take_card', {}, "Take another player's card."],
  ['view_awake', {}, 'Look around and see who else is awake.'],
  [
    'thumbs_up',
    {target: 'player.self'},
    'Put your thumb out so others can see it.',
  ],
  ['thumbs_up', {target: 'team.werewolf'}, 'Werewolfs, put your thumbs out.'],
  ['thumbs_up', {target: 'team.alien'}, 'Aliens, put your thumbs out.'],
  ['thumbs_up', {target: 'role.the_thing'}, 'The Thing, put your thumb out.'],
  [
    'thumbs_up',
    {target: 'players.actions'},
    'Everyone who viewed or moved a card tonight, put your thumb out.',
  ],
  ['thumbs_up', {target: 'bogus'}, 'Put your thumb out.'],
  ['thumbs_up', {}, 'Put your thumb out.'],
  ['explicit_no_view', {}, 'Do not look at your new card.'],
  [
    'rotate_all',
    {},
    'You may move all player cards one position to the left.',
  ],
  [
    'rotate_all',
    {direction: 'right'},
    'You may move all player cards one position to the right.',
  ],
  ['touch', {}, 'Reach out and tap the player next to you.'],
  ['flip_card', {}, "You may flip that player's card face up."],
  ['copy_role', {}, 'You are now that role for the rest of the game.'],
  [
    'change_to_team',
    {team: 'werewolf'},
    'If you see a werewolf, you are now on the werewolf team.',
  ],
  ['change_to_team', {}, 'You change teams.'],
  [
    'perform_as',
    {},
    "At the copied role's normal wake time, perform their night actions.",
  ],
  [
    'perform_immediately',
    {},
    "Now perform the copied role's night actions.",
  ],
  ['stop', {}, 'Stop. Do not perform any further actions.'],
  [
    'random_num_players',
    {options: [3]},
    '3 adjacent players are now part of your group.',
  ],
  [
    'random_num_players',
    {options: [2, 3]},
    'A random number of adjacent players (2 or 3) are now part of your group.',
  ],
  [
    'random_num_players',
    {options: [2, 3, 4]},
    'A random number of adjacent players (2, 3, or 4) are now part of your group.',
  ],
  [
    'random_num_players',
    {options: []},
    'A random number of players are selected.',
  ],
  [
    'random_num_players',
    {},
    'A random number of players are selected.',
  ],
  ['unknown_type', {}, undefined],
];

const DURATION_CASES: readonly [string, number][] = [
  ['view_card', 8],
  ['swap_card', 6],
  ['take_card', 6],
  ['view_awake', 5],
  ['thumbs_up', 5],
  ['explicit_no_view', 2],
  ['rotate_all', 8],
  ['touch', 5],
  ['flip_card', 5],
  ['copy_role', 3],
  ['change_to_team', 2],
  ['perform_as', 2],
  ['perform_immediately', 2],
  ['stop', 0],
  ['random_num_players', 5],
];

describe('engine narration templates', () => {
  test.each(WAKE_CASES)('renders wake target %s', (wake_target, expected) => {
    expect(buildWakeInstruction(role(wake_target))).toBe(expected);
  });

  test('rewrites underscores in role wake targets', () => {
    expect(buildWakeInstruction(role('role.the_thing', 'Bob'))).toBe(
      'Bob and the thing, wake up.',
    );
  });

  test('empty wake targets follow the player self path', () => {
    expect(buildWakeInstruction(role(''))).toBe(
      buildWakeInstruction(role('player.self')),
    );
  });

  test.each(INSTRUCTION_CASES)(
    'renders %s with literal parameters',
    (ability_type, parameters, expected) => {
      expect(buildStepInstruction(step(ability_type, parameters))).toBe(
        expected,
      );
    },
  );

  test('OR prefixes a recognized instruction', () => {
    expect(
      buildStepInstruction(step('view_card', {target: 'player.self'}, 'or')),
    ).toBe('OR You may look at your own card.');
  });

  test('OR does not prefix an unknown instruction', () => {
    expect(buildStepInstruction(step('unknown_type', {}, 'or'))).toBeUndefined();
  });

  test.each(['constructor', 'toString', '__proto__'])(
    'treats inherited property %s as an unknown instruction',
    (ability_type) => {
      expect(buildStepInstruction(step(ability_type))).toBeUndefined();
    },
  );

  test.each(['none', 'and', 'if'] as const)(
    'non-OR modifier %s does not prefix',
    (modifier) => {
      expect(
        buildStepInstruction(step('view_card', {target: 'player.self'}, modifier)),
      ).toBe('You may look at your own card.');
    },
  );

  test.each(DURATION_CASES)('uses the duration for %s', (ability_type, expected) => {
    expect(getStepDuration(step(ability_type))).toBe(expected);
  });

  test('unknown durations default to five seconds', () => {
    expect(getStepDuration(step('unknown_type'))).toBe(5);
  });

  test.each(['constructor', 'toString', '__proto__'])(
    'uses the default duration for inherited property %s',
    (ability_type) => {
      expect(getStepDuration(step(ability_type))).toBe(5);
    },
  );

  test('the public shape includes all required engine and narrator fields', () => {
    const engineRole: EngineRoleInput = role(null);
    const engineStep: EngineAbilityStepInput = step('stop');
    const action: NarratorAction = {
      order: 1,
      role_name: 'Alice',
      instruction: 'Stop.',
      duration_seconds: 0,
      requires_player_action: false,
    };
    const previewAction: NarratorPreviewAction = {
      order: 1,
      instruction: 'Stop.',
      is_section_header: false,
    };

    expect(Object.keys(engineRole)).toEqual([
      'id',
      'name',
      'wake_order',
      'wake_target',
      'team',
      'is_primary_team_role',
      'min_count',
      'max_count',
      'ability_steps',
    ]);
    expect(Object.keys(engineStep)).toEqual([
      'ability_type',
      'order',
      'modifier',
      'is_required',
      'parameters',
    ]);
    expect(Object.keys(action)).toEqual([
      'order',
      'role_name',
      'instruction',
      'duration_seconds',
      'requires_player_action',
    ]);
    expect(Object.keys(previewAction)).toEqual([
      'order',
      'instruction',
      'is_section_header',
    ]);
  });
});
