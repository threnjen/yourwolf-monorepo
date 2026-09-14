import {describe, expect, it} from 'vitest';
import nightFixtureJson from './night-script.fixture.json';
import previewFixtureJson from './preview.fixture.json';
import {
  buildNightScript,
  buildPreview,
  buildRoleScript,
  sortWakingRoles,
  totalDurationSeconds,
} from '../../engine/narration.ts';
import type {
  EngineAbilityStepInput,
  EngineRoleInput,
  NarratorAction,
} from '../../engine/types.ts';

interface NightFixture {
  readonly roles: readonly EngineRoleInput[];
  readonly custom_sequence: readonly string[];
  readonly default: readonly NarratorAction[];
  readonly custom: readonly NarratorAction[];
}

const nightFixture = nightFixtureJson as unknown as NightFixture;
const previewFixture = previewFixtureJson as unknown as Readonly<
  Record<string, readonly {order: number; instruction: string; is_section_header: boolean}[]>
>;

const role = (
  name: string,
  wakeOrder: number | null,
  steps: readonly EngineAbilityStepInput[] = [],
  id = name.toLowerCase(),
): EngineRoleInput => ({
  name,
  wake_target: 'player.self',
  ability_steps: steps,
  id,
  wake_order: wakeOrder,
  team: 'village',
  is_primary_team_role: false,
  min_count: 1,
  max_count: 1,
});

const step = (
  abilityType: string,
  order: number,
  modifier: EngineAbilityStepInput['modifier'] = 'none',
  isRequired = true,
  parameters: Readonly<Record<string, unknown>> = {},
): EngineAbilityStepInput => ({
  ability_type: abilityType,
  order,
  modifier,
  is_required: isRequired,
  parameters,
});

describe('narration engine', () => {
  it('sorts waking roles deterministically and applies custom ordering rules', () => {
    const roles = [
      role('Zulu', 1, [], 'z'),
      role('Alpha', 1, [], 'a'),
      role('Later', 2, [], 'later'),
      role('No Wake', null, [], 'null'),
      role('Zero', 0, [], 'zero'),
    ] as const;

    expect(sortWakingRoles(roles).map(({name}) => name)).toEqual([
      'Alpha',
      'Zulu',
      'Later',
    ]);
    expect(
      sortWakingRoles(roles, ['z', 'unknown', 'later', 'z']).map(({name}) => name),
    ).toEqual(['Later', 'Zulu', 'Alpha']);
    expect(sortWakingRoles(roles, []).map(({name}) => name)).toEqual([
      'Alpha',
      'Zulu',
      'Later',
    ]);
  });

  it('deduplicates ids and sorts unnamed custom roles by wake order and name', () => {
    const duplicate = role('Duplicate', 1, [], 'same');
    const roles = [
      role('Zulu', 2, [], 'z'),
      role('Alpha', 2, [], 'a'),
      duplicate,
      {...duplicate, name: 'Duplicate copy'},
    ] as const;
    const before = structuredClone(roles);

    expect(sortWakingRoles(roles, ['same']).map(({name}) => name)).toEqual([
      'Duplicate',
      'Alpha',
      'Zulu',
    ]);
    expect(roles).toEqual(before);
  });

  it('builds dense role actions and preserves required and OR flags', () => {
    const actions = buildRoleScript(
      role('Seer', 1, [
        step('touch', 3, 'none', false),
        step('view_card', 1, 'or', false, {target: 'player.self'}),
        step('not_known', 2),
      ]),
      7,
    );

    expect(actions.map(({order}) => order)).toEqual([7, 8, 9, 10]);
    expect(actions.map(({instruction}) => instruction)).toEqual([
      'Seer, wake up.',
      'OR You may look at your own card.',
      'Reach out and tap the player next to you.',
      'Seer, close your eyes.',
    ]);
    expect(actions[1]?.requires_player_action).toBe(true);
    expect(actions[2]?.requires_player_action).toBe(false);
  });

  it('builds wake and close-eyes actions for a role without steps', () => {
    const actions = buildRoleScript({...role('Observer', 1), wake_target: null});

    expect(actions).toEqual([
      {
        order: 1,
        role_name: 'Observer',
        instruction: 'Observer, wake up.',
        duration_seconds: 3,
        requires_player_action: false,
      },
      {
        order: 2,
        role_name: 'Observer',
        instruction: 'Observer, close your eyes.',
        duration_seconds: 3,
        requires_player_action: false,
      },
    ]);
  });

  it('skips unknown inherited ability names without duration', () => {
    const unknownTypes = ['constructor', 'toString', '__proto__'];
    const actions = buildRoleScript(
      role(
        'Safe',
        1,
        unknownTypes.map((type, index) => step(type, index + 1, 'or', false)),
      ),
      1,
    );

    expect(actions).toHaveLength(2);
    expect(totalDurationSeconds(actions)).toBe(6);
  });

  it('assembles opening, unique waking role blocks, and closing actions', () => {
    const seer = role('Seer', 2, [step('view_card', 1)]);
    const actions = buildNightScript([seer, role('Sleepy', null), seer]);

    expect(actions.map(({role_name: roleName}) => roleName)).toEqual([
      'Narrator',
      'Seer',
      'Seer',
      'Seer',
      'Narrator',
    ]);
    expect(actions.map(({order}) => order)).toEqual([1, 2, 3, 4, 5]);
    expect(totalDurationSeconds(actions)).toBe(22);
  });

  it('keeps opening and closing actions when no roles wake', () => {
    const actions = buildNightScript([role('Villager', null), role('Tanner', 0)]);

    expect(actions).toHaveLength(2);
    expect(actions[0]?.instruction).toBe('Everyone, close your eyes.');
    expect(actions[1]?.instruction).toBe('Everyone, open your eyes.');
    expect(totalDurationSeconds(actions)).toBe(8);
  });

  it('builds previews with one copied-role section header', () => {
    const preview = buildPreview(
      role('Mimic', 1, [
        step('perform_immediately', 1),
        step('perform_as', 2),
      ]),
    );

    expect(preview).toEqual([
      {order: 1, instruction: 'Mimic, wake up.', is_section_header: false},
      {
        order: 2,
        instruction: "Now perform the copied role's night actions.",
        is_section_header: false,
      },
      {
        order: 3,
        instruction: "At the copied role's normal wake time, perform their night actions.",
        is_section_header: false,
      },
      {order: 4, instruction: 'Mimic, close your eyes.', is_section_header: false},
      {
        order: 5,
        instruction: "Then, at the copied role's wake time, Mimic performs the copied role's night actions.",
        is_section_header: true,
      },
    ]);
  });

  it('returns no preview for null or zero wake order', () => {
    expect(buildPreview(role('Villager', null))).toEqual([]);
    expect(buildPreview(role('Villager', 0))).toEqual([]);
  });

  it('does not mutate generated action inputs', () => {
    const steps = [step('view_card', 2), step('touch', 1)] as const;
    const input = role('Immutable', 1, steps);
    const roles = [input];
    const customSequence = ['immutable'];
    const before = structuredClone({input, roles, customSequence});
    const actions: NarratorAction[] = buildNightScript(roles, customSequence);

    expect(actions).toHaveLength(6);
    expect({input, roles, customSequence}).toEqual(before);
  });

  it('keeps fixture roles in the verified engine input shape', () => {
    const roleKeys = [
      'ability_steps',
      'id',
      'is_primary_team_role',
      'max_count',
      'min_count',
      'name',
      'team',
      'wake_order',
      'wake_target',
    ];
    const stepKeys = [
      'ability_type',
      'is_required',
      'modifier',
      'order',
      'parameters',
    ];

    for (const fixtureRole of nightFixture.roles) {
      expect(Object.keys(fixtureRole).sort()).toEqual(roleKeys);
      for (const fixtureStep of fixtureRole.ability_steps) {
        expect(Object.keys(fixtureStep).sort()).toEqual(stepKeys);
      }
    }
  });

  it('matches the Python-generated night-script fixtures for all seed roles', () => {
    expect(buildNightScript(nightFixture.roles)).toEqual(nightFixture.default);
    expect(
      buildNightScript(nightFixture.roles, nightFixture.custom_sequence),
    ).toEqual(nightFixture.custom);
    expect(nightFixture.roles).toHaveLength(30);
  });

  it('matches the Python-generated previews for all seed roles', () => {
    for (const seedRole of nightFixture.roles) {
      expect(buildPreview(seedRole)).toEqual(previewFixture[seedRole.name]);
    }
    expect(previewFixture.Villager).toEqual([]);
    expect(previewFixture.Tanner).toEqual([]);
    expect(Object.keys(previewFixture)).toHaveLength(30);
  });
});
