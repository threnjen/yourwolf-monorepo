import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor, act} from '@testing-library/react';
import {useRoles} from '../../hooks/useRoles';
import {RepositoryProvider} from '../../context/repository_context';
import {createMockRoles} from '../mocks';
import type {IndexedDbRepositories} from '../../data';
import type {RoleListItem} from '../../types/transport';

function makeRepository(list: () => Promise<RoleListItem[]>): IndexedDbRepositories {
  return {
    roles: {list: vi.fn(list), get: vi.fn(), put: vi.fn(), delete: vi.fn()},
    abilities: {list: vi.fn()},
    games: {get: vi.fn(), put: vi.fn()},
    metadata: {get: vi.fn()},
    bootstrap: vi.fn().mockResolvedValue(undefined),
    reseed: vi.fn(),
    close: vi.fn(),
  } as unknown as IndexedDbRepositories;
}

function renderWithRepository(list: () => Promise<RoleListItem[]>, visibility?: string[]) {
  const repositories = makeRepository(list);
  const wrapper = ({children}: {children: React.ReactNode}) => (
    <RepositoryProvider repositories={repositories}>{children}</RepositoryProvider>
  );
  return {
    repositories,
    ...renderHook(({value}: {value?: string[]}) => useRoles(value), {
      initialProps: {value: visibility},
      wrapper,
    }),
  };
}

describe('useRoles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with loading true while the repository read is pending', () => {
    const {result} = renderWithRepository(() => new Promise(() => {}), ['official']);
    expect(result.current.loading).toBe(true);
    expect(result.current.roles).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns the roles matching every requested visibility', async () => {
    const roles = createMockRoles(3);
    const {result, rerender, repositories} = renderWithRepository(async () => roles, ['official', 'private']);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.roles).toEqual(roles.filter((role) => ['official', 'private'].includes(role.visibility)));
    expect(result.current.error).toBeNull();
    expect(repositories.roles.list).toHaveBeenCalledWith();
    await act(async () => {
      rerender({value: ['official', 'private']});
      await Promise.resolve();
    });
    expect(repositories.roles.list).toHaveBeenCalledTimes(1);
  });

  it('returns the complete unfiltered catalog without arguments', async () => {
    const roles = createMockRoles(3);
    const {result} = renderWithRepository(async () => roles);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.roles).toEqual(roles);
  });

  it('refetches when visibility changes and when explicitly requested', async () => {
    const initialRoles = createMockRoles(2);
    const updatedRoles = createMockRoles(5);
    const list = vi.fn()
      .mockResolvedValueOnce(initialRoles)
      .mockResolvedValueOnce(updatedRoles)
      .mockResolvedValueOnce(updatedRoles);
    const {result, rerender, repositories} = renderWithRepository(list, ['official']);

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({value: ['official', 'private']});
    await waitFor(() => expect(repositories.roles.list).toHaveBeenCalledTimes(2));
    await act(async () => result.current.refetch());
    expect(repositories.roles.list).toHaveBeenCalledTimes(3);
    expect(result.current.roles).toHaveLength(3);
  });

  it('sets loading during a pending refetch and clears the previous error after success', async () => {
    const roles = createMockRoles(3);
    let resolveSecond: ((value: RoleListItem[]) => void) | undefined;
    const list = vi.fn()
      .mockRejectedValueOnce(new Error('IndexedDB read failed'))
      .mockImplementationOnce(() => new Promise<RoleListItem[]>((resolve) => {
        resolveSecond = resolve;
      }));
    const {result} = renderWithRepository(list, ['official', 'private']);

    await waitFor(() => expect(result.current.error).toBe('IndexedDB read failed'));
    act(() => {
      void result.current.refetch();
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await act(async () => {
      resolveSecond?.(roles);
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.roles).toHaveLength(2);
  });

  it('propagates Error and non-Error repository failures', async () => {
    const first = renderWithRepository(async () => {
      throw new Error('IndexedDB read failed');
    }, ['official']);
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.error).toBe('IndexedDB read failed');
    expect(first.result.current.roles).toEqual([]);

    const second = renderWithRepository(async () => {
      throw 'bad read';
    }, ['official']);
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.error).toBe('Failed to fetch roles');
    expect(second.result.current.roles).toEqual([]);
  });
});
