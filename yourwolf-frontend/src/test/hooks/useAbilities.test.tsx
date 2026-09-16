import {describe, it, expect, vi, beforeEach} from 'vitest';
import {renderHook, waitFor} from '@testing-library/react';
import {useAbilities} from '../../hooks/useAbilities';
import {RepositoryProvider} from '../../context/repository_context';
import {createMockAbility} from '../mocks';
import type {IndexedDbRepositories} from '../../data';
import type {Ability} from '../../types/transport';

function renderWithRepository(list: () => Promise<Ability[]>) {
  const repositories = {
    roles: {list: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn()},
    abilities: {list: vi.fn(list)},
    games: {get: vi.fn(), put: vi.fn()},
    metadata: {get: vi.fn()},
    bootstrap: vi.fn().mockResolvedValue(undefined),
    reseed: vi.fn(),
    close: vi.fn(),
  } as unknown as IndexedDbRepositories;
  const wrapper = ({children}: {children: React.ReactNode}) => (
    <RepositoryProvider repositories={repositories}>{children}</RepositoryProvider>
  );
  return {repositories, ...renderHook(() => useAbilities(), {wrapper})};
}

describe('useAbilities', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with loading true while the repository read is pending', () => {
    const {result} = renderWithRepository(() => new Promise(() => {}));
    expect(result.current.loading).toBe(true);
    expect(result.current.abilities).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns the complete offline ability catalog', async () => {
    const abilities = [
      createMockAbility({id: 'ability-1', type: 'view_card'}),
      createMockAbility({id: 'ability-2', type: 'swap_card'}),
    ];
    const {result, repositories} = renderWithRepository(async () => abilities);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.abilities).toEqual(abilities);
    expect(repositories.abilities.list).toHaveBeenCalledTimes(1);
  });

  it('preserves repository errors and the existing fallback for non-Error failures', async () => {
    const first = renderWithRepository(async () => {
      throw new Error('catalog read failed');
    });
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.error).toBe('catalog read failed');

    const second = renderWithRepository(async () => {
      throw 'bad read';
    });
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.error).toBe('Failed to fetch abilities');
  });
});
