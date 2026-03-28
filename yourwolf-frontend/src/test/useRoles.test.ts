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
      mockRolesApi.list.mockReturnValue(new Promise(() => {})); // Never resolves
      const {result} = renderHook(() => useRoles(['official']));

      expect(result.current.loading).toBe(true);
      expect(result.current.roles).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('successful fetch', () => {
    it('fetches roles with visibility on mount', async () => {
      const mockRoles = createMockRoles(3);
      mockRolesApi.list.mockResolvedValue(mockRoles);

      const {result} = renderHook(() => useRoles(['official', 'private']));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.roles).toEqual(mockRoles);
      expect(result.current.error).toBeNull();
      expect(mockRolesApi.list).toHaveBeenCalledWith({visibility: ['official', 'private']});
    });

    it('updates roles after refetch', async () => {
      const initialRoles = createMockRoles(2);
      const updatedRoles = createMockRoles(5);

      mockRolesApi.list
        .mockResolvedValueOnce(initialRoles)
        .mockResolvedValueOnce(updatedRoles);

      const {result} = renderHook(() => useRoles(['official']));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.roles).toHaveLength(2);

      // Trigger refetch
      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.roles).toHaveLength(5);
      expect(mockRolesApi.list).toHaveBeenCalledTimes(2);
    });

    it('refetches when visibility changes', async () => {
      const mockRoles = createMockRoles(3);
      mockRolesApi.list.mockResolvedValue(mockRoles);

      const {result, rerender} = renderHook(
        ({visibility}: {visibility: string[]}) => useRoles(visibility),
        {initialProps: {visibility: ['official']}},
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      rerender({visibility: ['official', 'private']});

      await waitFor(() => {
        expect(mockRolesApi.list).toHaveBeenCalledWith({visibility: ['official', 'private']});
      });
    });
  });

  describe('error handling', () => {
    it('handles API errors', async () => {
      const errorMessage = 'Network error';
      mockRolesApi.list.mockRejectedValue(new Error(errorMessage));

      const {result} = renderHook(() => useRoles(['official']));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.roles).toEqual([]);
    });

    it('handles non-Error rejections', async () => {
      mockRolesApi.list.mockRejectedValue('String error');

      const {result} = renderHook(() => useRoles(['official']));

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
      mockRolesApi.list
        .mockResolvedValueOnce(mockRoles)
        .mockImplementationOnce(
          () =>
            new Promise<RoleListItem[]>((resolve) => {
              resolveSecond = resolve;
            }),
        );

      const {result} = renderHook(() => useRoles(['official']));

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
      mockRolesApi.list
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockRoles);

      const {result} = renderHook(() => useRoles(['official']));

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
