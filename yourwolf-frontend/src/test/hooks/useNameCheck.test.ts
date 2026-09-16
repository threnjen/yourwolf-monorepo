import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useNameCheck} from '../../hooks/useNameCheck';
import {rolesApi} from '../../api/roles';

vi.mock('../../api/roles', () => ({
  rolesApi: {
    checkName: vi.fn(),
  },
}));

const mockRolesApi = rolesApi as unknown as {
  checkName: ReturnType<typeof vi.fn>;
};

describe('useNameCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('names too short to check', () => {
    it('stays idle for an empty name and does not call the API', () => {
      const {result} = renderHook(() => useNameCheck(''));

      expect(result.current).toBe('idle');
      expect(mockRolesApi.checkName).not.toHaveBeenCalled();
    });

    it('stays idle for a whitespace-only name and does not call the API', () => {
      const {result} = renderHook(() => useNameCheck('   '));

      expect(result.current).toBe('idle');
      expect(mockRolesApi.checkName).not.toHaveBeenCalled();
    });

    it('stays idle for a single-character name and does not call the API', () => {
      const {result} = renderHook(() => useNameCheck('a'));

      expect(result.current).toBe('idle');
      expect(mockRolesApi.checkName).not.toHaveBeenCalled();
    });
  });

  describe('debounce', () => {
    it('reports checking immediately without calling the API', () => {
      mockRolesApi.checkName.mockResolvedValue({
        name: 'Seer',
        is_available: true,
        message: 'Available',
      });

      const {result} = renderHook(() => useNameCheck('Seer'));

      expect(result.current).toBe('checking');
      expect(mockRolesApi.checkName).not.toHaveBeenCalled();
    });

    it('calls the API once 500ms have elapsed', async () => {
      mockRolesApi.checkName.mockResolvedValue({
        name: 'Seer',
        is_available: true,
        message: 'Available',
      });

      renderHook(() => useNameCheck('Seer'));

      await act(async () => {
        vi.advanceTimersByTime(499);
      });
      expect(mockRolesApi.checkName).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(mockRolesApi.checkName).toHaveBeenCalledWith('Seer');
    });

    it('trims the name before sending it to the API', async () => {
      mockRolesApi.checkName.mockResolvedValue({
        name: 'Seer',
        is_available: true,
        message: 'Available',
      });

      renderHook(() => useNameCheck('  Seer  '));

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockRolesApi.checkName).toHaveBeenCalledWith('Seer');
    });

    it('only issues one request when the name changes rapidly', async () => {
      mockRolesApi.checkName.mockResolvedValue({
        name: 'Seer',
        is_available: true,
        message: 'Available',
      });

      const {rerender} = renderHook(({name}: {name: string}) => useNameCheck(name), {
        initialProps: {name: 'Se'},
      });

      rerender({name: 'See'});
      rerender({name: 'Seer'});

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(mockRolesApi.checkName).toHaveBeenCalledTimes(1);
      expect(mockRolesApi.checkName).toHaveBeenCalledWith('Seer');
    });
  });

  describe('result states', () => {
    it('reports available when the name is free', async () => {
      mockRolesApi.checkName.mockResolvedValue({
        name: 'Seer',
        is_available: true,
        message: 'Available',
      });

      const {result} = renderHook(() => useNameCheck('Seer'));

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('available');
    });

    it('reports taken when the name is in use', async () => {
      mockRolesApi.checkName.mockResolvedValue({
        name: 'Werewolf',
        is_available: false,
        message: 'Name is taken',
      });

      const {result} = renderHook(() => useNameCheck('Werewolf'));

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('taken');
    });

    it('falls back to idle when the request fails', async () => {
      mockRolesApi.checkName.mockRejectedValue(new Error('Network error'));

      const {result} = renderHook(() => useNameCheck('Seer'));

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('idle');
    });
  });

  describe('stale-response handling', () => {
    it('ignores a resolved response once the name has moved on', async () => {
      let resolveFirst: (value: unknown) => void = () => {};
      mockRolesApi.checkName
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveFirst = resolve;
            }),
        )
        .mockResolvedValueOnce({name: 'Robber', is_available: false, message: 'Taken'});

      const {result, rerender} = renderHook(({name}: {name: string}) => useNameCheck(name), {
        initialProps: {name: 'Seer'},
      });

      // Let the first request fire, then move to a new name and let it settle.
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      rerender({name: 'Robber'});
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('taken');

      // The stale first response resolving must not overwrite the newer result.
      await act(async () => {
        resolveFirst({name: 'Seer', is_available: true, message: 'Available'});
      });

      expect(result.current).toBe('taken');
    });

    it('ignores a pending response after the name becomes too short to check', async () => {
      let resolveFirst: (value: unknown) => void = () => {};
      mockRolesApi.checkName.mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      );

      const {result, rerender} = renderHook(({name}: {name: string}) => useNameCheck(name), {
        initialProps: {name: 'Seer'},
      });

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      rerender({name: 'a'});
      expect(result.current).toBe('idle');

      await act(async () => {
        resolveFirst({name: 'Seer', is_available: true, message: 'Available'});
      });

      expect(result.current).toBe('idle');
    });

    it('ignores a pending response after name checking is disabled', async () => {
      let resolveFirst: (value: unknown) => void = () => {};
      mockRolesApi.checkName.mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      );

      const {result, rerender} = renderHook(
        ({name, enabled}: {name: string; enabled: boolean}) => useNameCheck(name, enabled),
        {initialProps: {name: 'Seer', enabled: true}},
      );

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      rerender({name: 'Seer', enabled: false});
      expect(result.current).toBe('idle');

      await act(async () => {
        resolveFirst({name: 'Seer', is_available: true, message: 'Available'});
      });

      expect(result.current).toBe('idle');
    });
  });
});
