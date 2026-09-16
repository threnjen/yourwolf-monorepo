import {useState, useEffect, useCallback} from 'react';
import type {GameSession} from '../engine/gameSession';
import {buildNightScript, totalDurationSeconds} from '../engine/narration';
import {useRepositories} from '../context/repository_context';
import type {NightScript} from '../types/game';
import {useFetch} from './useFetch';

interface UseGameResult {
  game: GameSession | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGame(gameId: string): UseGameResult {
  const {repositories} = useRepositories();
  const fetcher = useCallback(
    async (): Promise<GameSession | null> => {
      if (repositories === null) {
        throw new Error('Repositories are unavailable');
      }
      return (await repositories.games.get(gameId))?.session ?? null;
    },
    [gameId, repositories],
  );
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
  const {repositories} = useRepositories();
  const [script, setScript] = useState<NightScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let isCurrent = true;

    const fetchScript = async () => {
      setLoading(true);
      setError(null);
      try {
        if (repositories === null) {
          throw new Error('Repositories are unavailable');
        }
        const snapshot = await repositories.games.get(gameId);
        if (!isCurrent) return;
        if (snapshot === null) {
          setScript(null);
          return;
        }
        const actions = buildNightScript(
          snapshot.roles,
          snapshot.session.wake_order_sequence,
        );
        setScript({
          game_session_id: snapshot.session.id,
          actions,
          total_duration_seconds: totalDurationSeconds(actions),
        });
      } catch (err) {
        if (isCurrent) {
          setError(
            err instanceof Error ? err.message : 'Failed to load night script',
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    void fetchScript();
    return () => {
      isCurrent = false;
    };
  }, [gameId, enabled, repositories]);

  return {script, loading, error};
}
