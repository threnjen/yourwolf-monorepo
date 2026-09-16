import {afterEach, describe, expect, it, vi} from 'vitest';
import {render, renderHook, screen, waitFor} from '@testing-library/react';
import {
  RepositoryProvider,
  useRepositories,
} from '../../context/repository_context';
import {
  createRepositoryTestContext,
  renderWithRepositories,
} from '../test_utils';
import * as data from '../../data';
import type {IndexedDbRepositories} from '../../data';

function Probe() {
  const {repositories, loading, error} = useRepositories();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error ?? ''}</span>
      <span data-testid="role-count">{repositories ? 'ready' : 'missing'}</span>
    </div>
  );
}

describe('RepositoryProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('bootstraps repositories before exposing them to children', async () => {
    const view = await renderWithRepositories(<Probe />);
    try {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('');
      expect(screen.getByTestId('role-count')).toHaveTextContent('ready');
      await waitFor(async () => {
        await expect(view.repositories.roles.list({visibility: 'official'})).resolves.toHaveLength(30);
      });
    } finally {
      await view.cleanup();
    }
  });

  it('surfaces the original bootstrap failure', async () => {
    const repositories = {
      roles: {list: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn()},
      abilities: {list: vi.fn()},
      games: {get: vi.fn(), put: vi.fn()},
      metadata: {get: vi.fn()},
      bootstrap: vi.fn().mockRejectedValue(new Error('IndexedDB is blocked')),
      reseed: vi.fn(),
      close: vi.fn(),
    };

    render(
      <RepositoryProvider repositories={repositories}>
        <Probe />
      </RepositoryProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('IndexedDB is blocked'));
    expect(screen.getByTestId('error')).toHaveTextContent('IndexedDB is blocked');
    expect(screen.getByTestId('role-count')).toHaveTextContent('missing');
  });

  it('surfaces a repository open failure without exposing a repository', async () => {
    vi.spyOn(data, 'createIndexedDbRepositories').mockRejectedValue(new Error('open failed'));

    render(
      <RepositoryProvider databaseName="open-failure">
        <Probe />
      </RepositoryProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('open failed'));
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('role-count')).toHaveTextContent('missing');
  });

  it('keeps the context value stable across unchanged renders', () => {
    const repositories = {
      roles: {list: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn()},
      abilities: {list: vi.fn()},
      games: {get: vi.fn(), put: vi.fn()},
      metadata: {get: vi.fn()},
      bootstrap: vi.fn().mockResolvedValue(undefined),
      reseed: vi.fn(),
      close: vi.fn(),
    } as unknown as IndexedDbRepositories;
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <RepositoryProvider repositories={repositories}>{children}</RepositoryProvider>
    );

    const {result, rerender} = renderHook(() => useRepositories(), {wrapper});
    const initialValue = result.current;
    rerender();

    expect(result.current).toBe(initialValue);
  });

  it('closes an owned repository once after bootstrap failure and unmount', async () => {
    const repositories = {
      roles: {list: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn()},
      abilities: {list: vi.fn()},
      games: {get: vi.fn(), put: vi.fn()},
      metadata: {get: vi.fn()},
      bootstrap: vi.fn().mockRejectedValue(new Error('bootstrap failed')),
      reseed: vi.fn(),
      close: vi.fn(),
    } as unknown as IndexedDbRepositories;
    vi.spyOn(data, 'createIndexedDbRepositories').mockResolvedValue(repositories);

    const view = render(
      <RepositoryProvider databaseName="bootstrap-failure">
        <Probe />
      </RepositoryProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('bootstrap failed'));
    view.unmount();
    expect(repositories.close).toHaveBeenCalledTimes(1);
  });

  it('closes an owned repository once when unmounted during bootstrap', async () => {
    let resolveBootstrap: (() => void) | undefined;
    const repositories = {
      roles: {list: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn()},
      abilities: {list: vi.fn()},
      games: {get: vi.fn(), put: vi.fn()},
      metadata: {get: vi.fn()},
      bootstrap: vi.fn(() => new Promise<void>((resolve) => {
        resolveBootstrap = resolve;
      })),
      reseed: vi.fn(),
      close: vi.fn(),
    } as unknown as IndexedDbRepositories;
    vi.spyOn(data, 'createIndexedDbRepositories').mockResolvedValue(repositories);

    const view = render(
      <RepositoryProvider databaseName="unmount-failure">
        <Probe />
      </RepositoryProvider>,
    );

    await waitFor(() => expect(repositories.bootstrap).toHaveBeenCalledTimes(1));
    view.unmount();
    resolveBootstrap?.();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(repositories.close).toHaveBeenCalledTimes(1);
  });

  it('deletes an isolated test database when opening the repository fails', async () => {
    vi.spyOn(data, 'createIndexedDbRepositories').mockRejectedValue(new Error('open failed'));
    const deleteDatabase = vi.spyOn(data, 'deleteDatabase');

    await expect(createRepositoryTestContext()).rejects.toThrow('open failed');
    expect(deleteDatabase).toHaveBeenCalledWith(expect.stringMatching(/^yourwolf-test-/));
  });
});
