import {abilityId, dependencyId, officialRoleId, stepId, winConditionId} from './ids';
import type {
  AbilityRecord,
  AbilityStepRecord,
  CustomRoleInput,
  RoleDependencyRecord,
  RoleRecord,
  StepModifier,
  WinConditionRecord,
} from './records';
import type {Team} from '../domain/teams';

interface SeedAbility {
  type: string;
  name: string;
  description: string;
  parameters_schema: Record<string, unknown>;
}

interface SeedStep {
  order: number;
  modifier: StepModifier;
  ability_type: string;
  parameters: Record<string, unknown>;
  is_required: boolean;
  condition_type?: string | null;
  condition_params?: Record<string, unknown> | null;
}

interface SeedWinCondition {
  condition_type: string;
  condition_params?: Record<string, unknown> | null;
  is_primary: boolean;
  overrides_team: boolean;
}

interface SeedRole {
  name: string;
  description?: string;
  team: Team;
  wake_order?: number | null;
  wake_target?: string | null;
  votes?: number;
  default_count?: number;
  min_count?: number;
  max_count?: number;
  is_primary_team_role?: boolean;
  ability_steps?: SeedStep[];
  win_conditions?: SeedWinCondition[];
}

interface SeedDependency {
  source: string;
  target: string;
  dependency_type: 'requires' | 'recommends';
}

interface SeedRoleCatalog {
  roles: SeedRole[];
  role_dependencies: SeedDependency[];
}

export interface ConvertedCatalog {
  readonly roles: RoleRecord[];
  readonly abilities: AbilityRecord[];
}

export interface ConversionOptions {
  readonly timestamp?: string;
}

function objectRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be a plain object`);
  }
  return value as Record<string, unknown>;
}

function parseCatalog(
  roles: unknown,
  abilities: unknown,
): {roleCatalog: SeedRoleCatalog; abilityList: SeedAbility[]} {
  const roleRoot = objectRecord(roles, 'Role seed');
  const abilityRoot = Array.isArray(abilities) ? abilities : null;
  if (!Array.isArray(roleRoot.roles) || !Array.isArray(roleRoot.role_dependencies)) {
    throw new Error('Role seed must contain roles and role_dependencies arrays');
  }
  if (abilityRoot === null) {
    throw new Error('Ability seed must be an array');
  }
  return {
    roleCatalog: roleRoot as unknown as SeedRoleCatalog,
    abilityList: abilityRoot as SeedAbility[],
  };
}

function optionalRecord(value: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const candidate = value[key];
  if (candidate === undefined || candidate === null) {
    return undefined;
  }
  return objectRecord(candidate, key);
}

function convertStep(roleId: string, step: SeedStep, names: Map<string, string>): AbilityStepRecord {
  const abilityName = names.get(step.ability_type);
  if (abilityName === undefined) {
    throw new Error(`Unknown ability type: ${step.ability_type}`);
  }
  const conditionParams = optionalRecord(step as unknown as Record<string, unknown>, 'condition_params');
  const converted: AbilityStepRecord = {
    id: stepId(roleId, step.order),
    order: step.order,
    modifier: step.modifier,
    is_required: step.is_required,
    parameters: objectRecord(step.parameters, `Step ${step.order} parameters`),
    ability_type: step.ability_type,
    ability_name: abilityName,
  };
  if (step.condition_type !== undefined && step.condition_type !== null) {
    converted.condition_type = step.condition_type;
  }
  if (conditionParams !== undefined) {
    converted.condition_params = conditionParams;
  }
  return converted;
}

function convertWinCondition(roleId: string, condition: SeedWinCondition, index: number): WinConditionRecord {
  const conditionParams = optionalRecord(condition as unknown as Record<string, unknown>, 'condition_params');
  const converted: WinConditionRecord = {
    id: winConditionId(roleId, index),
    condition_type: condition.condition_type,
    is_primary: condition.is_primary,
    overrides_team: condition.overrides_team,
  };
  if (conditionParams !== undefined) {
    converted.condition_params = conditionParams;
  }
  return converted;
}

function withWakeDefaults(role: SeedRole): Pick<RoleRecord, 'description' | 'wake_order' | 'wake_target'> {
  const defaults: Pick<RoleRecord, 'description' | 'wake_order' | 'wake_target'> = {
    description: role.description ?? '',
  };
  if (role.wake_order !== undefined && role.wake_order !== null) {
    defaults.wake_order = role.wake_order;
  }
  if (role.wake_target !== undefined && role.wake_target !== null) {
    defaults.wake_target = role.wake_target;
  }
  return defaults;
}

export function convertSeedRole(
  role: SeedRole,
  abilities: unknown,
  options: ConversionOptions = {},
  dependencies: readonly SeedDependency[] = [],
  roleIds = new Map<string, string>(),
): RoleRecord {
  const abilityList = Array.isArray(abilities) ? (abilities as SeedAbility[]) : [];
  const abilityNames = new Map(abilityList.map((ability) => [ability.type, ability.name]));
  const timestamp = options.timestamp ?? new Date().toISOString();
  const id = officialRoleId(role.name);
  const roleDefaults = withWakeDefaults(role);
  const abilitySteps = (role.ability_steps ?? []).map((step) => convertStep(id, step, abilityNames));
  if (new Set(abilitySteps.map((step) => step.id)).size !== abilitySteps.length) {
    throw new Error(`Duplicate generated step id for role: ${role.name}`);
  }
  const winConditions = (role.win_conditions ?? []).map((condition, index) => convertWinCondition(id, condition, index));
  if (new Set(winConditions.map((condition) => condition.id)).size !== winConditions.length) {
    throw new Error(`Duplicate generated win condition id for role: ${role.name}`);
  }
  const convertedDependencies = dependencies
    .filter((dependency) => dependency.source === role.name)
    .map((dependency) => {
      const requiredRoleId = roleIds.get(dependency.target);
      if (requiredRoleId === undefined) {
        throw new Error(`Unknown dependency target: ${dependency.target}`);
      }
      const result: RoleDependencyRecord = {
        id: dependencyId(id, requiredRoleId),
        required_role_id: requiredRoleId,
        required_role_name: dependency.target,
        dependency_type: dependency.dependency_type,
      };
      return result;
    });
  if (new Set(convertedDependencies.map((dependency) => dependency.id)).size !== convertedDependencies.length) {
    throw new Error(`Duplicate generated dependency id for role: ${role.name}`);
  }
  const converted: RoleRecord = {
    id,
    name: role.name,
    ...roleDefaults,
    team: role.team,
    votes: role.votes ?? 0,
    visibility: 'official',
    is_locked: true,
    vote_score: 0,
    use_count: 0,
    created_at: timestamp,
    updated_at: timestamp,
    ability_steps: abilitySteps,
    win_conditions: winConditions,
    default_count: role.default_count ?? 1,
    min_count: role.min_count ?? 1,
    max_count: role.max_count ?? 1,
    is_primary_team_role: role.is_primary_team_role ?? false,
    dependencies: convertedDependencies,
  };
  return converted;
}

function convertAbility(ability: SeedAbility, timestamp: string): AbilityRecord {
  return {
    id: abilityId(ability.type),
    type: ability.type,
    name: ability.name,
    description: ability.description,
    parameters_schema: objectRecord(ability.parameters_schema, `Ability ${ability.type} parameters_schema`),
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function convertSeedCatalog(
  roles: unknown,
  abilities: unknown,
  options: ConversionOptions = {},
): ConvertedCatalog {
  const {roleCatalog, abilityList} = parseCatalog(roles, abilities);
  const names = new Set<string>();
  const roleIds = new Map<string, string>();
  for (const role of roleCatalog.roles) {
    if (names.has(role.name)) {
      throw new Error(`Duplicate role name: ${role.name}`);
    }
    names.add(role.name);
    const id = officialRoleId(role.name);
    if ([...roleIds.values()].includes(id)) {
      throw new Error(`Duplicate generated role id: ${id}`);
    }
    roleIds.set(role.name, id);
  }
  const timestamp = options.timestamp ?? new Date().toISOString();
  const convertedAbilities = abilityList.map((ability) => convertAbility(ability, timestamp));
  if (new Set(convertedAbilities.map((ability) => ability.id)).size !== convertedAbilities.length) {
    throw new Error('Duplicate generated ability id');
  }
  return {
    roles: roleCatalog.roles.map((role) =>
      convertSeedRole(role, abilityList, {timestamp}, roleCatalog.role_dependencies, roleIds),
    ),
    abilities: convertedAbilities,
  };
}

export function createCustomRole(input: CustomRoleInput): RoleRecord {
  const timestamp = input.updated_at;
  return {
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description,
    team: input.team,
    wake_order: input.wake_order === null ? undefined : input.wake_order,
    wake_target: input.wake_target === null ? undefined : input.wake_target,
    votes: input.votes,
    visibility: 'private',
    is_locked: false,
    vote_score: 0,
    use_count: 0,
    created_at: input.created_at,
    updated_at: timestamp,
    ability_steps: input.ability_steps,
    win_conditions: input.win_conditions,
    default_count: 1,
    min_count: 1,
    max_count: 1,
    is_primary_team_role: input.is_primary_team_role,
    dependencies: [],
  };
}
