import {describe, it, expect, vi, beforeEach} from 'vitest';
import {abilitiesApi} from '../api/abilities';
import {createMockAbility} from './mocks';

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
};

describe('abilitiesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('fetches all abilities', async () => {
      const mockAbilities = [
        createMockAbility({id: 'ability-1', type: 'view_card', name: 'View Card'}),
        createMockAbility({id: 'ability-2', type: 'swap_card', name: 'Swap Card'}),
      ];
      mockApiClient.get.mockResolvedValue({data: mockAbilities});

      const result = await abilitiesApi.list();

      expect(mockApiClient.get).toHaveBeenCalledWith('/abilities');
      expect(result).toEqual(mockAbilities);
    });

    it('returns empty array when no abilities', async () => {
      mockApiClient.get.mockResolvedValue({data: []});

      const result = await abilitiesApi.list();

      expect(result).toEqual([]);
    });
  });
});
