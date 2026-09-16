import type {RoleDraft} from '../domain/roleDraft';
import type {RoleDependencyInput} from '../engine/gameSetupValidation';
import type {EngineAbilityStepInput, EngineRoleInput} from '../engine/types';
import type {Team} from '../domain/teams';

export interface RoleListItemAdapterInput {
  readonly id: string;
  readonly name: string;
  readonly team: Team;
  readonly wake_order?: number | null;
  readonly min_count: number;
  readonly max_count: number;
  readonly is_primary_team_role: boolean;
  readonly dependencies: readonly RoleDependencyAdapterInput[];
}

export interface RoleDependencyAdapterInput {
  readonly required_role_id: string;
  readonly required_role_name: string;
  readonly dependency_type: 'requires' | 'recommends';
}

export interface RoleDetailAbilityStepAdapterInput {
  readonly ability_type?: string | null;
  readonly order: number;
  readonly modifier: 'none' | 'and' | 'or' | 'if';
  readonly is_required: boolean;
  readonly parameters: Readonly<Record<string, unknown>>;
}

export interface RoleDetailAdapterInput {
  readonly wake_target?: string | null;
  readonly ability_steps: readonly RoleDetailAbilityStepAdapterInput[];
}

function adaptAbilityStep(
  step: RoleDetailAbilityStepAdapterInput,
): EngineAbilityStepInput {
  return {
    ability_type: step.ability_type ?? 'unknown',
    order: step.order,
    modifier: step.modifier,
    is_required: step.is_required,
    parameters: {...step.parameters},
  };
}

/** Merge role-list metadata and role-detail narration fields for the engine. */
export function adaptRoleToEngine(
  listItem: RoleListItemAdapterInput,
  detail: RoleDetailAdapterInput,
): EngineRoleInput {
  return {
    id: listItem.id,
    name: listItem.name,
    team: listItem.team,
    wake_order: listItem.wake_order ?? null,
    wake_target: detail.wake_target ?? null,
    min_count: listItem.min_count,
    max_count: listItem.max_count,
    is_primary_team_role: listItem.is_primary_team_role,
    ability_steps: detail.ability_steps.map(adaptAbilityStep),
  };
}

/** Convert list-item dependencies into engine setup-validation inputs. */
export function adaptDependenciesToEngine(
  listItem: RoleListItemAdapterInput,
): RoleDependencyInput[] {
  return listItem.dependencies.map((dependency) => ({
    role_id: listItem.id,
    required_role_id: dependency.required_role_id,
    dependency_type: dependency.dependency_type,
  }));
}

/** Convert a role draft into the engine shape used by local preview. */
export function adaptDraftToEngine(draft: RoleDraft): EngineRoleInput {
  return {
    id: draft.id,
    name: draft.name,
    team: draft.team,
    wake_order: draft.wake_order,
    wake_target: draft.wake_target,
    min_count: 1,
    max_count: 1,
    is_primary_team_role: draft.is_primary_team_role,
    ability_steps: draft.ability_steps.map((step) => ({
      ability_type: step.ability_type,
      order: step.order,
      modifier: step.modifier,
      is_required: step.is_required,
      parameters: {...step.parameters},
    })),
  };
}
