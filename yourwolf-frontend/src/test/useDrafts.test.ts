import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useDrafts} from '../hooks/useDrafts';
import {RoleDraft} from '../types/role';

const STORAGE_KEY = 'yourwolf_drafts';

const makeDraft = (id: string, name: string): RoleDraft => ({
  id,
  name,
  description: 'A test role',
  team: 'village',
  wake_order: null,
  wake_target: null,
  votes: 1,
  ability_steps: [],
  win_conditions: [],
});

// Simple localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _setRaw: (key: string, value: string) => {
      store[key] = value;
    },
    _reset: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {value: localStorageMock, writable: true});

describe('useDrafts', () => {
  beforeEach(() => {
    localStorageMock._reset();
    vi.clearAllMocks();
  });

  // T1: starts with empty drafts when localStorage returns null
  it('starts with empty drafts when localStorage is empty', () => {
    const {result} = renderHook(() => useDrafts());
    expect(result.current.drafts).toEqual([]);
  });

  // T2: loads existing drafts from localStorage on mount
  it('loads existing drafts from localStorage on mount', () => {
    const stored = [makeDraft('1', 'Test Role')];
    localStorageMock._setRaw(STORAGE_KEY, JSON.stringify(stored));

    const {result} = renderHook(() => useDrafts());
    expect(result.current.drafts).toEqual(stored);
  });

  // T3: saves new draft
  it('saves a new draft and grows the array', () => {
    const {result} = renderHook(() => useDrafts());

    act(() => {
      result.current.saveDraft(makeDraft('1', 'New Role'));
    });

    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.drafts[0].name).toBe('New Role');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
  });

  // T4: updates existing draft with same ID
  it('updates an existing draft with the same ID without changing array length', () => {
    localStorageMock._setRaw(STORAGE_KEY, JSON.stringify([makeDraft('1', 'Original')]));
    const {result} = renderHook(() => useDrafts());

    act(() => {
      result.current.saveDraft(makeDraft('1', 'Updated'));
    });

    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.drafts[0].name).toBe('Updated');
  });

  // T5: deletes draft by ID
  it('deletes a draft by ID', () => {
    localStorageMock._setRaw(
      STORAGE_KEY,
      JSON.stringify([makeDraft('1', 'Keep'), makeDraft('2', 'Delete')]),
    );
    const {result} = renderHook(() => useDrafts());

    act(() => {
      result.current.deleteDraft('2');
    });

    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.drafts[0].id).toBe('1');
  });

  // T6: gets draft by ID
  it('returns a draft by ID', () => {
    const draft = makeDraft('1', 'Found');
    localStorageMock._setRaw(STORAGE_KEY, JSON.stringify([draft]));
    const {result} = renderHook(() => useDrafts());

    expect(result.current.getDraft('1')).toEqual(draft);
  });

  // T7: returns null for unknown ID
  it('returns null for an unknown draft ID', () => {
    localStorageMock._setRaw(STORAGE_KEY, JSON.stringify([makeDraft('1', 'Exists')]));
    const {result} = renderHook(() => useDrafts());

    expect(result.current.getDraft('nonexistent')).toBeNull();
  });

  // T8: clears all drafts
  it('clears all drafts', () => {
    localStorageMock._setRaw(
      STORAGE_KEY,
      JSON.stringify([makeDraft('1', 'A'), makeDraft('2', 'B'), makeDraft('3', 'C')]),
    );
    const {result} = renderHook(() => useDrafts());
    expect(result.current.drafts).toHaveLength(3);

    act(() => {
      result.current.clearAllDrafts();
    });

    expect(result.current.drafts).toEqual([]);
  });

  // T9: handles corrupted localStorage JSON gracefully
  it('falls back to empty array when localStorage contains invalid JSON', () => {
    localStorageMock._setRaw(STORAGE_KEY, 'not-valid-json{{{');
    const {result} = renderHook(() => useDrafts());
    expect(result.current.drafts).toEqual([]);
  });

  // T10: handles non-array localStorage value gracefully
  it('falls back to empty array when localStorage contains a non-array value', () => {
    localStorageMock._setRaw(STORAGE_KEY, JSON.stringify({id: '1', name: 'Not an array'}));
    const {result} = renderHook(() => useDrafts());
    expect(result.current.drafts).toEqual([]);
  });
});
