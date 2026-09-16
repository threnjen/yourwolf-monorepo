import type {ReactNode} from 'react';
import {render, waitFor, type RenderResult} from '@testing-library/react';
import {vi} from 'vitest';
import {
  createIndexedDbRepositories,
  deleteDatabase,
  type IndexedDbRepositories,
} from '../data';
import {RepositoryProvider} from '../context/repository_context';

export interface NoNetworkGuard {
  readonly getFetchAttempts: () => number;
  readonly getXhrAttempts: () => number;
  readonly assertNoRequests: () => void;
  readonly restore: () => void;
}

export function installNoNetworkGuard(): NoNetworkGuard {
  let fetchAttempts = 0;
  let xhrAttempts = 0;
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (...args) => {
    void args;
    fetchAttempts += 1;
    return new Response(null, {status: 204});
  });
  const originalXmlHttpRequest = globalThis.XMLHttpRequest;
  const xhrSpy = vi.spyOn(globalThis, 'XMLHttpRequest').mockImplementation(() => {
    const request = new originalXmlHttpRequest();
    vi.spyOn(request, 'send').mockImplementation(() => {
      xhrAttempts += 1;
    });
    return request;
  });

  return {
    getFetchAttempts: () => fetchAttempts,
    getXhrAttempts: () => xhrAttempts,
    assertNoRequests: () => {
      if (fetchAttempts !== 0 || xhrAttempts !== 0) {
        throw new Error(`Unexpected browser requests: fetch=${fetchAttempts}, XMLHttpRequest=${xhrAttempts}`);
      }
    },
    restore: () => {
      fetchSpy.mockRestore();
      xhrSpy.mockRestore();
    },
  };
}

export interface RepositoryTestContext {
  readonly databaseName: string;
  readonly repositories: IndexedDbRepositories;
  readonly cleanup: () => Promise<void>;
}

export async function createRepositoryTestContext(): Promise<RepositoryTestContext> {
  const databaseName = `yourwolf-test-${crypto.randomUUID()}`;
  let openedRepositories: IndexedDbRepositories | null = null;
  try {
    openedRepositories = await createIndexedDbRepositories({databaseName});
    await openedRepositories.bootstrap();
  } catch (error) {
    openedRepositories?.close();
    await deleteDatabase(databaseName);
    throw error;
  }
  if (openedRepositories === null) {
    throw new Error('Repository initialization failed');
  }
  const repositories = openedRepositories;

  let cleaned = false;
  return {
    databaseName,
    repositories,
    async cleanup() {
      if (cleaned) return;
      cleaned = true;
      repositories.close();
      await deleteDatabase(databaseName);
    },
  };
}

export async function renderWithRepositories(ui: ReactNode): Promise<RenderResult & RepositoryTestContext> {
  const context = await createRepositoryTestContext();
  try {
    const rendered = render(
      <RepositoryProvider repositories={context.repositories}>
        {ui}
      </RepositoryProvider>,
    );
    await waitFor(async () => {
      const metadata = await context.repositories.metadata.get();
      if (metadata === null) {
        throw new Error('Repository bootstrap has not completed');
      }
    });
    return {...rendered, ...context};
  } catch (error) {
    await context.cleanup();
    throw error;
  }
}
