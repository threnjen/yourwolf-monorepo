import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  loadGameSnapshot,
  saveGameSnapshot,
  type GameSnapshot,
} from '../../storage/game_session_storage';

const snapshot: GameSnapshot = {
  session: {
    id: 'game-one',
    player_count: 3,
    center_card_count: 0,
    discussion_timer_seconds: 300,
    role_ids: ['role-one'],
    phase: 'setup',
    current_wake_order: null,
    warnings: [],
  },
  roles: [
    {
      id: 'role-one',
      name: 'Villager',
      team: 'village',
      wake_order: null,
      wake_target: null,
      ability_steps: [],
      is_primary_team_role: false,
      min_count: 1,
      max_count: 1,
    },
  ],
};

describe('game session storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns null for a missing or corrupt entry', () => {
    expect(loadGameSnapshot('missing')).toBeNull();
    sessionStorage.setItem('yourwolf:game:corrupt', '{bad json');
    expect(loadGameSnapshot('corrupt')).toBeNull();
  });

  it('round-trips a completed snapshot and keeps separate ids isolated', () => {
    saveGameSnapshot(snapshot);
    saveGameSnapshot({
      ...snapshot,
      session: {...snapshot.session, id: 'game-two', phase: 'complete'},
    });

    expect(loadGameSnapshot('game-one')).toEqual(snapshot);
    expect(loadGameSnapshot('game-two')?.session.phase).toBe('complete');
  });

  it('treats a partial snapshot as missing', () => {
    sessionStorage.setItem(
      'yourwolf:game:partial',
      JSON.stringify({session: snapshot.session}),
    );

    expect(loadGameSnapshot('partial')).toBeNull();
  });

  it('lets storage write failures escape to the caller', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error('Quota exceeded');
      }),
    });

    expect(() => saveGameSnapshot(snapshot)).toThrow('Quota exceeded');
    vi.unstubAllGlobals();
  });
});
