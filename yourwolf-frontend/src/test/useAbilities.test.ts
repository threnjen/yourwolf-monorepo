import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useAbilities} from '../hooks/useAbilities';
import {abilitiesApi} from '../api/abilities';
import {createMockAbility} from './mocks';

vi.mock('../api/abilities', () => ({
  abilitiesApi: {
    list: vi.fn(),
  },
}));

const mockAbilitiesApi = abilitiesApi as {
  list: ReturnType<typeof vi.fn>;
};

describe('useAbilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with loading true', () => {
      mockAbilitiesApi.list.mockReturnValue(new Promise(() => {}));
      const {result} = renderHook(() => useAbilities());

      expect(result.current.loading).toBe(true);
      expect(result.current.abilities).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('successful fetch', () => {
    it('returns abilities after fetch', async () => {
      const mockAbilities = [
        createMockAbility({id: 'ability-1', type: 'view_card'}),
        createMockAbility({id: 'ability-2', type: 'swap_card'}),
      ];
      mockAbilitiesApi.list.mockResolvedValue(mockAbilities);

      const {result} = renderHook(() => useAbilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.abilities).toEqual(mockAbilities);
      expect(result.current.error).toBeNull();
    });

    it('fetches abilities on mount', async () => {
      mockAbilitiesApi.list.mockResolvedValue([]);

      renderHook(() => useAbilities());

      await waitFor(() => {
        expect(mockAbilitiesApi.list).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('error handling', () => {
    it('handles fetch error', async () => {
      mockAbilitiesApi.list.mockRejectedValue(new Error('Failed to fetch abilities'));

      const {result} = renderHook(() => useAbilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch abilities');
      expect(result.current.abilities).toEqual([]);
    });

    it('handles non-Error rejection', async () => {
      mockAbilitiesApi.list.mockRejectedValue('Network error');

      const {result} = renderHook(() => useAbilities());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch abilities');
    });
  });
});
