import {useCallback} from 'react';
import {abilitiesApi} from '../api/abilities';
import {Ability} from '../types/role';
import {useFetch} from './useFetch';

interface UseAbilitiesResult {
  abilities: Ability[];
  loading: boolean;
  error: string | null;
}

export function useAbilities(): UseAbilitiesResult {
  const fetcher = useCallback(() => abilitiesApi.list(), []);
  const {data, loading, error} = useFetch(fetcher, {
    initialData: [],
    errorMessage: 'Failed to fetch abilities',
  });

  return {abilities: data ?? [], loading, error};
}
