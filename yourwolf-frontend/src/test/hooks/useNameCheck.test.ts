import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useNameCheck} from '../../hooks/useNameCheck';

const roles = [{name: 'Seer'}, {name: 'Private Role'}];

describe('useNameCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('names too short to check', () => {
    it.each(['', '   ', 'a'])('stays idle for %j', (name) => {
      const {result} = renderHook(() => useNameCheck(name, roles));
      expect(result.current).toBe('idle');
    });
  });

  it('reports checking immediately and settles to available after 500ms', async () => {
    const {result} = renderHook(() => useNameCheck('Unique', roles));

    expect(result.current).toBe('checking');
    await act(async () => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('checking');
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('available');
  });

  it('trims and compares names case-insensitively across local roles', async () => {
    const {result} = renderHook(() => useNameCheck('  private ROLE  ', roles));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('taken');
  });

  it('reports taken for an official role collision', async () => {
    const {result} = renderHook(() => useNameCheck('Werewolf', [{name: 'Werewolf'}]));

    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('taken');
  });

  it('does not report available until the local roles are ready', async () => {
    const {result, rerender} = renderHook(
      ({enabled}: {enabled: boolean}) => useNameCheck('Unique', roles, enabled),
      {initialProps: {enabled: false}},
    );

    expect(result.current).toBe('idle');
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('idle');
    rerender({enabled: true});
    expect(result.current).toBe('checking');
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('available');
  });

  it('only settles the newest name after rapid changes', async () => {
    const {result, rerender} = renderHook(
      ({name}: {name: string}) => useNameCheck(name, roles),
      {initialProps: {name: 'Se'}},
    );

    rerender({name: 'Seer'});
    rerender({name: 'Newest'});
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('available');
  });

  it('ignores pending work after the name becomes too short', async () => {
    const {result, rerender} = renderHook(
      ({name}: {name: string}) => useNameCheck(name, roles),
      {initialProps: {name: 'Unique'}},
    );

    rerender({name: 'a'});
    expect(result.current).toBe('idle');
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('idle');
  });

  it('cancels pending work when unmounted', async () => {
    const {unmount} = renderHook(() => useNameCheck('Unique', roles));
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
  });
});
