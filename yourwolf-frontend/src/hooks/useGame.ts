import {useState, useEffect, useCallback} from 'react';
import type {GameSession} from '../engine/gameSession';
import {buildNightScript, totalDurationSeconds} from '../engine/narration';
import {loadGameSnapshot} from '../storage/game_session_storage';
import type {NightScript} from '../types/game';
import {useFetch} from './useFetch';

interface UseGameResult {
  game: GameSession | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGame(gameId: string): UseGameResult {
  const fetcher = useCallback(
    async (): Promise<GameSession | null> => loadGameSnapshot(gameId)?.session ?? null,
    [gameId],
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
  const [script, setScript] = useState<NightScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchScript = async () => {
      setLoading(true);
      setError(null);
      try {
        const snapshot = loadGameSnapshot(gameId);
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
