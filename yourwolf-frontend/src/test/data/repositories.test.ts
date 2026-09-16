import rolesSeed from '../../data/seed/roles.json';
import abilitiesSeed from '../../data/seed/abilities.json';
import {
  createIndexedDbRepositories,
  deleteDatabase,
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
    await repositories.bootstrap();
    expect(await repositories.roles.get(officialRoleId('Villager'))).toEqual(before);
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
    expect(await repositories.games.get('game-1')).toBeNull();
    await repositories.games.put(snapshot);
    expect(await repositories.games.get('game-1')).toEqual(snapshot);
  });

  it('reseeds official records while preserving custom records and removing stale officials', async () => {
    const name = databaseName('reseed');
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
    const nextSeed = {...rolesSeed, roles: rolesSeed.roles.slice(0, -1)};
    await repositories.reseed(nextSeed, abilitiesSeed, SEED_VERSION + 1);
    expect(await repositories.roles.get(custom.id)).toEqual(custom);
    const staleRole = rolesSeed.roles[rolesSeed.roles.length - 1];
    expect(await repositories.roles.get(officialRoleId(staleRole.name))).toBeNull();
    expect(await repositories.metadata.get()).toMatchObject({seed_version: SEED_VERSION + 1});
  });

  it('rolls back seed and metadata when the transaction fails', async () => {
    const name = databaseName('rollback');
    databases.push(name);
    const repositories = await createIndexedDbRepositories({databaseName: name});
    closers.push(repositories.close);
    await repositories.bootstrap();
    const before = await repositories.roles.get(officialRoleId('Villager'));
    await expect(repositories.reseed({...rolesSeed, roles: [{...rolesSeed.roles[0], name: 'Broken'}]}, abilitiesSeed, SEED_VERSION + 1, {failAfter: 0})).rejects.toThrow();
    expect(await repositories.roles.get(officialRoleId('Villager'))).toEqual(before);
    expect(await repositories.metadata.get()).toMatchObject({seed_version: SEED_VERSION});
  });
});
