function stablePart(value: string): string {
  return value.trim().toLowerCase();
}

export function officialRoleId(name: string): string {
  return `official-role:${stablePart(name)}`;
}

export function abilityId(type: string): string {
  return `ability:${stablePart(type)}`;
}

export function stepId(roleId: string, order: number): string {
  return `${roleId}:step:${order}`;
}

export function winConditionId(roleId: string, index: number): string {
  return `${roleId}:win:${index}`;
}

export function dependencyId(roleId: string, requiredRoleId: string): string {
  return `${roleId}:dependency:${requiredRoleId}`;
}
