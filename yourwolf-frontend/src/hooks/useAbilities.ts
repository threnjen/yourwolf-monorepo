import {useState, useEffect, useCallback} from 'react';
import {abilitiesApi} from '../api/abilities';
import {Ability} from '../types/role';

interface UseAbilitiesResult {
  abilities: Ability[];
  loading: boolean;
  error: string | null;
}

export function useAbilities(): UseAbilitiesResult {
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAbilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await abilitiesApi.list();
      setAbilities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch abilities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAbilities();
  }, [fetchAbilities]);

  return {abilities, loading, error};
}
