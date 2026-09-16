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
    const {result} = renderWithRepository(async () => roles, ['official', 'private']);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.roles).toEqual(roles.filter((role) => ['official', 'private'].includes(role.visibility)));
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

  it('propagates Error and non-Error repository failures', async () => {
    const first = renderWithRepository(async () => {
      throw new Error('IndexedDB read failed');
    }, ['official']);
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.error).toBe('IndexedDB read failed');

    const second = renderWithRepository(async () => {
      throw 'bad read';
    }, ['official']);
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.error).toBe('Failed to fetch roles');
  });
});
