import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useGame, useNightScript} from '../hooks/useGame';
import {gamesApi} from '../api/games';
import {createMockGameSession, createMockNightScript} from './mocks';

// Mock the games API
vi.mock('../api/games', () => ({
  gamesApi: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    start: vi.fn(),
    advancePhase: vi.fn(),
    getNightScript: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGamesApi = gamesApi as {
  create: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  advancePhase: ReturnType<typeof vi.fn>;
  getNightScript: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('useGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with loading true', () => {
      mockGamesApi.getById.mockReturnValue(new Promise(() => {}));
      const {result} = renderHook(() => useGame('game-123'));

      expect(result.current.loading).toBe(true);
      expect(result.current.game).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('successful fetch', () => {
    it('fetches game on mount', async () => {
      const mockGame = createMockGameSession({id: 'game-123'});
      mockGamesApi.getById.mockResolvedValue(mockGame);

      const {result} = renderHook(() => useGame('game-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.game).toEqual(mockGame);
      expect(result.current.error).toBeNull();
      expect(mockGamesApi.getById).toHaveBeenCalledWith('game-123');
    });

    it('refetches when called', async () => {
      const initialGame = createMockGameSession({phase: 'setup'});
      const updatedGame = createMockGameSession({phase: 'night'});
      mockGamesApi.getById
        .mockResolvedValueOnce(initialGame)
        .mockResolvedValueOnce(updatedGame);

      const {result} = renderHook(() => useGame('game-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.game?.phase).toBe('setup');

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.game?.phase).toBe('night');
      });
    });
  });

  describe('error handling', () => {
    it('sets error on fetch failure', async () => {
      mockGamesApi.getById.mockRejectedValue(new Error('Network error'));

      const {result} = renderHook(() => useGame('game-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.game).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('handles non-Error rejection', async () => {
      mockGamesApi.getById.mockRejectedValue('unexpected');

      const {result} = renderHook(() => useGame('game-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load game');
    });
  });
});

describe('useNightScript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches script when enabled', async () => {
    const mockScript = createMockNightScript();
    mockGamesApi.getNightScript.mockResolvedValue(mockScript);

    const {result} = renderHook(() => useNightScript('game-123', true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.script).toEqual(mockScript);
    expect(result.current.error).toBeNull();
  });

  it('does not fetch when disabled', () => {
    const {result} = renderHook(() => useNightScript('game-123', false));

    expect(result.current.script).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockGamesApi.getNightScript).not.toHaveBeenCalled();
  });

  it('sets error on fetch failure', async () => {
    mockGamesApi.getNightScript.mockRejectedValue(new Error('Script error'));

    const {result} = renderHook(() => useNightScript('game-123', true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.script).toBeNull();
    expect(result.current.error).toBe('Script error');
  });
});
