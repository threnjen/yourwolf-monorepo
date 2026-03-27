import {useState, useEffect, useCallback} from 'react';
import {gamesApi} from '../api/games';
import type {GameSession, NightScript} from '../types/game';
import {useFetch} from './useFetch';

interface UseGameResult {
  game: GameSession | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGame(gameId: string): UseGameResult {
  const fetcher = useCallback(() => gamesApi.getById(gameId), [gameId]);
  const {data, loading, error, refetch} = useFetch(fetcher, {
    errorMessage: 'Failed to load game',
  });

  return {game: data, loading, error, refetch};
}

interface UseNightScriptResult {
  script: NightScript | null;
  loading: boolean;
  error: string | null;
}

export function useNightScript(
  gameId: string,
  enabled: boolean = true,
): UseNightScriptResult {
  const [script, setScript] = useState<NightScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchScript = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await gamesApi.getNightScript(gameId);
        setScript(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load night script',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [gameId, enabled]);

  return {script, loading, error};
}
