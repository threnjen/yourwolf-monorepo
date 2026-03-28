import {useCallback} from 'react';
import {rolesApi} from '../api/roles';
import {RoleListItem} from '../types/role';
import {useFetch} from './useFetch';

interface UseRolesResult {
  roles: RoleListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRoles(): UseRolesResult {
  const fetcher = useCallback(() => rolesApi.listOfficial(), []);
  const {data, loading, error, refetch} = useFetch(fetcher, {
    initialData: [],
    errorMessage: 'Failed to fetch roles',
  });

  return {roles: data ?? [], loading, error, refetch};
}
