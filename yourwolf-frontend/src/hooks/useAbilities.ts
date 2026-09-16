import {useCallback} from 'react';
import {useRepositories} from '../context/repository_context';
import type {Ability} from '../types/transport';
import {useFetch} from './useFetch';

interface UseAbilitiesResult {
  abilities: Ability[];
  loading: boolean;
  error: string | null;
}

export function useAbilities(): UseAbilitiesResult {
  const {repositories} = useRepositories();
  const fetcher = useCallback(async (): Promise<Ability[]> => {
    if (repositories === null) {
      throw new Error('Repositories are unavailable');
    }
    return repositories.abilities.list();
  }, [repositories]);
  const {data, loading, error} = useFetch(fetcher, {
    initialData: [],
    errorMessage: 'Failed to fetch abilities',
  });

  return {abilities: data ?? [], loading, error};
}
