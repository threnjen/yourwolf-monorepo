import {useCallback, useMemo} from 'react';
import {useRepositories} from '../context/repository_context';
import type {RoleListItem} from '../types/transport';
import {useFetch} from './useFetch';

interface UseRolesResult {
  roles: RoleListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRoles(visibility?: string[]): UseRolesResult {
  const {repositories} = useRepositories();
  const visibilityKey = useMemo(
    () => (visibility === undefined ? '__undefined__' : [...visibility].sort().join(',')),
    [visibility],
  );

  const fetcher = useCallback(async (): Promise<RoleListItem[]> => {
    if (repositories === null) {
      throw new Error('Repositories are unavailable');
    }
    const roles = await repositories.roles.list();
    if (visibilityKey === '__undefined__' || visibilityKey === '') {
      return roles;
    }
    const allowedVisibility = new Set(visibilityKey.split(','));
    return roles.filter((role) => allowedVisibility.has(role.visibility));
  }, [repositories, visibilityKey]);

  const {data, loading, error, refetch} = useFetch(fetcher, {
    initialData: [],
    errorMessage: 'Failed to fetch roles',
  });

  return {roles: data ?? [], loading, error, refetch};
}
