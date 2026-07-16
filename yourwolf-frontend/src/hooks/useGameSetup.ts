import {useState, useMemo, useCallback} from 'react';
import type {RoleListItem} from '../types/role';
import type {WakeOrderRouterState} from '../types/routerState';
import {
  buildRoleMap,
  countSelectedCards,
  toggleRoleSelection,
  adjustRoleCount,
} from '../domain/roleSelection';

export const PLAYER_COUNT_MIN = 3;
export const PLAYER_COUNT_MAX = 20;
export const CENTER_COUNT_MIN = 0;
export const CENTER_COUNT_MAX = 5;
export const TIMER_MIN_SECONDS = 60;
export const TIMER_MAX_SECONDS = 1800;
export const TIMER_STEP_SECONDS = 30;

export function useGameSetup(roles: RoleListItem[]) {
  const [playerCount, setPlayerCount] = useState(5);
  const [centerCount, setCenterCount] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [playerCountInput, setPlayerCountInput] = useState('5');
  const [centerCountInput, setCenterCountInput] = useState('3');
  const [timerSecondsInput, setTimerSecondsInput] = useState('300');
  const [selectedRoleCounts, setSelectedRoleCounts] = useState<Record<string, number>>({});

  const roleMap = useMemo(() => buildRoleMap(roles), [roles]);

  const totalSelectedCards = useMemo(
    () => countSelectedCards(selectedRoleCounts),
    [selectedRoleCounts],
  );

  const totalCardsNeeded = playerCount + centerCount;
  const canStart = totalSelectedCards === totalCardsNeeded;

  const selectRole = useCallback(
    (roleId: string) => {
      setSelectedRoleCounts((prev) => toggleRoleSelection(prev, roleId, roleMap));
    },
    [roleMap],
  );

  const adjustCount = useCallback(
    (roleId: string, delta: number) => {
      setSelectedRoleCounts((prev) => adjustRoleCount(prev, roleId, delta, roleMap));
    },
    [roleMap],
  );

  // Readiness payload: non-null only once the selection is complete. The page owns
  // navigation — this hook stays independent of react-router.
  const wakeOrderPayload: WakeOrderRouterState | null = useMemo(
    () =>
      canStart
        ? {playerCount, centerCount, timerSeconds, selectedRoleCounts, roles}
        : null,
    [canStart, playerCount, centerCount, timerSeconds, selectedRoleCounts, roles],
  );

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
    selectRole,
    adjustCount,
    wakeOrderPayload,
  };
}
