import {TEAMS, type Team} from '../domain/teams';
import type {GameSession} from '../engine/gameSession';
import type {EngineRoleInput} from '../engine/types';

const STORAGE_KEY_PREFIX = 'yourwolf:game:';

export interface GameSnapshot {
  readonly session: GameSession;
  readonly roles: readonly EngineRoleInput[];
}

function storageKey(gameId: string): string {
  return `${STORAGE_KEY_PREFIX}${gameId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTeam(value: unknown): value is Team {
  return typeof value === 'string' && TEAMS.some((team) => team === value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isGamePhase(value: unknown): boolean {
  return (
    value === 'setup' ||
    value === 'night' ||
    value === 'discussion' ||
    value === 'voting' ||
    value === 'resolution' ||
    value === 'complete'
  );
}

function isEngineRoleInput(value: unknown): value is EngineRoleInput {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !isTeam(value.team) ||
    (typeof value.wake_order !== 'number' && value.wake_order !== null) ||
    (typeof value.wake_target !== 'string' && value.wake_target !== null) ||
    typeof value.min_count !== 'number' ||
    typeof value.max_count !== 'number' ||
    typeof value.is_primary_team_role !== 'boolean' ||
    !Array.isArray(value.ability_steps)
  ) {
    return false;
  }
  return value.ability_steps.every((step) => {
    if (!isRecord(step)) {
      return false;
    }
    return (
      typeof step.ability_type === 'string' &&
      typeof step.order === 'number' &&
      (step.modifier === 'none' ||
        step.modifier === 'and' ||
        step.modifier === 'or' ||
        step.modifier === 'if') &&
      typeof step.is_required === 'boolean' &&
      isRecord(step.parameters)
    );
  });
}

function isGameSession(value: unknown): value is GameSession {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.id !== 'string' ||
    typeof value.player_count !== 'number' ||
    typeof value.center_card_count !== 'number' ||
    typeof value.discussion_timer_seconds !== 'number' ||
    !isStringArray(value.role_ids) ||
    !isGamePhase(value.phase) ||
    (typeof value.current_wake_order !== 'number' &&
      value.current_wake_order !== null) ||
    !isStringArray(value.warnings)
  ) {
    return false;
  }
  return (
    value.wake_order_sequence === undefined ||
    isStringArray(value.wake_order_sequence)
  );
}

function isGameSnapshot(value: unknown): value is GameSnapshot {
  return (
    isRecord(value) &&
    isGameSession(value.session) &&
    Array.isArray(value.roles) &&
    value.roles.every(isEngineRoleInput)
  );
}

/** Save one engine session and its role snapshot under the session id. */
export function saveGameSnapshot(snapshot: GameSnapshot): void {
  sessionStorage.setItem(storageKey(snapshot.session.id), JSON.stringify(snapshot));
}

/** Load a game snapshot, treating missing or malformed data as absent. */
export function loadGameSnapshot(gameId: string): GameSnapshot | null {
  const serialized = sessionStorage.getItem(storageKey(gameId));
  if (serialized === null) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    return null;
  }
  return isGameSnapshot(parsed) && parsed.session.id === gameId ? parsed : null;
}
