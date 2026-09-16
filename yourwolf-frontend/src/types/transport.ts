/**
 * Transport DTOs — the shapes the roles API sends and receives over the wire.
 *
 * These mirror the server's contract and nothing else. The UI/editing model lives
 * in `src/domain` (see `domain/roleDraft.ts`) and meets these shapes at a data boundary.
 *
 * Dependencies point inward: this module may import domain types (`Team`,
 * `StepModifier`), never the reverse.
 *
 * Named `transport` to describe wire shapes separately from the local domain model.
 */
import type {StepModifier} from '../domain/roleDraft';
import type {Team} from '../domain/teams';

/** Who may see a role, as recorded by the server. */
export type Visibility = 'private' | 'public' | 'official';

/** An ability step as persisted and returned by the server. */
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

/** A win condition as persisted and returned by the server. */
export interface WinCondition {
  id: string;
  condition_type: string;
  condition_params?: Record<string, unknown>;
  is_primary: boolean;
  overrides_team: boolean;
}

/** A single role in full, as returned by `GET /roles/{id}`. */
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

/** Outcome of `POST /roles/validate`. */
export interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

/** An ability definition from the abilities catalog. */
export interface Ability {
  id: string;
  type: string;
  name: string;
  description: string;
  parameters_schema: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

/** An edge in a role's dependency graph, as returned in role listings. */
export interface RoleDependency {
  id?: string;
  required_role_id: string;
  required_role_name: string;
  dependency_type: 'requires' | 'recommends';
}

/** A role as returned by the list endpoints (`GET /roles`, `GET /roles/official`). */
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

/** One narrator instruction line in a script preview. */
export interface NarratorPreviewAction {
  order: number;
  instruction: string;
  is_section_header: boolean;
}

/** Outcome of `POST /roles/preview-script`. */
export interface NarratorPreviewResponse {
  actions: NarratorPreviewAction[];
}
