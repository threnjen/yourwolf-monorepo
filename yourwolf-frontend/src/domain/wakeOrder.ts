import type {RoleListItem, Team} from '../types/role';

/** A distinct role that wakes during the night, projected down to what the ordering needs. */
export interface WakingRole {
  id: string;
  name: string;
  team: Team;
  wake_order: number;
}

/** Returns a float in [0, 1) — `Math.random` in production, a stub in tests. */
export type RandomFn = () => number;

/** Fisher-Yates shuffle. Returns a new array; the input is not mutated. */
export function shuffleArray<T>(arr: readonly T[], rng: RandomFn = Math.random): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Reduces a role selection to the distinct roles that wake, sorted by wake order.
 *
 * Multiple copies of a role collapse to one entry — a role wakes once regardless of
 * how many cards of it are in play. Roles without a positive `wake_order`, and ids
 * absent from `roles`, are skipped.
 */
export function collectWakingRoles(
  selectedRoleCounts: Readonly<Record<string, number>>,
  roles: readonly RoleListItem[],
): WakingRole[] {
  const seen = new Set<string>();
  const result: WakingRole[] = [];

  for (const [roleId, count] of Object.entries(selectedRoleCounts)) {
    if (count <= 0) continue;
    if (seen.has(roleId)) continue;
    seen.add(roleId);
    const role = roles.find((r) => r.id === roleId);
    if (!role || !role.wake_order || role.wake_order <= 0) continue;
    result.push({
      id: role.id,
      name: role.name,
      team: role.team,
      wake_order: role.wake_order,
    });
  }

  result.sort((a, b) => a.wake_order - b.wake_order);
  return result;
}

/** The distinct wake-order groups present, ascending. */
export function getWakeGroupKeys(wakingRoles: readonly WakingRole[]): number[] {
  return [...new Set(wakingRoles.map((r) => r.wake_order))].sort((a, b) => a - b);
}

/**
 * Buckets waking roles into their wake-order groups, shuffling *within* each group.
 *
 * Roles sharing a wake order have no canonical precedence, so their order is
 * randomized; the groups themselves stay in ascending wake order.
 */
export function buildGroupOrders(
  wakingRoles: readonly WakingRole[],
  rng: RandomFn = Math.random,
): Record<number, string[]> {
  const groups: Record<number, string[]> = {};
  for (const key of getWakeGroupKeys(wakingRoles)) {
    const ids = wakingRoles.filter((r) => r.wake_order === key).map((r) => r.id);
    groups[key] = shuffleArray(ids, rng);
  }
  return groups;
}

/**
 * Flattens per-group orderings into the single `wake_order_sequence` the backend
 * expects, concatenating groups in the order given.
 */
export function flattenWakeOrder(
  groupKeys: readonly number[],
  groupOrders: Readonly<Record<number, string[]>>,
): string[] {
  return groupKeys.flatMap((key) => groupOrders[key] ?? []);
}

/** Expands a selection into one role id per card — the `role_ids` create payload. */
export function expandRoleIds(selectedRoleCounts: Readonly<Record<string, number>>): string[] {
  const roleIds: string[] = [];
  for (const [roleId, count] of Object.entries(selectedRoleCounts)) {
    for (let i = 0; i < count; i++) {
      roleIds.push(roleId);
    }
  }
  return roleIds;
}
