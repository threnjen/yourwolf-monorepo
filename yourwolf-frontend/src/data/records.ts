import type {GameSession} from '../engine/gameSession';
import type {Team} from '../domain/teams';

export type Visibility = 'private' | 'public' | 'official';
export type DependencyType = 'requires' | 'recommends';
export type StepModifier = 'none' | 'and' | 'or' | 'if';

export interface AbilityStepRecord {
  id: string;
  order: number;
  modifier: StepModifier;
  is_required: boolean;
  parameters: Record<string, unknown>;
  condition_type?: string;
  condition_params?: Record<string, unknown>;
  ability_type: string;
  ability_name: string;
}

export interface WinConditionRecord {
  id: string;
  condition_type: string;
  condition_params?: Record<string, unknown>;
  is_primary: boolean;
  overrides_team: boolean;
}

export interface RoleDependencyRecord {
  id?: string;
  required_role_id: string;
  required_role_name: string;
  dependency_type: DependencyType;
}

export interface RoleRecord {
  id: string;
  name: string;
  description?: string;
  team: Team;
  wake_order?: number;
  wake_target?: string;
  votes: number;
  visibility: Visibility;
  is_locked: boolean;
  vote_score: number;
  use_count: number;
  created_at: string;
  updated_at: string;
  ability_steps: AbilityStepRecord[];
  win_conditions: WinConditionRecord[];
  default_count: number;
  min_count: number;
  max_count: number;
  is_primary_team_role: boolean;
  dependencies: RoleDependencyRecord[];
}

export interface AbilityRecord {
  id: string;
  type: string;
  name: string;
  description: string;
  parameters_schema: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SnapshotAbilityStep {
  readonly ability_type: string;
  readonly order: number;
  readonly modifier: StepModifier;
  readonly is_required: boolean;
  readonly parameters: Readonly<Record<string, unknown>>;
}

export interface SnapshotRole {
  readonly name: string;
  readonly wake_target: string | null;
  readonly ability_steps: readonly SnapshotAbilityStep[];
  readonly id: string;
  readonly wake_order: number | null;
  readonly team: Team;
  readonly is_primary_team_role: boolean;
  readonly min_count: number;
  readonly max_count: number;
}

export interface GameSnapshot {
  readonly session: GameSession;
  readonly roles: readonly SnapshotRole[];
}

export interface MetadataRecord {
  id: string;
  seed_version: number;
  updated_at: string;
}

export interface CustomRoleInput {
  id: string;
  name: string;
  description: string;
  team: Team;
  wake_order: number | null;
  wake_target: string | null;
  votes: number;
  is_primary_team_role: boolean;
  ability_steps: AbilityStepRecord[];
  win_conditions: WinConditionRecord[];
  created_at: string;
  updated_at: string;
}
