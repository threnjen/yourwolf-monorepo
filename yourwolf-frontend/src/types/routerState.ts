import type {RoleListItem} from './transport';
import {TEAMS} from '../domain/teams';

/**
 * The `location.state` contract for `/games/new/wake-order`.
 *
 * Declared once and shared by the producer (`GameSetup`) and the consumer
 * (`WakeOrderResolution`), so the consumer's cast reads the same shape the
 * producer builds. Router state is untyped at runtime — this is a compile-time
 * agreement, not a guarantee.
 */
export interface WakeOrderRouterState {
  playerCount: number;
  centerCount: number;
  timerSeconds: number;
  selectedRoleCounts: Record<string, number>;
  roles: RoleListItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRoleListItem(value: unknown): value is RoleListItem {
  if (!isRecord(value)) {
    return false;
  }
  const dependencies = value.dependencies;
  const hasValidDependencies = Array.isArray(dependencies) && dependencies.every((dependency) => {
    if (!isRecord(dependency)) {
      return false;
    }
    return (
      typeof dependency.required_role_id === 'string' &&
      typeof dependency.required_role_name === 'string' &&
      (dependency.dependency_type === 'requires' || dependency.dependency_type === 'recommends')
    );
  });
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.wake_order === undefined || value.wake_order === null || isFiniteNumber(value.wake_order)) &&
    typeof value.team === 'string' && TEAMS.some((team) => team === value.team) &&
    (value.visibility === 'private' || value.visibility === 'public' || value.visibility === 'official') &&
    isFiniteNumber(value.vote_score) &&
    isFiniteNumber(value.use_count) &&
    isFiniteNumber(value.default_count) &&
    isFiniteNumber(value.min_count) &&
    isFiniteNumber(value.max_count) &&
    typeof value.is_primary_team_role === 'boolean' &&
    typeof value.created_at === 'string' &&
    hasValidDependencies
  );
}

/** Validate untrusted router state before the wake-order page reads it. */
export function isWakeOrderRouterState(value: unknown): value is WakeOrderRouterState {
  if (!isRecord(value)) {
    return false;
  }
  if (
    !isFiniteNumber(value.playerCount) ||
    !isFiniteNumber(value.centerCount) ||
    !isFiniteNumber(value.timerSeconds) ||
    !isRecord(value.selectedRoleCounts) ||
    !Array.isArray(value.roles)
  ) {
    return false;
  }
  return (
    Object.values(value.selectedRoleCounts).every((count) => (
      isFiniteNumber(count) && Number.isInteger(count) && count >= 0
    )) &&
    value.roles.every(isRoleListItem)
  );
}
