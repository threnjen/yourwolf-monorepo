import type {ReactNode} from 'react';
import {render, waitFor, type RenderResult} from '@testing-library/react';
import {
  createIndexedDbRepositories,
  deleteDatabase,
  type IndexedDbRepositories,
} from '../data';
import {RepositoryProvider} from '../context/repository_context';

export interface RepositoryTestContext {
  readonly databaseName: string;
  readonly repositories: IndexedDbRepositories;
  readonly cleanup: () => Promise<void>;
}

export async function createRepositoryTestContext(): Promise<RepositoryTestContext> {
  const databaseName = `yourwolf-test-${crypto.randomUUID()}`;
  const repositories = await createIndexedDbRepositories({databaseName});
  try {
    await repositories.bootstrap();
  } catch (error) {
    repositories.close();
    await deleteDatabase(databaseName);
    throw error;
  }

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
