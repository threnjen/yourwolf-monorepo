import {useCallback, useMemo} from 'react';
import {rolesApi} from '../api/roles';
import {RoleListItem} from '../types/role';
import {useFetch} from './useFetch';

interface UseRolesResult {
  roles: RoleListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRoles(visibility?: string[]): UseRolesResult {
  const visibilityKey = useMemo(
    () => (visibility ? [...visibility].sort().join(',') : ''),
    [visibility],
  );

  const fetcher = useCallback(
    () => (visibility ? rolesApi.list({visibility}) : rolesApi.list()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibilityKey],
  );

  const {data, loading, error, refetch} = useFetch(fetcher, {
    initialData: [],
    errorMessage: 'Failed to fetch roles',
  });

  return {roles: data ?? [], loading, error, refetch};
}
