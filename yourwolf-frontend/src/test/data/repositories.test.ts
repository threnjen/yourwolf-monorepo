import rolesSeed from '../../data/seed/roles.json';
import abilitiesSeed from '../../data/seed/abilities.json';
import {
  createIndexedDbRepositories,
  deleteDatabase,
  openDatabase,
} from '../../data/indexeddb';
import {createCustomRole} from '../../data/conversion';
import {officialRoleId} from '../../data/ids';
import {SEED_VERSION} from '../../data/seed';
import type {GameSnapshot} from '../../data/records';
import {afterEach, describe, expect, it} from 'vitest';

const databaseName = (name: string) => `yourwolf-test-${name}-${crypto.randomUUID()}`;
const databases: string[] = [];
const closers: Array<() => void> = [];

afterEach(async () => {
  for (const close of closers.splice(0)) {
    close();
  }
  for (const name of databases.splice(0)) {
    await deleteDatabase(name);
  }
});

describe('IndexedDB repositories', () => {
  it('bootstraps 30 official roles, 15 abilities, and metadata', async () => {
    const name = databaseName('initial');
    databases.push(name);
    const repositories = await createIndexedDbRepositories({databaseName: name});
    closers.push(repositories.close);
    await repositories.bootstrap();

    expect((await repositories.roles.list()).length).toBe(30);
    expect((await repositories.abilities.list()).length).toBe(15);
    expect(await repositories.metadata.get()).toMatchObject({id: 'seed', seed_version: SEED_VERSION});
  });

  it('does nothing for a matching seed version', async () => {
    const name = databaseName('noop');
    databases.push(name);
    const repositories = await createIndexedDbRepositories({databaseName: name});
    closers.push(repositories.close);
    await repositories.bootstrap();
    const before = await repositories.roles.get(officialRoleId('Villager'));
    const beforeMetadata = await repositories.metadata.get();
    await repositories.bootstrap();
    expect(await repositories.roles.get(officialRoleId('Villager'))).toEqual(before);
    expect(await repositories.metadata.get()).toEqual(beforeMetadata);
  });

  it('lists by team and visibility, gets, puts, deletes, and returns null when missing', async () => {
    const name = databaseName('crud');
    databases.push(name);
    const repositories = await createIndexedDbRepositories({databaseName: name});
    closers.push(repositories.close);
    await repositories.bootstrap();
    const custom = createCustomRole({
      id: 'draft', name: 'Local', description: '', team: 'village', wake_order: null,
      wake_target: null, votes: 1, is_primary_team_role: false, ability_steps: [],
      win_conditions: [], created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    });
    await repositories.roles.put(custom);
    expect((await repositories.roles.list({team: 'village', visibility: 'private'})).map((role) => role.id)).toEqual([custom.id]);
    expect(await repositories.roles.get(custom.id)).toEqual(custom);
    await repositories.roles.delete(custom.id);
    expect(await repositories.roles.get(custom.id)).toBeNull();
  });

  it('stores and loads a game snapshot with null-on-missing semantics', async () => {
    const name = databaseName('games');
    databases.push(name);
    const repositories = await createIndexedDbRepositories({databaseName: name});
    closers.push(repositories.close);
    const snapshot: GameSnapshot = {
      session: {
        id: 'game-1', player_count: 3, center_card_count: 3,
        discussion_timer_seconds: 300, role_ids: [], phase: 'setup',
        current_wake_order: null, warnings: [],
      },
      roles: [],
    };
    const completeSnapshot: GameSnapshot = {
      ...snapshot,
      session: {...snapshot.session, id: 'game-2', phase: 'complete'},
    };
    expect(await repositories.games.get('game-1')).toBeNull();
    await repositories.games.put(snapshot);
    await repositories.games.put(completeSnapshot);
    expect(await repositories.games.get('game-1')).toEqual(snapshot);
    expect(await repositories.games.get('game-2')).toEqual(completeSnapshot);
    expect(await repositories.games.get('missing')).toBeNull();
  });

  it('treats malformed game rows as missing', async () => {
    const name = databaseName('malformed-games');
    databases.push(name);
    const repositories = await createIndexedDbRepositories({databaseName: name});
    closers.push(repositories.close);
    const snapshot: GameSnapshot = {
      session: {
        id: 'game-1', player_count: 3, center_card_count: 3,
        discussion_timer_seconds: 300, role_ids: [], phase: 'setup',
        current_wake_order: null, warnings: [],
      },
      roles: [],
    };
    const database = await openDatabase(name);
    await database.put(
      'games',
      {id: 'game-1', updated_at: 42 as unknown as string, snapshot},
      'game-1',
    );
    await database.put(
      'games',
      {
        id: 'mismatched-game',
        updated_at: '2026-01-01T00:00:00.000Z',
        snapshot,
      },
      'mismatched-game',
    );
    await database.put(
      'games',
      {
        id: 'stored-id',
        updated_at: '2026-01-01T00:00:00.000Z',
        snapshot: {...snapshot, session: {...snapshot.session, id: 'stored-id'}},
      },
      'lookup-id',
    );
    await database.put(
      'games',
      {
        id: 'partial',
        updated_at: '2026-01-01T00:00:00.000Z',
        snapshot: {session: {...snapshot.session, id: 'partial'}},
      } as never,
      'partial',
    );
    await database.put(
      'games',
      {
        id: 'array-snapshot',
        updated_at: '2026-01-01T00:00:00.000Z',
        snapshot: [],
      } as never,
      'array-snapshot',
    );
    database.close();

    expect(await repositories.games.get('game-1')).toBeNull();
    expect(await repositories.games.get('mismatched-game')).toBeNull();
    expect(await repositories.games.get('lookup-id')).toBeNull();
    expect(await repositories.games.get('partial')).toBeNull();
    expect(await repositories.games.get('array-snapshot')).toBeNull();
  });

  it('treats malformed snapshot roles and arrays as missing', async () => {
    const name = databaseName('malformed-shapes');
    databases.push(name);
    const repositories = await createIndexedDbRepositories({databaseName: name});
    closers.push(repositories.close);
    await repositories.bootstrap();
    const snapshot: GameSnapshot = {
      session: {
        id: 'game-1', player_count: 3, center_card_count: 3,
        discussion_timer_seconds: 300, role_ids: [], phase: 'setup',
        current_wake_order: null, warnings: [],
      },
      roles: [],
    };
    const invalidTeamRole = {
      id: 'role-1', name: 'Role', wake_target: null, wake_order: null,
      ability_steps: [], is_primary_team_role: false, min_count: 1,
      max_count: 1, team: 'unknown',
    } as never;
    const invalidParametersRole = {
      id: 'role-1', name: 'Role', wake_target: null, wake_order: null,
      is_primary_team_role: false, min_count: 1, max_count: 1, team: 'village',
      ability_steps: [{
        ability_type: 'view_card', order: 1, modifier: 'none', is_required: true,
        parameters: [],
      }],
    } as never;
    const database = await openDatabase(name);
    await database.put(
      'games',
      {
        id: 'invalid-team',
        updated_at: '2026-01-01T00:00:00.000Z',
        snapshot: {
          ...snapshot,
          session: {...snapshot.session, id: 'invalid-team'},
          roles: [invalidTeamRole],
        },
      } as never,
      'invalid-team',
    );
    await database.put(
      'games',
      {
        id: 'invalid-parameters',
        updated_at: '2026-01-01T00:00:00.000Z',
        snapshot: {
          ...snapshot,
          session: {...snapshot.session, id: 'invalid-parameters'},
          roles: [invalidParametersRole],
        },
      } as never,
      'invalid-parameters',
    );
    await database.put('games', [] as never, 'invalid-array');
    database.close();

    expect(await repositories.games.get('invalid-team')).toBeNull();
    expect(await repositories.games.get('invalid-parameters')).toBeNull();
    expect(await repositories.games.get('invalid-array')).toBeNull();
  });

  it('reseeds official records while preserving custom records and removing stale officials', async () => {
    const name = databaseName('reseed');
    databases.push(name);
    const repositories = await createIndexedDbRepositories({databaseName: name});
    closers.push(repositories.close);
    await repositories.bootstrap();
    const custom = {
      ...createCustomRole({
        id: 'draft', name: 'Local', description: '', team: 'village', wake_order: null,
        wake_target: null, votes: 1, is_primary_team_role: false, ability_steps: [],
        win_conditions: [], created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
      }),
      dependencies: [{
        id: 'draft:dependency:official-role:tanner',
        required_role_id: officialRoleId('Tanner'),
        required_role_name: 'Tanner',
        dependency_type: 'requires' as const,
      }],
    };
    await repositories.roles.put(custom);
    const nextSeed = {...rolesSeed, roles: rolesSeed.roles.slice(0, -1)};
    await repositories.reseed(nextSeed, abilitiesSeed, SEED_VERSION + 1);
    expect(await repositories.roles.get(custom.id)).toEqual(custom);
    const tanner = await repositories.roles.get(officialRoleId('Tanner'));
    expect(tanner?.id).toBe(officialRoleId('Tanner'));
    const staleRole = rolesSeed.roles[rolesSeed.roles.length - 1];
    expect(await repositories.roles.get(officialRoleId(staleRole.name))).toBeNull();
    expect(await repositories.metadata.get()).toMatchObject({seed_version: SEED_VERSION + 1});
  });

  it('rolls back every store after a partial seed transaction failure', async () => {
    const name = databaseName('rollback');
    databases.push(name);
    const repositories = await createIndexedDbRepositories({databaseName: name});
    closers.push(repositories.close);
    await repositories.bootstrap();
    const beforeRoles = await repositories.roles.list();
    const beforeAbilities = await repositories.abilities.list();
    const beforeMetadata = await repositories.metadata.get();
    await expect(
      repositories.reseed(
        {...rolesSeed, roles: [{...rolesSeed.roles[0], name: 'Broken'}]},
        abilitiesSeed,
        SEED_VERSION + 1,
        {failAfter: 1},
      ),
    ).rejects.toThrow();
    expect(await repositories.roles.list()).toEqual(beforeRoles);
    expect(await repositories.abilities.list()).toEqual(beforeAbilities);
    expect(await repositories.metadata.get()).toEqual(beforeMetadata);
  });
});
