import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor, act} from '@testing-library/react';
import {useFetch} from '../hooks/useFetch';

describe('useFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('starts with loading true', () => {
      const fetcher = vi.fn(() => new Promise<string[]>(() => {}));
      const {result} = renderHook(() => useFetch(fetcher));

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('successful fetch', () => {
    it('fetches data on mount', async () => {
      const mockData = ['item1', 'item2'];
      const fetcher = vi.fn().mockResolvedValue(mockData);

      const {result} = renderHook(() => useFetch(fetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('refetch updates data', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce(['a'])
        .mockResolvedValueOnce(['b', 'c']);

      const {result} = renderHook(() => useFetch(fetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(['a']);

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.data).toEqual(['b', 'c']);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('sets error on failure', async () => {
      const fetcher = vi.fn().mockRejectedValue(new Error('Network error'));

      const {result} = renderHook(() => useFetch(fetcher));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('sets generic error for non-Error throws', async () => {
      const fetcher = vi.fn().mockRejectedValue('something');

      const {result} = renderHook(() => useFetch(fetcher, {errorMessage: 'Fetch failed'}));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Fetch failed');
    });
  });

  describe('with initialData', () => {
    it('uses initialData as default', async () => {
      const fetcher = vi.fn().mockResolvedValue(['new']);

      const {result} = renderHook(() => useFetch(fetcher, {initialData: ['default']}));

      // Initial data should be the provided default
      expect(result.current.data).toEqual(['default']);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(['new']);
    });
  });
});
