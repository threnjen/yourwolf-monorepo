import {describe, it, expect, vi, beforeEach} from 'vitest';
import {gamesApi} from '../api/games';
import {createMockGameSession, createMockGameListItem, createMockNightScript} from './mocks';

// Mock the API client module
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import {apiClient} from '../api/client';

const mockApiClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('gamesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('posts game data and returns created game', async () => {
      const mockGame = createMockGameSession();
      mockApiClient.post.mockResolvedValue({data: mockGame});

      const payload = {
        player_count: 5,
        center_card_count: 3,
        discussion_timer_seconds: 300,
        role_ids: ['role-1', 'role-2', 'role-3'],
      };

      const result = await gamesApi.create(payload);

      expect(mockApiClient.post).toHaveBeenCalledWith('/games', payload);
      expect(result).toEqual(mockGame);
    });

    it('passes wake_order_sequence through to API when provided', async () => {
      const mockGame = createMockGameSession();
      mockApiClient.post.mockResolvedValue({data: mockGame});

      const payload = {
        player_count: 5,
        center_card_count: 3,
        discussion_timer_seconds: 300,
        role_ids: ['role-1', 'role-2', 'role-3'],
        wake_order_sequence: ['role-2', 'role-1', 'role-3'],
      };

      const result = await gamesApi.create(payload);

      expect(mockApiClient.post).toHaveBeenCalledWith('/games', payload);
      expect(result).toEqual(mockGame);
    });
  });

  describe('list', () => {
    it('fetches games without parameters', async () => {
      const mockItems = [createMockGameListItem()];
      mockApiClient.get.mockResolvedValue({
        data: {items: mockItems, total: 1, page: 1, limit: 50, pages: 1},
      });

      const result = await gamesApi.list();

      expect(mockApiClient.get).toHaveBeenCalledWith('/games', {
        params: undefined,
      });
      expect(result).toEqual(mockItems);
    });

    it('passes phase filter', async () => {
      const mockItems = [createMockGameListItem({phase: 'night'})];
      mockApiClient.get.mockResolvedValue({
        data: {items: mockItems, total: 1, page: 1, limit: 50, pages: 1},
      });

      await gamesApi.list({phase: 'night'});

      expect(mockApiClient.get).toHaveBeenCalledWith('/games', {
        params: {phase: 'night'},
      });
    });
  });

  describe('getById', () => {
    it('fetches a single game by id', async () => {
      const mockGame = createMockGameSession({id: 'game-123'});
      mockApiClient.get.mockResolvedValue({data: mockGame});

      const result = await gamesApi.getById('game-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/games/game-123');
      expect(result).toEqual(mockGame);
    });
  });

  describe('start', () => {
    it('posts to start endpoint and returns updated game', async () => {
      const mockGame = createMockGameSession({phase: 'night'});
      mockApiClient.post.mockResolvedValue({data: mockGame});

      const result = await gamesApi.start('game-123');

      expect(mockApiClient.post).toHaveBeenCalledWith('/games/game-123/start');
      expect(result.phase).toBe('night');
    });
  });

  describe('advancePhase', () => {
    it('posts to advance endpoint and returns updated game', async () => {
      const mockGame = createMockGameSession({phase: 'discussion'});
      mockApiClient.post.mockResolvedValue({data: mockGame});

      const result = await gamesApi.advancePhase('game-123');

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/games/game-123/advance',
      );
      expect(result.phase).toBe('discussion');
    });
  });

  describe('getNightScript', () => {
    it('fetches the night script for a game', async () => {
      const mockScript = createMockNightScript();
      mockApiClient.get.mockResolvedValue({data: mockScript});

      const result = await gamesApi.getNightScript('game-123');

      expect(mockApiClient.get).toHaveBeenCalledWith('/games/game-123/script');
      expect(result.actions).toHaveLength(4);
    });
  });

  describe('delete', () => {
    it('sends delete request', async () => {
      mockApiClient.delete.mockResolvedValue({data: null});

      await gamesApi.delete('game-123');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/games/game-123');
    });
  });
});
