import type {RoleDraft} from './roleDraft';

/** Minimal catalog shape needed to validate a draft's ability steps. */
export interface AbilityValidationInput {
  readonly type: string;
  readonly is_active: boolean;
}

/** Validation output kept structurally compatible with the transport result. */
export interface RoleValidationResult {
  readonly is_valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

interface RoleNameInput {
  readonly name: string;
}

/** Validate a draft using the backend rule order and literal messages. */
export function validateRoleDraft(
  draft: RoleDraft,
  abilities: readonly AbilityValidationInput[],
): RoleValidationResult {
  const errors: string[] = [];
  const name = draft.name.trim();

  if (name.length < 2) {
    errors.push('Role name must be at least 2 characters.');
  } else if (name.length > 50) {
    errors.push('Role name must be at most 50 characters.');
  }

  if (draft.ability_steps.length > 0) {
    const firstStep = [...draft.ability_steps].sort((left, right) => left.order - right.order)[0];
    if (firstStep !== undefined && firstStep.modifier !== 'none') {
      errors.push("The first ability step must have modifier 'none'.");
    }

    const activeAbilityTypes = new Set(
      abilities.filter((ability) => ability.is_active).map((ability) => ability.type),
    );
    for (const step of draft.ability_steps) {
      if (!activeAbilityTypes.has(step.ability_type)) {
        errors.push(`Ability type '${step.ability_type}' is not a valid active ability.`);
      }
    }

    const orders = draft.ability_steps.map((step) => step.order);
    const sortedOrders = [...orders].sort((left, right) => left - right);
    const expectedOrders = Array.from({length: orders.length}, (_, index) => index + 1);
    if (!sortedOrders.every((order, index) => order === expectedOrders[index])) {
      if (new Set(orders).size !== orders.length) {
        errors.push('Ability step orders must not have duplicates.');
      } else {
        errors.push('Ability step orders must be sequential starting at 1 with no gaps.');
      }
    }
  }

  if (draft.win_conditions.length === 0) {
    errors.push('At least one win condition is required.');
  } else {
    const primaryCount = draft.win_conditions.filter((condition) => condition.is_primary).length;
    if (primaryCount === 0) {
      errors.push('Exactly one win condition must be marked as primary.');
    } else if (primaryCount > 1) {
      errors.push(`Exactly one win condition must be marked as primary (found ${primaryCount}).`);
    }
  }

  const warnings = getRoleWarnings(draft);
  return {is_valid: errors.length === 0, errors, warnings};
}

/** Return non-blocking advisory messages in backend order. */
export function getRoleWarnings(draft: RoleDraft): string[] {
  const warnings: string[] = [];

  if (draft.ability_steps.length > 5) {
    warnings.push('This role has more than 5 ability steps, which may make it complex to balance.');
  }

  if (draft.ability_steps.length > 0 && draft.wake_order === null) {
    warnings.push(
      'This role has ability steps but no wake_order set. It may not execute its abilities without a wake order.',
    );
  }

  const stepTypes = new Set(draft.ability_steps.map((step) => step.ability_type));
  if (stepTypes.has('copy_role') && stepTypes.has('change_to_team')) {
    warnings.push("Using both 'copy_role' and 'change_to_team' abilities may cause conflicts.");
  }

  return warnings;
}

/** Check a local role list for a trimmed, case-insensitive name collision. */
export function hasRoleNameCollision(roles: readonly RoleNameInput[], name: string): boolean {
  const normalizedName = name.trim().toLocaleLowerCase();
  return normalizedName.length > 0 && roles.some(
    (role) => role.name.trim().toLocaleLowerCase() === normalizedName,
  );
}
