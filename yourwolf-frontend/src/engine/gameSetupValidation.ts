import type {EngineRoleInput} from './types.ts';

export type DependencyType = 'requires' | 'recommends';

export interface RoleDependencyInput {
  readonly role_id: string;
  readonly required_role_id: string;
  readonly dependency_type: DependencyType;
}

export interface SetupValidationInput {
  readonly player_count: number;
  readonly center_card_count: number;
  readonly discussion_timer_seconds: number;
  readonly role_ids: readonly string[];
  readonly wake_order_sequence?: readonly string[];
  readonly roles: readonly EngineRoleInput[];
  readonly dependencies: readonly RoleDependencyInput[];
}

export interface GameSetupValidation {
  readonly warnings: readonly string[];
  readonly wake_order_sequence?: readonly string[];
}

/** Validate setup fields in the same observable order as the backend. */
export function validateGameSetup(
  input: SetupValidationInput,
): GameSetupValidation {
  const totalCards = input.player_count + input.center_card_count;
  if (input.role_ids.length !== totalCards) {
    throw new Error(
      `Must select exactly ${totalCards} roles (${input.player_count} players + ${input.center_card_count} center)`,
    );
  }

  const roleMap = new Map<string, EngineRoleInput>();
  for (const role of input.roles) {
    if (!roleMap.has(role.id)) {
      roleMap.set(role.id, role);
    }
  }

  const unknownIds = input.role_ids.filter(
    (roleId, index, roleIds) =>
      !roleMap.has(roleId) && roleIds.indexOf(roleId) === index,
  );
  if (unknownIds.length > 0) {
    throw new Error(`Unknown role IDs: ${unknownIds.join(', ')}`);
  }

  const roleIdCounts = new Map<string, number>();
  for (const roleId of input.role_ids) {
    roleIdCounts.set(roleId, (roleIdCounts.get(roleId) ?? 0) + 1);
  }
  const cardCountErrors: string[] = [];
  for (const [roleId, count] of roleIdCounts) {
    const selectedRole = roleMap.get(roleId);
    if (selectedRole === undefined) {
      continue;
    }
    if (count < selectedRole.min_count) {
      cardCountErrors.push(
        `'${selectedRole.name}' requires at least ${selectedRole.min_count} card(s), but only ${count} provided`,
      );
    }
    if (count > selectedRole.max_count) {
      cardCountErrors.push(
        `'${selectedRole.name}' allows at most ${selectedRole.max_count} card(s), but ${count} provided`,
      );
    }
  }
  if (cardCountErrors.length > 0) {
    throw new Error(cardCountErrors.join('; '));
  }

  const primaryErrors = validatePrimaryTeams(input.role_ids, roleMap);
  if (primaryErrors.length > 0) {
    throw new Error(primaryErrors.join('; '));
  }

  const selectedRoleIds = new Set(input.role_ids);
  const dependencyResult = validateDependencies(
    input.dependencies,
    selectedRoleIds,
    roleMap,
  );
  if (dependencyResult.errors.length > 0) {
    throw new Error(dependencyResult.errors.join('; '));
  }

  if (input.wake_order_sequence !== undefined) {
    const sequenceErrors = validateWakeSequence(input, roleMap);
    if (sequenceErrors.length > 0) {
      throw new Error(sequenceErrors.join('; '));
    }
  }

  const result: {
    warnings: readonly string[];
    wake_order_sequence?: readonly string[];
  } = {warnings: dependencyResult.warnings};
  if (input.wake_order_sequence !== undefined) {
    result.wake_order_sequence = [...input.wake_order_sequence];
  }
  return result;
}

function validatePrimaryTeams(
  selectedRoleIds: readonly string[],
  roleMap: ReadonlyMap<string, EngineRoleInput>,
): string[] {
  const teamsWithPrimary = new Map<string, boolean>();
  for (const roleId of new Set(selectedRoleIds)) {
    const selectedRole = roleMap.get(roleId);
    if (
      selectedRole === undefined ||
      selectedRole.team === 'village' ||
      selectedRole.team === 'neutral'
    ) {
      continue;
    }
    teamsWithPrimary.set(
      selectedRole.team,
      (teamsWithPrimary.get(selectedRole.team) ?? false) ||
        selectedRole.is_primary_team_role,
    );
  }

  const errors: string[] = [];
  for (const [team, hasPrimary] of teamsWithPrimary) {
    if (!hasPrimary) {
      errors.push(
        `'${team}' team requires at least one primary role (e.g., Werewolf)`,
      );
    }
  }
  return errors;
}

function validateDependencies(
  dependencies: readonly RoleDependencyInput[],
  selectedRoleIds: ReadonlySet<string>,
  roleMap: ReadonlyMap<string, EngineRoleInput>,
): {errors: string[]; warnings: string[]} {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const dependency of dependencies) {
    if (selectedRoleIds.has(dependency.role_id)) {
      if (selectedRoleIds.has(dependency.required_role_id)) {
        continue;
      }
      const roleName = roleMap.get(dependency.role_id)?.name ?? 'Unknown';
      const requiredRoleName =
        roleMap.get(dependency.required_role_id)?.name ?? 'Unknown';
      if (dependency.dependency_type === 'requires') {
        errors.push(`'${roleName}' requires '${requiredRoleName}' to be in the game`);
      } else {
        warnings.push(
          `'${roleName}' works best with '${requiredRoleName}' in the game`,
        );
      }
    }
  }
  return {errors, warnings};
}

function validateWakeSequence(
  input: SetupValidationInput,
  roleMap: ReadonlyMap<string, EngineRoleInput>,
): string[] {
  const sequence = input.wake_order_sequence ?? [];
  const selectedRoleIds = new Set(input.role_ids);
  const errors: string[] = [];
  if (sequence.length !== new Set(sequence).size) {
    errors.push('Duplicate IDs found in wake_order_sequence');
  }

  const extraIds = sequence.filter(
    (roleId, index, sequenceIds) =>
      !selectedRoleIds.has(roleId) && sequenceIds.indexOf(roleId) === index,
  );
  if (extraIds.length > 0) {
    errors.push('wake_order_sequence contains IDs not in role_ids');
  }

  const wakingRoleIds = new Set<string>();
  for (const roleId of selectedRoleIds) {
    const role = roleMap.get(roleId);
    if (role !== undefined && role.wake_order !== null && role.wake_order !== 0) {
      wakingRoleIds.add(roleId);
    }
  }

  const nonWakingInSequence = sequence.some(
    (roleId) => selectedRoleIds.has(roleId) && !wakingRoleIds.has(roleId),
  );
  if (nonWakingInSequence) {
    errors.push('wake_order_sequence contains IDs that are not waking roles');
  }

  const sequenceIds = new Set(sequence);
  const missingNames: string[] = [];
  for (const roleId of wakingRoleIds) {
    if (!sequenceIds.has(roleId)) {
      const role = roleMap.get(roleId);
      if (role !== undefined) {
        missingNames.push(role.name);
      }
    }
  }
  if (missingNames.length > 0) {
    errors.push(
      `Missing waking role(s) from wake_order_sequence: ${missingNames.join(', ')}`,
    );
  }
  return errors;
}
