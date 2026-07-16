/** How many copies of each role id the setup screen currently has selected. */
export type RoleCounts = Readonly<Record<string, number>>;

/** A dependency edge, projected down to what the cascade rules read. */
export interface RoleDependencyRule {
  required_role_id: string;
  dependency_type: 'requires' | 'recommends';
}

/**
 * A role projected down to what the selection rules need.
 *
 * Declared here rather than imported from the transport DTOs so the rules depend
 * on the handful of fields they actually read. The API's `RoleListItem` satisfies
 * this structurally, so callers pass it directly with no conversion or cast.
 */
export interface SelectableRole {
  id: string;
  default_count: number;
  min_count: number;
  max_count: number;
  dependencies: readonly RoleDependencyRule[];
}

/** Role metadata indexed by role id — the lookup the cascade rules read from. */
export type RoleMap = Readonly<Record<string, SelectableRole>>;

/**
 * Indexes a role list by id so the selection rules can resolve dependencies.
 *
 * Generic over the role type so callers keep the full type they passed in; the
 * rules themselves only ever read the `SelectableRole` fields.
 */
export function buildRoleMap<T extends SelectableRole>(
  roles: readonly T[],
): Readonly<Record<string, T>> {
  const map: Record<string, T> = {};
  for (const role of roles) {
    map[role.id] = role;
  }
  return map;
}

/** Total number of cards the current selection represents. */
export function countSelectedCards(counts: RoleCounts): number {
  return Object.values(counts).reduce((sum, c) => sum + c, 0);
}

/**
 * Removes a role and every selected role that REQUIRES it.
 *
 * The cascade is one-way and single-level: removing a required role drops its
 * dependents, but removing a dependent never touches what it required.
 */
export function removeRoleWithCascade(
  counts: RoleCounts,
  roleId: string,
  roleMap: RoleMap,
): RoleCounts {
  const next = {...counts};
  delete next[roleId];

  for (const [otherId, otherCount] of Object.entries(next)) {
    if (otherCount <= 0) continue;
    const otherRole = roleMap[otherId];
    if (!otherRole) continue;
    const requiresRemoved = otherRole.dependencies.some(
      (dep) => dep.dependency_type === 'requires' && dep.required_role_id === roleId,
    );
    if (requiresRemoved) {
      delete next[otherId];
    }
  }
  return next;
}

/**
 * Selects a role at its `default_count`, or deselects it (with cascade) if already
 * selected. Selecting also pulls in any absent REQUIRES dependency at that
 * dependency's own `default_count`. Unknown roles and dependencies missing from
 * `roleMap` are skipped silently.
 *
 * Returns `counts` unchanged (same reference) when the role id is unknown.
 */
export function toggleRoleSelection(
  counts: RoleCounts,
  roleId: string,
  roleMap: RoleMap,
): RoleCounts {
  if (counts[roleId] && counts[roleId] > 0) {
    return removeRoleWithCascade(counts, roleId, roleMap);
  }

  const role = roleMap[roleId];
  if (!role) return counts;

  const next: Record<string, number> = {...counts, [roleId]: role.default_count};

  for (const dep of role.dependencies) {
    if (dep.dependency_type !== 'requires') continue;
    if (next[dep.required_role_id] && next[dep.required_role_id] > 0) continue;
    const requiredRole = roleMap[dep.required_role_id];
    if (!requiredRole) continue;
    next[dep.required_role_id] = requiredRole.default_count;
  }

  return next;
}

/**
 * Applies a quantity delta to a selected role.
 *
 * Going above `max_count` is rejected (selection returned unchanged); dropping
 * below `min_count` removes the role entirely, cascading to its dependents.
 */
export function adjustRoleCount(
  counts: RoleCounts,
  roleId: string,
  delta: number,
  roleMap: RoleMap,
): RoleCounts {
  const role = roleMap[roleId];
  if (!role) return counts;

  const current = counts[roleId] || 0;
  const newCount = current + delta;

  if (newCount > role.max_count) return counts;
  if (newCount < role.min_count) {
    return removeRoleWithCascade(counts, roleId, roleMap);
  }

  return {...counts, [roleId]: newCount};
}
