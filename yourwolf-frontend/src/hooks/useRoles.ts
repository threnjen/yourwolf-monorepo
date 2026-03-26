import {useState, useEffect, useCallback} from 'react';
import {rolesApi} from '../api/roles';
import {RoleListItem} from '../types/role';

interface UseRolesResult {
  roles: RoleListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRoles(): UseRolesResult {
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rolesApi.listOfficial();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {roles, loading, error, refetch: fetchRoles};
}
