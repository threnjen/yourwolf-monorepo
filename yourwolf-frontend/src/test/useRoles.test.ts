import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor, act} from '@testing-library/react';
import {useRoles} from '../hooks/useRoles';
import {rolesApi} from '../api/roles';
import {createMockRoles} from './mocks';
import {RoleListItem} from '../types/role';

// Mock the roles API
vi.mock('../api/roles', () => ({
  rolesApi: {
    list: vi.fn(),
    listOfficial: vi.fn(),
    getById: vi.fn(),
  },
}));

const mockRolesApi = rolesApi as unknown as {
  list: ReturnType<typeof vi.fn>;
  listOfficial: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
};

describe('useRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with loading true', () => {
      mockRolesApi.listOfficial.mockReturnValue(new Promise(() => {})); // Never resolves
      const {result} = renderHook(() => useRoles());

      expect(result.current.loading).toBe(true);
      expect(result.current.roles).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('successful fetch', () => {
    it('fetches official roles on mount', async () => {
      const mockRoles = createMockRoles(3);
      mockRolesApi.listOfficial.mockResolvedValue(mockRoles);

      const {result} = renderHook(() => useRoles());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.roles).toEqual(mockRoles);
      expect(result.current.error).toBeNull();
      expect(mockRolesApi.listOfficial).toHaveBeenCalledTimes(1);
    });

    it('updates roles after refetch', async () => {
      const initialRoles = createMockRoles(2);
      const updatedRoles = createMockRoles(5);

      mockRolesApi.listOfficial
        .mockResolvedValueOnce(initialRoles)
        .mockResolvedValueOnce(updatedRoles);

      const {result} = renderHook(() => useRoles());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.roles).toHaveLength(2);

      // Trigger refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.roles).toHaveLength(5);
      expect(mockRolesApi.listOfficial).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('handles API errors', async () => {
      const errorMessage = 'Network error';
      mockRolesApi.listOfficial.mockRejectedValue(new Error(errorMessage));

      const {result} = renderHook(() => useRoles());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.roles).toEqual([]);
    });

    it('handles non-Error rejections', async () => {
      mockRolesApi.listOfficial.mockRejectedValue('String error');

      const {result} = renderHook(() => useRoles());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch roles');
      expect(result.current.roles).toEqual([]);
    });
  });

  describe('refetch behavior', () => {
    it('sets loading to true during refetch', async () => {
      const mockRoles = createMockRoles(3);

      let resolveSecond: (value: RoleListItem[]) => void;
      mockRolesApi.listOfficial
        .mockResolvedValueOnce(mockRoles)
        .mockImplementationOnce(
          () =>
            new Promise<RoleListItem[]>((resolve) => {
              resolveSecond = resolve;
            }),
        );

      const {result} = renderHook(() => useRoles());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refetch but don't await
      act(() => {
        result.current.refetch();
      });

      // Should be loading during refetch
      expect(result.current.loading).toBe(true);

      // Resolve the refetch
      await act(async () => {
        resolveSecond!(mockRoles);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('clears previous error on successful refetch', async () => {
      const mockRoles = createMockRoles(3);
      mockRolesApi.listOfficial
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockRoles);

      const {result} = renderHook(() => useRoles());

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.roles).toEqual(mockRoles);
    });
  });
});
