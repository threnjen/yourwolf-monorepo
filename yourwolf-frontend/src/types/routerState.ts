import type {RoleListItem} from './transport';

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
