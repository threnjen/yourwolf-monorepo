import {useState, useEffect, useCallback} from 'react';

interface UseFetchOptions<T> {
  initialData?: T;
  errorMessage?: string;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic fetch hook. Callers MUST wrap `fetcher` in useCallback
 * to avoid infinite re-render loops.
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  options?: UseFetchOptions<T>,
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(options?.initialData ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const errorMessage = options?.errorMessage ?? 'An error occurred';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetcher, errorMessage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {data, loading, error, refetch: fetchData};
}
