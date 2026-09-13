import {
  type RoleDependencyInput,
  type SetupValidationInput,
  validateGameSetup,
} from './gameSetupValidation.ts';
import type {EngineRoleInput} from './types.ts';

export type {RoleDependencyInput} from './gameSetupValidation.ts';

export type GamePhase =
  | 'setup'
  | 'night'
  | 'discussion'
  | 'voting'
  | 'resolution'
  | 'complete';

export type IdGenerator = () => string;

export interface GameSessionCreateInput extends SetupValidationInput {
  readonly roles: readonly EngineRoleInput[];
  readonly dependencies: readonly RoleDependencyInput[];
  readonly id_generator: IdGenerator;
}

export interface GameSession {
  readonly id: string;
  readonly player_count: number;
  readonly center_card_count: number;
  readonly discussion_timer_seconds: number;
  readonly role_ids: readonly string[];
  readonly wake_order_sequence?: readonly string[];
  readonly phase: GamePhase;
  readonly current_wake_order: number | null;
  readonly warnings: readonly string[];
}

const PHASE_ORDER: readonly GamePhase[] = [
  'setup',
  'night',
  'discussion',
  'voting',
  'resolution',
  'complete',
];

/** Create an immutable setup session after setup validation succeeds. */
export function createGameSession(input: GameSessionCreateInput): GameSession {
  const validation = validateGameSetup(input);
  const session: {
    id: string;
    player_count: number;
    center_card_count: number;
    discussion_timer_seconds: number;
    role_ids: readonly string[];
    wake_order_sequence?: readonly string[];
    phase: GamePhase;
    current_wake_order: number | null;
    warnings: readonly string[];
  } = {
    id: input.id_generator(),
    player_count: input.player_count,
    center_card_count: input.center_card_count,
    discussion_timer_seconds: input.discussion_timer_seconds,
    role_ids: [...input.role_ids],
    phase: 'setup',
    current_wake_order: null,
    warnings: [...validation.warnings],
  };
  if (validation.wake_order_sequence !== undefined) {
    session.wake_order_sequence = [...validation.wake_order_sequence];
  }
  return session;
}

/** Start an immutable setup session in the night phase. */
export function startGame(session: GameSession): GameSession {
  if (session.phase !== 'setup') {
    throw new Error('Game cannot be started: not in setup phase');
  }
  return {
    ...session,
    phase: 'night',
    current_wake_order: 0,
  };
}

/** Advance one immutable session phase after the game has started. */
export function advancePhase(session: GameSession): GameSession {
  if (session.phase === 'setup') {
    throw new Error('Game cannot be advanced: start the game first');
  }
  if (session.phase === 'complete') {
    throw new Error('Game cannot be advanced: already in complete phase');
  }
  const currentIndex = PHASE_ORDER.indexOf(session.phase);
  if (currentIndex < 0 || currentIndex >= PHASE_ORDER.length - 1) {
    throw new Error('Game cannot be advanced: invalid phase');
  }
  return {
    ...session,
    phase: PHASE_ORDER[currentIndex + 1],
  };
}
