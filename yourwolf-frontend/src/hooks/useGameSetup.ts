import {useState, useMemo, useCallback} from 'react';
import type {NavigateFunction} from 'react-router-dom';
import {gamesApi} from '../api/games';
import type {RoleListItem} from '../types/role';

export const PLAYER_COUNT_MIN = 3;
export const PLAYER_COUNT_MAX = 20;
export const CENTER_COUNT_MIN = 0;
export const CENTER_COUNT_MAX = 5;
export const TIMER_MIN_SECONDS = 60;
export const TIMER_MAX_SECONDS = 1800;
export const TIMER_STEP_SECONDS = 30;

export function useGameSetup(roles: RoleListItem[], navigate: NavigateFunction) {
  const [playerCount, setPlayerCount] = useState(5);
  const [centerCount, setCenterCount] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [playerCountInput, setPlayerCountInput] = useState('5');
  const [centerCountInput, setCenterCountInput] = useState('3');
  const [timerSecondsInput, setTimerSecondsInput] = useState('300');
  const [selectedRoleCounts, setSelectedRoleCounts] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleMap = useMemo(() => {
    const map: Record<string, RoleListItem> = {};
    for (const role of roles) {
      map[role.id] = role;
    }
    return map;
  }, [roles]);

  const totalSelectedCards = useMemo(
    () => Object.values(selectedRoleCounts).reduce((sum, c) => sum + c, 0),
    [selectedRoleCounts],
  );

  const selectedRoleIds = useMemo(() => {
    const ids: string[] = [];
    for (const [roleId, count] of Object.entries(selectedRoleCounts)) {
      for (let i = 0; i < count; i++) {
        ids.push(roleId);
      }
    }
    return ids;
  }, [selectedRoleCounts]);

  const totalCardsNeeded = playerCount + centerCount;
  const canStart = totalSelectedCards === totalCardsNeeded && !submitting;

  const removeRoleWithCascade = useCallback(
    (counts: Record<string, number>, roleId: string): Record<string, number> => {
      const next = {...counts};
      delete next[roleId];

      // Cascade-remove any selected role that REQUIRES the removed role
      for (const [otherId, otherCount] of Object.entries(next)) {
        if (otherCount <= 0) continue;
        const otherRole = roleMap[otherId];
        if (!otherRole) continue;
        const requiresRemoved = otherRole.dependencies.some(
          (dep) => dep.dependency_type === 'requires' && dep.required_role_id === roleId,
        );
        if (requiresRemoved) {
          delete next[otherId];
        }
      }
      return next;
    },
    [roleMap],
  );

  const selectRole = useCallback(
    (roleId: string) => {
      setSelectedRoleCounts((prev) => {
        if (prev[roleId] && prev[roleId] > 0) {
          return removeRoleWithCascade(prev, roleId);
        }

        const role = roleMap[roleId];
        if (!role) return prev;

        const next = {...prev, [roleId]: role.default_count};

        for (const dep of role.dependencies) {
          if (dep.dependency_type !== 'requires') continue;
          if (next[dep.required_role_id] && next[dep.required_role_id] > 0) continue;
          const requiredRole = roleMap[dep.required_role_id];
          if (!requiredRole) continue;
          next[dep.required_role_id] = requiredRole.default_count;
        }

        return next;
      });
    },
    [roleMap, removeRoleWithCascade],
  );

  const adjustCount = useCallback(
    (roleId: string, delta: number) => {
      setSelectedRoleCounts((prev) => {
        const role = roleMap[roleId];
        if (!role) return prev;
        const current = prev[roleId] || 0;
        const newCount = current + delta;

        if (newCount > role.max_count) return prev;
        if (newCount < role.min_count) {
          return removeRoleWithCascade(prev, roleId);
        }

        return {...prev, [roleId]: newCount};
      });
    },
    [roleMap, removeRoleWithCascade],
  );

  const handleStartGame = async () => {
    if (!canStart) return;

    setSubmitting(true);
    setError(null);
    try {
      const game = await gamesApi.create({
        player_count: playerCount,
        center_card_count: centerCount,
        discussion_timer_seconds: timerSeconds,
        role_ids: selectedRoleIds,
      });
      navigate(`/games/${game.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create game',
      );
      setSubmitting(false);
    }
  };

  return {
    playerCount,
    setPlayerCount,
    playerCountInput,
    setPlayerCountInput,
    centerCount,
    setCenterCount,
    centerCountInput,
    setCenterCountInput,
    timerSeconds,
    setTimerSeconds,
    timerSecondsInput,
    setTimerSecondsInput,
    selectedRoleCounts,
    totalSelectedCards,
    totalCardsNeeded,
    canStart,
    submitting,
    error,
    selectRole,
    adjustCount,
    handleStartGame,
  };
}
