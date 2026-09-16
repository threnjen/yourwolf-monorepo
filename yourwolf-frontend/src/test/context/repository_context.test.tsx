import {describe, expect, it, vi} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';
import {
  RepositoryProvider,
  useRepositories,
} from '../../context/repository_context';
import {renderWithRepositories} from '../test_utils';

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
});
