import {describe, it, expect, beforeEach, vi} from 'vitest';
import {renderHook, waitFor, act} from '@testing-library/react';
import {createElement, type ReactNode} from 'react';
import {useGame, useNightScript} from '../../hooks/useGame';
import {RepositoryProvider} from '../../context/repository_context';
import type {GameSnapshot, IndexedDbRepositories} from '../../data';
import type {GameSession} from '../../engine/gameSession';
import type {EngineRoleInput} from '../../engine/types';

const role: EngineRoleInput = {
  id: 'role-1', name: 'Werewolf', team: 'werewolf', wake_order: 1,
  wake_target: null, min_count: 1, max_count: 2,
  is_primary_team_role: true, ability_steps: [],
};

const session: GameSession = {
  id: 'game-123', player_count: 3, center_card_count: 1,
  discussion_timer_seconds: 300, role_ids: ['role-1', 'role-1', 'role-1', 'role-1'],
  wake_order_sequence: ['role-1'], phase: 'setup', current_wake_order: null, warnings: [],
};

const snapshots = new Map<string, GameSnapshot>();

function createRepositories(): IndexedDbRepositories {
  return {
    roles: {} as IndexedDbRepositories['roles'],
    abilities: {} as IndexedDbRepositories['abilities'],
    games: {
      get: vi.fn(async (id: string) => snapshots.get(id) ?? null),
      put: vi.fn(async (snapshot: GameSnapshot) => {
        snapshots.set(snapshot.session.id, snapshot);
      }),
    },
    metadata: {} as IndexedDbRepositories['metadata'],
    bootstrap: vi.fn(),
    reseed: vi.fn(),
    close: vi.fn(),
  };
}

function saveSnapshot(snapshot: GameSnapshot): void {
  snapshots.set(snapshot.session.id, snapshot);
}

function renderGameHook<T>(hook: () => T) {
  const repositories = createRepositories();
  const wrapper = ({children}: {children: ReactNode}) => createElement(
    RepositoryProvider,
    {repositories, children},
  );
  return renderHook(hook, {wrapper});
}

describe('useGame', () => {
  beforeEach(() => snapshots.clear());

  it('starts loading and returns the stored session', async () => {
    saveSnapshot({session, roles: [role]});
    const {result} = renderGameHook(() => useGame('game-123'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game).toEqual(session);
    expect(result.current.error).toBeNull();
  });

  it('returns an absent game without an error', async () => {
    const {result} = renderGameHook(() => useGame('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('refetches a changed snapshot', async () => {
    saveSnapshot({session, roles: [role]});
    const {result} = renderGameHook(() => useGame('game-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const nextSession = {...session, phase: 'night' as const, current_wake_order: 0};
    saveSnapshot({session: nextSession, roles: [role]});
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.game?.phase).toBe('night'));
  });

  it('reads the game snapshot from the repository provider', async () => {
    const providerSession = {...session, id: 'provider-game'};
    const games = {get: vi.fn().mockResolvedValue({session: providerSession, roles: [role]}), put: vi.fn()};
    const repositories = {games} as unknown as IndexedDbRepositories;
    const wrapper = ({children}: {children: ReactNode}) => createElement(
      RepositoryProvider,
      {repositories, children},
    );
    const {result} = renderHook(() => useGame('provider-game'), {wrapper});

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game).toEqual(providerSession);
    expect(games.get).toHaveBeenCalledWith('provider-game');
  });
});

describe('useNightScript', () => {
  beforeEach(() => snapshots.clear());

  it('builds a script from the stored roles and wake sequence', async () => {
    saveSnapshot({session: {...session, phase: 'night'}, roles: [role]});
    const {result} = renderGameHook(() => useNightScript('game-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.script?.game_session_id).toBe('game-123');
    expect(result.current.script?.actions[1]?.role_name).toBe('Werewolf');
    expect(result.current.script?.total_duration_seconds).toBe(14);
    expect(result.current.error).toBeNull();
  });

  it('rebuilds the same ordered script from the stored custom sequence', async () => {
    const zeta: EngineRoleInput = {...role, id: 'role-zeta', name: 'Zeta'};
    const alpha: EngineRoleInput = {...role, id: 'role-alpha', name: 'Alpha'};
    const customSession: GameSession = {
      ...session,
      role_ids: ['role-zeta', 'role-zeta', 'role-alpha', 'role-alpha'],
      wake_order_sequence: ['role-zeta', 'role-alpha'],
      phase: 'night',
      current_wake_order: 0,
    };
    saveSnapshot({session: customSession, roles: [zeta, alpha]});

    const first = renderGameHook(() => useNightScript('game-123'));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.script?.actions.map(({role_name}) => role_name)).toEqual([
      'Narrator',
      'Zeta',
      'Zeta',
      'Alpha',
      'Alpha',
      'Narrator',
    ]);
    expect(first.result.current.script?.total_duration_seconds).toBe(20);

    const firstScript = first.result.current.script;
    first.unmount();
    const second = renderGameHook(() => useNightScript('game-123'));
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.script).toEqual(firstScript);
  });

  it('does not read a script when disabled', () => {
    const {result} = renderGameHook(() => useNightScript('game-123', false));
    expect(result.current.script).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns no script when the snapshot is missing', async () => {
    const {result} = renderGameHook(() => useNightScript('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.script).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('ignores a stale night-script read after the request is disabled', async () => {
    let releaseFirst: ((snapshot: GameSnapshot | null) => void) | undefined;
    const firstRead = new Promise<GameSnapshot | null>((resolve) => {
      releaseFirst = resolve;
    });
    const games = {
      get: vi.fn(() => firstRead),
      put: vi.fn(),
    };
    const repositories = {games} as unknown as IndexedDbRepositories;
    const wrapper = ({children}: {children: ReactNode}) => createElement(
      RepositoryProvider,
      {repositories, children},
    );
    const rendered = renderHook(
      ({enabled}: {enabled: boolean}) => useNightScript('first', enabled),
      {initialProps: {enabled: true}, wrapper},
    );
    await waitFor(() => expect(games.get).toHaveBeenCalledWith('first'));
    rendered.rerender({enabled: false});
    releaseFirst?.({session, roles: [role]});
    await act(async () => await firstRead);
    expect(rendered.result.current.script).toBeNull();
  });
});
