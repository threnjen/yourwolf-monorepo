import type {
  AbilityRecord,
  GameSnapshot,
  MetadataRecord,
  RoleRecord,
  Visibility,
} from './records';
import type {Team} from '../domain/teams';

export interface RoleListFilters {
  readonly team?: Team;
  readonly visibility?: Visibility;
}

export interface RoleRepository {
  list(filters?: RoleListFilters): Promise<RoleRecord[]>;
  get(id: string): Promise<RoleRecord | null>;
  put(role: RoleRecord): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface AbilityRepository {
  list(): Promise<AbilityRecord[]>;
}

export interface GameRepository {
  get(id: string): Promise<GameSnapshot | null>;
  put(snapshot: GameSnapshot): Promise<void>;
}

export interface MetadataRepository {
  get(): Promise<MetadataRecord | null>;
}
