import rolesSeed from '../../data/seed/roles.json';
import abilitiesSeed from '../../data/seed/abilities.json';
import {
  convertSeedCatalog,
  convertSeedRole,
  createCustomRole,
} from '../../data/conversion';
import {officialRoleId, abilityId} from '../../data/ids';
import {SEED_VERSION} from '../../data/seed';
import {describe, expect, it, vi} from 'vitest';

describe('seed conversion', () => {
  it('converts the shipped catalog with defaults and stable nested ids', () => {
    const converted = convertSeedCatalog(rolesSeed, abilitiesSeed, {
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    expect(converted.roles).toHaveLength(30);
    expect(converted.abilities).toHaveLength(15);
    expect(new Set(converted.roles.map((role) => role.id)).size).toBe(30);
    expect(new Set(converted.abilities.map((ability) => ability.id)).size).toBe(15);
    expect(converted.abilities.every((ability) => ability.is_active)).toBe(true);
    const abilityNames = new Map(abilitiesSeed.map((ability) => [ability.type, ability.name]));
    for (const [index, seedRole] of rolesSeed.roles.entries()) {
      const role = converted.roles[index];
      expect(role.default_count).toBe(seedRole.default_count ?? 1);
      expect(role.min_count).toBe(seedRole.min_count ?? 1);
      expect(role.max_count).toBe(seedRole.max_count ?? 1);
      expect(role.is_primary_team_role).toBe(seedRole.is_primary_team_role ?? false);
      expect(role.ability_steps.map((step) => step.id)).toEqual(
        seedRole.ability_steps.map((step) => `${role.id}:step:${step.order}`),
      );
      expect(role.ability_steps.map((step) => step.ability_name)).toEqual(
        seedRole.ability_steps.map((step) => abilityNames.get(step.ability_type)),
      );
      expect(role.win_conditions.map((condition) => condition.id)).toEqual(
        seedRole.win_conditions.map((_, conditionIndex) => `${role.id}:win:${conditionIndex}`),
      );
    }
    expect(converted.roles[0]).toMatchObject({
      id: officialRoleId(converted.roles[0].name),
      visibility: 'official',
      min_count: 1,
      max_count: 3,
      is_primary_team_role: false,
      is_locked: true,
      vote_score: 0,
      use_count: 0,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });
    expect(converted.roles[1].ability_steps[0]).toMatchObject({
      id: `${converted.roles[1].id}:step:1`,
      ability_name: 'View Awake',
    });
    expect(converted.roles[1].win_conditions[0].id).toBe(
      `${converted.roles[1].id}:win:0`,
    );
    expect(converted.abilities[0]).toMatchObject({
      id: abilityId(converted.abilities[0].type),
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    });
  });

  it('resolves dependencies by name and rejects unknown ability types', () => {
    const converted = convertSeedCatalog(rolesSeed, abilitiesSeed);
    const apprentice = converted.roles.find((role) => role.name === 'Apprentice Tanner');
    const tanner = converted.roles.find((role) => role.name === 'Tanner');
    expect(apprentice?.dependencies[0]).toMatchObject({
      required_role_id: tanner?.id,
      required_role_name: 'Tanner',
      dependency_type: 'requires',
    });

    expect(() =>
      convertSeedRole(
        {...rolesSeed.roles[0], name: 'Unknown Ability Role', ability_steps: [{...rolesSeed.roles[1].ability_steps[0], ability_type: 'missing'}]} as unknown as Parameters<typeof convertSeedRole>[0],
        abilitiesSeed,
        {timestamp: '2026-01-01T00:00:00.000Z'},
      ),
    ).toThrow('Unknown ability type');
  });

  it('rejects generated id collisions in roles, abilities, steps, and dependencies', () => {
    const duplicateRoleNames = {
      ...rolesSeed,
      roles: [
        rolesSeed.roles[0],
        {...rolesSeed.roles[1], name: rolesSeed.roles[0].name.toLowerCase()},
      ],
    };
    expect(() => convertSeedCatalog(duplicateRoleNames, abilitiesSeed)).toThrow(
      'Duplicate generated role id',
    );

    const duplicateAbilityTypes = [
      abilitiesSeed[0],
      {...abilitiesSeed[1], type: abilitiesSeed[0].type.toUpperCase()},
    ];
    expect(() => convertSeedCatalog(rolesSeed, duplicateAbilityTypes)).toThrow(
      'Duplicate generated ability id',
    );

    const werewolf = rolesSeed.roles[1];
    const duplicateStepOrders = {
      ...rolesSeed,
      roles: [
        {...werewolf, ability_steps: [
          werewolf.ability_steps[0],
          {...werewolf.ability_steps[1], order: werewolf.ability_steps[0].order},
        ]},
      ],
      role_dependencies: [],
    };
    expect(() => convertSeedCatalog(duplicateStepOrders, abilitiesSeed)).toThrow(
      'Duplicate generated step id',
    );

    const duplicateDependencies = {
      roles: [
        {...rolesSeed.roles[0], name: 'Source'},
        {...rolesSeed.roles[1], name: 'Target'},
      ],
      role_dependencies: [
        {source: 'Source', target: 'Target', dependency_type: 'requires' as const},
        {source: 'Source', target: 'Target', dependency_type: 'recommends' as const},
      ],
    };
    expect(() => convertSeedCatalog(duplicateDependencies, abilitiesSeed)).toThrow(
      'Duplicate generated dependency id',
    );
  });

  it('creates private custom roles with a UUID and local defaults', () => {
    const randomUuid = vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001');
    const role = createCustomRole({
      id: 'draft-id',
      name: 'Custom',
      description: 'A custom role',
      team: 'village',
      wake_order: null,
      wake_target: null,
      votes: 1,
      is_primary_team_role: false,
      ability_steps: [],
      win_conditions: [],
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });
    expect(role).toMatchObject({
      id: '00000000-0000-4000-8000-000000000001',
      visibility: 'private',
      is_locked: false,
      default_count: 1,
      min_count: 1,
      max_count: 1,
      dependencies: [],
    });
    randomUuid.mockRestore();
  });

  it('exports a positive seed version', () => {
    expect(SEED_VERSION).toBeGreaterThan(0);
  });
});
