export type Team = 'village' | 'werewolf' | 'vampire' | 'alien' | 'neutral';
export type Visibility = 'private' | 'public' | 'official';
export type StepModifier = 'none' | 'and' | 'or' | 'if';

export interface AbilityStep {
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

export interface WinCondition {
  id: string;
  condition_type: string;
  condition_params?: Record<string, unknown>;
  is_primary: boolean;
  overrides_team: boolean;
}

export interface Role {
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
  ability_steps: AbilityStep[];
  win_conditions: WinCondition[];
}

export type AbilityStepDraft = AbilityStep;

export interface WinConditionDraft {
  id: string;
  condition_type: string;
  condition_params?: Record<string, unknown>;
  is_primary: boolean;
  overrides_team: boolean;
}

export interface RoleDraft {
  id: string;
  name: string;
  description: string;
  team: Team;
  wake_order: number | null;
  wake_target: string | null;
  votes: number;
  is_primary_team_role: boolean;
  ability_steps: AbilityStepDraft[];
  win_conditions: WinConditionDraft[];
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NameCheckResult {
  name: string;
  is_available: boolean;
  message: string;
}

export interface Ability {
  id: string;
  type: string;
  name: string;
  description: string;
  parameters_schema: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface RoleDependency {
  id?: string;
  required_role_id: string;
  required_role_name: string;
  dependency_type: 'requires' | 'recommends';
}

export interface RoleListItem {
  id: string;
  name: string;
  description?: string;
  team: Team;
  wake_order?: number;
  visibility: Visibility;
  vote_score: number;
  use_count: number;
  default_count: number;
  min_count: number;
  max_count: number;
  is_primary_team_role: boolean;
  dependencies: RoleDependency[];
  created_at: string;
}
