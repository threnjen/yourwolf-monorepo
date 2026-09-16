import {describe, it, expect, beforeEach} from 'vitest';
import {renderHook, waitFor, act} from '@testing-library/react';
import {useGame, useNightScript} from '../../hooks/useGame';
import {saveGameSnapshot} from '../../storage/game_session_storage';
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

describe('useGame', () => {
  beforeEach(() => sessionStorage.clear());

  it('starts loading and returns the stored session', async () => {
    saveGameSnapshot({session, roles: [role]});
    const {result} = renderHook(() => useGame('game-123'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game).toEqual(session);
    expect(result.current.error).toBeNull();
  });

  it('returns an absent game without an error', async () => {
    const {result} = renderHook(() => useGame('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.game).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('refetches a changed snapshot', async () => {
    saveGameSnapshot({session, roles: [role]});
    const {result} = renderHook(() => useGame('game-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const nextSession = {...session, phase: 'night' as const, current_wake_order: 0};
    saveGameSnapshot({session: nextSession, roles: [role]});
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.game?.phase).toBe('night'));
  });
});

describe('useNightScript', () => {
  beforeEach(() => sessionStorage.clear());

  it('builds a script from the stored roles and wake sequence', async () => {
    saveGameSnapshot({session: {...session, phase: 'night'}, roles: [role]});
    const {result} = renderHook(() => useNightScript('game-123'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.script?.game_session_id).toBe('game-123');
    expect(result.current.script?.actions[1]?.role_name).toBe('Werewolf');
    expect(result.current.script?.total_duration_seconds).toBe(14);
    expect(result.current.error).toBeNull();
  });

  it('does not read a script when disabled', () => {
    const {result} = renderHook(() => useNightScript('game-123', false));
    expect(result.current.script).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns no script when the snapshot is missing', async () => {
    const {result} = renderHook(() => useNightScript('missing'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.script).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
