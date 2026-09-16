import {deleteDB, openDB, type DBSchema, type IDBPDatabase} from 'idb';
import {TEAMS, type Team} from '../domain/teams';
import {convertSeedCatalog} from './conversion';
import {ABILITY_SEED, ROLE_SEED, SEED_VERSION} from './seed';
import type {
  AbilityRecord,
  GameSnapshot,
  MetadataRecord,
  RoleRecord,
  Visibility,
} from './records';
import type {
  AbilityRepository,
  GameRepository,
  MetadataRepository,
  RoleListFilters,
  RoleRepository,
} from './repositories';

export const DATABASE_NAME = 'yourwolf-local';
const DATABASE_VERSION = 1;
const METADATA_ID = 'seed';

interface GameSnapshotRecord {
  id: string;
  updated_at: string;
  snapshot: GameSnapshot;
}

interface YourwolfDatabase extends DBSchema {
  roles: {key: string; value: RoleRecord};
  abilities: {key: string; value: AbilityRecord};
  games: {key: string; value: GameSnapshotRecord};
  metadata: {key: string; value: MetadataRecord};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTeam(value: unknown): value is Team {
  return typeof value === 'string' && TEAMS.some((team) => team === value);
}

function isVisibility(value: unknown): value is Visibility {
  return value === 'private' || value === 'public' || value === 'official';
}

function isGamePhase(value: unknown): boolean {
  return value === 'setup' || value === 'night' || value === 'discussion' || value === 'voting' || value === 'resolution' || value === 'complete';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isGameSession(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.player_count === 'number' &&
    typeof value.center_card_count === 'number' &&
    typeof value.discussion_timer_seconds === 'number' &&
    isStringArray(value.role_ids) &&
    isGamePhase(value.phase) &&
    (typeof value.current_wake_order === 'number' || value.current_wake_order === null) &&
    isStringArray(value.warnings) &&
    (value.wake_order_sequence === undefined || isStringArray(value.wake_order_sequence))
  );
}

function isEngineRole(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !isTeam(value.team) ||
    (typeof value.wake_order !== 'number' && value.wake_order !== null) ||
    (typeof value.wake_target !== 'string' && value.wake_target !== null) ||
    typeof value.min_count !== 'number' ||
    typeof value.max_count !== 'number' ||
    typeof value.is_primary_team_role !== 'boolean' ||
    !Array.isArray(value.ability_steps)
  ) {
    return false;
  }
  return value.ability_steps.every((step) => {
    if (!isRecord(step)) {
      return false;
    }
    return (
      typeof step.ability_type === 'string' &&
      typeof step.order === 'number' &&
      (step.modifier === 'none' || step.modifier === 'and' || step.modifier === 'or' || step.modifier === 'if') &&
      typeof step.is_required === 'boolean' &&
      isRecord(step.parameters)
    );
  });
}

export function isGameSnapshot(value: unknown): value is GameSnapshot {
  return isRecord(value) && isGameSession(value.session) && Array.isArray(value.roles) && value.roles.every(isEngineRole);
}

function isRoleRecord(value: unknown): value is RoleRecord {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.description === undefined || typeof value.description === 'string') &&
    isTeam(value.team) &&
    (value.wake_order === undefined || typeof value.wake_order === 'number') &&
    (value.wake_target === undefined || typeof value.wake_target === 'string') &&
    typeof value.votes === 'number' &&
    isVisibility(value.visibility) &&
    typeof value.is_locked === 'boolean' &&
    typeof value.vote_score === 'number' &&
    typeof value.use_count === 'number' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string' &&
    Array.isArray(value.ability_steps) &&
    Array.isArray(value.win_conditions) &&
    typeof value.default_count === 'number' &&
    typeof value.min_count === 'number' &&
    typeof value.max_count === 'number' &&
    typeof value.is_primary_team_role === 'boolean' &&
    Array.isArray(value.dependencies)
  );
}

function ensure(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function openDatabase(databaseName = DATABASE_NAME): Promise<IDBPDatabase<YourwolfDatabase>> {
  try {
    return await openDB<YourwolfDatabase>(databaseName, DATABASE_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('roles')) {
          database.createObjectStore('roles');
        }
        if (!database.objectStoreNames.contains('abilities')) {
          database.createObjectStore('abilities');
        }
        if (!database.objectStoreNames.contains('games')) {
          database.createObjectStore('games');
        }
        if (!database.objectStoreNames.contains('metadata')) {
          database.createObjectStore('metadata');
        }
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to open local database "${databaseName}": ${reason}`);
  }
}

export async function deleteDatabase(databaseName = DATABASE_NAME): Promise<void> {
  await deleteDB(databaseName);
}

interface ReseedOptions {
  readonly failAfter?: number;
}

export interface IndexedDbRepositories {
  readonly roles: RoleRepository;
  readonly abilities: AbilityRepository;
  readonly games: GameRepository;
  readonly metadata: MetadataRepository;
  bootstrap(): Promise<void>;
  reseed(roles: unknown, abilities: unknown, seedVersion: number, options?: ReseedOptions): Promise<void>;
  close(): void;
}

export interface IndexedDbRepositoriesOptions {
  readonly databaseName?: string;
}

export async function createIndexedDbRepositories(
  options: IndexedDbRepositoriesOptions = {},
): Promise<IndexedDbRepositories> {
  const database = await openDatabase(options.databaseName);
  const roles: RoleRepository = {
    async list(filters: RoleListFilters = {}) {
      const records = await database.getAll('roles');
      return records.filter((role) => (filters.team === undefined || role.team === filters.team) && (filters.visibility === undefined || role.visibility === filters.visibility));
    },
    async get(id) {
      return (await database.get('roles', id)) ?? null;
    },
    async put(role) {
      ensure(isRoleRecord(role), 'Invalid local role record');
      await database.put('roles', role, role.id);
    },
    async delete(id) {
      await database.delete('roles', id);
    },
  };
  const abilities: AbilityRepository = {
    async list() {
      return database.getAll('abilities');
    },
  };
  const games: GameRepository = {
    async get(id) {
      const record = await database.get('games', id);
      if (record === undefined || record.id !== id || !isGameSnapshot(record.snapshot)) {
        return null;
      }
      return record.snapshot;
    },
    async put(snapshot) {
      ensure(isGameSnapshot(snapshot), 'Invalid game snapshot record');
      await database.put('games', {id: snapshot.session.id, updated_at: new Date().toISOString(), snapshot}, snapshot.session.id);
    },
  };
  const metadata: MetadataRepository = {
    async get() {
      return (await database.get('metadata', METADATA_ID)) ?? null;
    },
  };

  async function applySeed(rolesSeed: unknown, abilitiesSeed: unknown, seedVersion: number, failure?: ReseedOptions): Promise<void> {
    ensure(Number.isInteger(seedVersion) && seedVersion > 0, `Invalid seed version: ${seedVersion}`);
    const converted = convertSeedCatalog(rolesSeed, abilitiesSeed);
    const transaction = database.transaction(['roles', 'abilities', 'metadata'], 'readwrite');
    const transactionDone = transaction.done;
    let writes = 0;
    const write = async (operation: () => Promise<unknown>): Promise<void> => {
      if (failure?.failAfter !== undefined && writes >= failure.failAfter) {
        throw new Error('Forced seed transaction failure');
      }
      await operation();
      writes += 1;
    };
    try {
      const existingRoles = await transaction.objectStore('roles').getAll();
      const existingMetadata = await transaction.objectStore('metadata').get(METADATA_ID);
      if (existingMetadata?.seed_version === seedVersion) {
        await transactionDone;
        return;
      }
      const roleStore = transaction.objectStore('roles');
      const abilityStore = transaction.objectStore('abilities');
      const metadataStore = transaction.objectStore('metadata');
      if (existingMetadata === undefined) {
        for (const role of converted.roles) {
          await write(() => roleStore.put(role, role.id));
        }
      } else {
        const officialIds = new Set(converted.roles.map((role) => role.id));
        for (const existing of existingRoles) {
          if (existing.visibility === 'official' && !officialIds.has(existing.id)) {
            await write(() => roleStore.delete(existing.id));
          }
        }
        for (const role of converted.roles) {
          await write(() => roleStore.put(role, role.id));
        }
      }
      await write(() => abilityStore.clear());
      for (const ability of converted.abilities) {
        await write(() => abilityStore.put(ability, ability.id));
      }
      const metadataRecord: MetadataRecord = {
        id: METADATA_ID,
        seed_version: seedVersion,
        updated_at: new Date().toISOString(),
      };
      await write(() => metadataStore.put(metadataRecord, METADATA_ID));
      await transactionDone;
    } catch (error) {
      transactionDone.catch(() => undefined);
      transaction.abort();
      try {
        await transactionDone;
      } catch {
        // The aborted transaction is expected to reject.
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  return {
    roles,
    abilities,
    games,
    metadata,
    async bootstrap() {
      await applySeed(ROLE_SEED, ABILITY_SEED, SEED_VERSION);
    },
    async reseed(rolesSeed, abilitiesSeed, seedVersion, reseedOptions) {
      await applySeed(rolesSeed, abilitiesSeed, seedVersion, reseedOptions);
    },
    close() {
      database.close();
    },
  };
}
