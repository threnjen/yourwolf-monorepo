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
