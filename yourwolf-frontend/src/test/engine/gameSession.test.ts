import {describe, expect, test, vi} from 'vitest';

import type {EngineRoleInput} from '../../engine/types';
import type {RoleDependencyInput} from '../../engine/gameSetupValidation';
import {
  advancePhase,
  createGameSession,
  startGame,
  type GameSession,
  type GameSessionCreateInput,
} from '../../engine/gameSession';

const role = (
  id: string,
  name: string,
  overrides: Partial<EngineRoleInput> = {},
): EngineRoleInput => ({
  id,
  name,
  wake_order: null,
  wake_target: null,
  team: 'village',
  is_primary_team_role: false,
  min_count: 1,
  max_count: 1,
  ability_steps: [],
  ...overrides,
});

const roles: readonly EngineRoleInput[] = [
  role('ww', 'Werewolf', {
    team: 'werewolf',
    is_primary_team_role: true,
    wake_order: 1,
    max_count: 2,
  }),
  role('seer', 'Seer', {wake_order: 4}),
  role('robber', 'Robber', {wake_order: 3}),
  role('villager', 'Villager', {max_count: 3}),
  role('insomniac', 'Insomniac', {wake_order: 9}),
  role('beholder', 'Beholder'),
];

const dependencies: readonly RoleDependencyInput[] = [
  {
    role_id: 'beholder',
    required_role_id: 'seer',
    dependency_type: 'recommends',
  },
];

const validRoleIds = (): string[] => [
  'ww',
  'ww',
  'seer',
  'robber',
  'villager',
  'villager',
  'villager',
  'insomniac',
];

const createInput = (
  overrides: Partial<GameSessionCreateInput> = {},
): GameSessionCreateInput => ({
  player_count: 5,
  center_card_count: 3,
  discussion_timer_seconds: 300,
  role_ids: validRoleIds(),
  roles,
  dependencies,
  id_generator: () => 'session-1',
  ...overrides,
});

const createSession = (
  overrides: Partial<GameSessionCreateInput> = {},
): GameSession => createGameSession(createInput(overrides));

function snapshotCreateInput(input: GameSessionCreateInput): GameSessionCreateInput {
  const {id_generator: idGenerator, ...callerOwnedValues} = input;
  return {
    ...structuredClone(callerOwnedValues),
    id_generator: idGenerator,
  };
}

const rolesWithNestedStep = (): readonly EngineRoleInput[] =>
  roles.map((candidate) =>
    candidate.id === 'seer'
      ? {
          ...candidate,
          ability_steps: [
            {
              ability_type: 'view_card',
              order: 1,
              modifier: 'none' as const,
              is_required: true,
              parameters: {target: 'center', card_indexes: [0, 1]},
            },
          ],
        }
      : candidate,
  );

const transitionSession = (): GameSession =>
  createSession({
    role_ids: [
      'beholder',
      'ww',
      'ww',
      'robber',
      'villager',
      'villager',
      'villager',
      'insomniac',
    ],
    wake_order_sequence: ['ww', 'robber', 'insomniac'],
  });

describe('engine game session creation', () => {
  test('creates a setup session with caller values and injected id', () => {
    const input = createInput({
      wake_order_sequence: ['ww', 'robber', 'seer', 'insomniac'],
    });
    const session = createGameSession(input);

    expect(session).toEqual({
      id: 'session-1',
      phase: 'setup',
      player_count: 5,
      center_card_count: 3,
      discussion_timer_seconds: 300,
      role_ids: validRoleIds(),
      wake_order_sequence: ['ww', 'robber', 'seer', 'insomniac'],
      current_wake_order: null,
      warnings: [],
    });
  });

  test('keeps an omitted wake sequence absent', () => {
    const session = createSession();
    expect('wake_order_sequence' in session).toBe(false);
  });

  test('propagates dependency warnings to the session', () => {
    const session = createSession({
      role_ids: [
        'beholder',
        'ww',
        'robber',
        'villager',
        'villager',
        'villager',
        'seer',
        'insomniac',
      ],
    });
    expect(session.warnings).toEqual([]);

    const warningSession = createSession({
      role_ids: [
        'beholder',
        'ww',
        'robber',
        'villager',
        'villager',
        'villager',
        'insomniac',
        'seer',
      ],
      dependencies: [
        {
          role_id: 'beholder',
          required_role_id: 'missing',
          dependency_type: 'recommends',
        },
      ],
    });
    expect(warningSession.warnings).toEqual([
      "'Beholder' works best with 'Unknown' in the game",
    ]);
  });

  test('does not mutate create input values', () => {
    const input = createInput({
      roles: rolesWithNestedStep(),
      wake_order_sequence: ['ww', 'robber', 'seer', 'insomniac'],
    });
    const before = snapshotCreateInput(input);
    createGameSession(input);
    expect(input).toEqual(before);
  });

  test('uses a deterministic id generator without ambient crypto', () => {
    const idGenerator = vi.fn(() => 'fixed-id');
    const session = createSession({id_generator: idGenerator});

    expect(idGenerator).toHaveBeenCalledTimes(1);
    expect(session.id).toBe('fixed-id');
  });

  test('rejects before creating a session or mutating caller-owned values', () => {
    const idGenerator = vi.fn(() => 'should-not-be-used');
    const input = createInput({
      role_ids: ['ww'],
      roles: rolesWithNestedStep(),
      id_generator: idGenerator,
    });
    const before = snapshotCreateInput(input);

    expect(() => createGameSession(input)).toThrow(
      new Error('Must select exactly 8 roles (5 players + 3 center)'),
    );
    expect(idGenerator).not.toHaveBeenCalled();
    expect(input).toEqual(before);
  });
});

describe('engine game session transitions', () => {
  test('starts only from setup and initializes wake order to zero', () => {
    const setup = transitionSession();
    const before = structuredClone(setup);
    const started = startGame(setup);
    expect(started.phase).toBe('night');
    expect(started.current_wake_order).toBe(0);
    expect(setup).toEqual(before);
  });

  test('rejects starting a non-setup session without mutation', () => {
    const started = startGame(transitionSession());
    const snapshot = structuredClone(started);
    expect(() => startGame(started)).toThrow(
      new Error('Game cannot be started: not in setup phase'),
    );
    expect(started).toEqual(snapshot);
  });

  test('rejects advance from setup without mutation', () => {
    const setup = transitionSession();
    const snapshot = structuredClone(setup);
    expect(() => advancePhase(setup)).toThrow(
      new Error('Game cannot be advanced: start the game first'),
    );
    expect(setup).toEqual(snapshot);
  });

  test.each([
    ['night', 'discussion'],
    ['discussion', 'voting'],
    ['voting', 'resolution'],
    ['resolution', 'complete'],
  ] as const)('advances %s to %s', (from, to) => {
    const session = {phase: from} as GameSession;
    const advanced = advancePhase(session);
    expect(advanced.phase).toBe(to);
    expect(session.phase).toBe(from);
  });

  test('rejects advance from complete without mutation', () => {
    let complete = startGame(transitionSession());
    while (complete.phase !== 'complete') {
      complete = advancePhase(complete);
    }
    const snapshot = structuredClone(complete);
    expect(() => advancePhase(complete)).toThrow(
      new Error('Game cannot be advanced: already in complete phase'),
    );
    expect(complete).toEqual(snapshot);
  });

  test('advances a started session through the complete phase path', () => {
    let session = startGame(createSession());
    const phases: string[] = [session.phase];
    while (session.phase !== 'complete') {
      session = advancePhase(session);
      phases.push(session.phase);
    }
    expect(phases).toEqual([
      'night',
      'discussion',
      'voting',
      'resolution',
      'complete',
    ]);
    expect(session.current_wake_order).toBe(0);
  });

  test('returns new values for successful transitions', () => {
    const setup = transitionSession();
    const setupSnapshot = structuredClone(setup);
    const started = startGame(setup);
    const startedSnapshot = structuredClone(started);
    const advanced = advancePhase(started);
    expect(started).not.toBe(setup);
    expect(advanced).not.toBe(started);
    expect(setup).toEqual(setupSnapshot);
    expect(started).toEqual(startedSnapshot);
  });
});
