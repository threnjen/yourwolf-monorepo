import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';
import {
  createIndexedDbRepositories,
  type IndexedDbRepositories,
  type IndexedDbRepositoriesOptions,
} from '../data';

interface RepositoryProviderProps extends IndexedDbRepositoriesOptions {
  readonly children: ReactNode;
  readonly repositories?: IndexedDbRepositories;
}

export interface RepositoryContextValue {
  readonly repositories: IndexedDbRepositories | null;
  readonly loading: boolean;
  readonly error: string | null;
}

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function RepositoryProvider({
  children,
  databaseName,
  repositories: providedRepositories,
}: RepositoryProviderProps) {
  const [repositories, setRepositories] = useState<IndexedDbRepositories | null>(
    providedRepositories ?? null,
  );
  const [loading, setLoading] = useState(providedRepositories === undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let activeRepositories: IndexedDbRepositories | null = null;
    const ownsRepositories = providedRepositories === undefined;

    async function bootstrapRepositories() {
      try {
        const nextRepositories =
          providedRepositories ?? (await createIndexedDbRepositories({databaseName}));
        activeRepositories = nextRepositories;
        if (isMounted) {
          setRepositories(nextRepositories);
        }
        await nextRepositories.bootstrap();
        if (!isMounted) {
          if (ownsRepositories) nextRepositories.close();
          return;
        }
        setRepositories(nextRepositories);
        setError(null);
      } catch (reason) {
        if (ownsRepositories) {
          activeRepositories?.close();
        }
        if (isMounted) {
          setRepositories(null);
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void bootstrapRepositories();

    return () => {
      isMounted = false;
      if (ownsRepositories) activeRepositories?.close();
    };
  }, [databaseName, providedRepositories]);

  const value = useMemo(
    () => ({repositories, loading, error}),
    [repositories, loading, error],
  );

  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

export function useRepositories(): RepositoryContextValue {
  const value = useContext(RepositoryContext);
  if (value === null) {
    throw new Error('useRepositories must be used within RepositoryProvider');
  }
  return value;
}
