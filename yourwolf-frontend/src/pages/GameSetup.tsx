import React, {useState, useMemo, useCallback, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useRoles} from '../hooks/useRoles';
import {RoleCard} from '../components/RoleCard';
import {gamesApi} from '../api/games';
import {theme} from '../styles/theme';
import type {RoleListItem} from '../types/role';

const containerStyles: React.CSSProperties = {
  width: '100%',
};

const headerStyles: React.CSSProperties = {
  marginBottom: theme.spacing.lg,
};

const titleStyles: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: theme.colors.text,
  marginBottom: theme.spacing.xs,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '1rem',
  color: theme.colors.textMuted,
};

const configGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing.md,
  marginBottom: theme.spacing.xl,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: theme.spacing.sm,
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.secondary}`,
  borderRadius: theme.borderRadius.sm,
  color: theme.colors.text,
  fontSize: '16px',
  boxSizing: 'border-box',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  color: theme.colors.textMuted,
  marginBottom: theme.spacing.xs,
  fontSize: '0.9rem',
};

const roleGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: theme.spacing.md,
  marginBottom: theme.spacing.xl,
};

const buttonStyle: React.CSSProperties = {
  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
  backgroundColor: theme.colors.primary,
  color: theme.colors.text,
  border: 'none',
  borderRadius: theme.borderRadius.md,
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const errorStyles: React.CSSProperties = {
  backgroundColor: `${theme.colors.error}20`,
  border: `1px solid ${theme.colors.error}`,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.md,
  color: theme.colors.error,
  marginBottom: theme.spacing.md,
};

const warningStyles: React.CSSProperties = {
  backgroundColor: `${theme.colors.warning}20`,
  border: `1px solid ${theme.colors.warning}`,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.md,
  color: theme.colors.warning,
  marginBottom: theme.spacing.md,
};

const quantityBtnStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  border: `1px solid ${theme.colors.secondary}`,
  borderRadius: theme.borderRadius.sm,
  backgroundColor: theme.colors.surface,
  color: theme.colors.text,
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

const quantityBadgeStyles: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: theme.colors.text,
  minWidth: '20px',
  textAlign: 'center',
};

export function GameSetupPage(): React.ReactElement {
  const navigate = useNavigate();
  const {roles, loading} = useRoles();

  const [playerCount, setPlayerCount] = useState(5);
  const [centerCount, setCenterCount] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [playerCountInput, setPlayerCountInput] = useState('5');
  const [centerCountInput, setCenterCountInput] = useState('3');
  const [timerSecondsInput, setTimerSecondsInput] = useState('300');
  const [selectedRoleCounts, setSelectedRoleCounts] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const currentValidationError = useMemo((): string | null => {
    if (totalSelectedCards < totalCardsNeeded) {
      return `Not enough roles selected — need ${totalCardsNeeded - totalSelectedCards} more`;
    }
    if (totalSelectedCards > totalCardsNeeded) {
      return `Too many roles selected — remove ${totalSelectedCards - totalCardsNeeded}`;
    }
    // Check primary team role for non-village/non-neutral teams
    const teamsWithPrimary: Record<string, boolean> = {};
    for (const [roleId, count] of Object.entries(selectedRoleCounts)) {
      if (count <= 0) continue;
      const role = roleMap[roleId];
      if (!role || role.team === 'village' || role.team === 'neutral') continue;
      if (!(role.team in teamsWithPrimary)) {
        teamsWithPrimary[role.team] = false;
      }
      if (role.is_primary_team_role) {
        teamsWithPrimary[role.team] = true;
      }
    }
    for (const [team, hasPrimary] of Object.entries(teamsWithPrimary)) {
      if (!hasPrimary) {
        return `Missing primary role for ${team} team`;
      }
    }
    return null;
  }, [totalSelectedCards, totalCardsNeeded, selectedRoleCounts, roleMap]);

  const canStart = currentValidationError === null && !submitting;

  const recommendationWarnings = useMemo(() => {
    const warnings: string[] = [];
    for (const [roleId, count] of Object.entries(selectedRoleCounts)) {
      if (count <= 0) continue;
      const role = roleMap[roleId];
      if (!role) continue;
      for (const dep of role.dependencies) {
        if (dep.dependency_type !== 'recommends') continue;
        if (selectedRoleCounts[dep.required_role_id] > 0) continue;
        warnings.push(`${role.name} works best with ${dep.required_role_name} in the game`);
      }
    }
    return warnings;
  }, [selectedRoleCounts, roleMap]);

  useEffect(() => {
    if (canStart) {
      setValidationError(null);
    }
  }, [canStart]);

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
          // Deselect: remove with cascade
          return removeRoleWithCascade(prev, roleId);
        }

        // Select: add at min_count
        const role = roleMap[roleId];
        if (!role) return prev;

        const next = {...prev, [roleId]: role.min_count};

        // Auto-select REQUIRES dependencies
        for (const dep of role.dependencies) {
          if (dep.dependency_type !== 'requires') continue;
          if (next[dep.required_role_id] && next[dep.required_role_id] > 0) continue;
          const requiredRole = roleMap[dep.required_role_id];
          if (!requiredRole) continue;
          next[dep.required_role_id] = requiredRole.min_count;
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
    if (currentValidationError) {
      setValidationError(currentValidationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setValidationError(null);
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

  if (loading) {
    return (
      <div style={{color: theme.colors.textMuted, padding: theme.spacing.xl}}>
        Loading roles...
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h1 style={titleStyles}>New Game Setup</h1>
        <p style={subtitleStyles}>
          Configure your game and select roles for all players and center cards.
        </p>
      </div>

      {error && <div style={errorStyles}>{error}</div>}

      {/* Configuration */}
      <div style={configGridStyles}>
        <div>
          <label htmlFor="player-count" style={labelStyles}>Players</label>
          <input
            id="player-count"
            type="number"
            min={3}
            max={20}
            value={playerCountInput}
            onChange={(e) => setPlayerCountInput(e.target.value)}
            onBlur={() => {
              const v = Math.max(3, Math.min(20, parseInt(playerCountInput) || 3));
              setPlayerCount(v);
              setPlayerCountInput(String(v));
            }}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="center-count" style={labelStyles}>Center Cards</label>
          <input
            id="center-count"
            type="number"
            min={0}
            max={5}
            value={centerCountInput}
            onChange={(e) => setCenterCountInput(e.target.value)}
            onBlur={() => {
              const v = Math.max(0, Math.min(5, parseInt(centerCountInput) || 0));
              setCenterCount(v);
              setCenterCountInput(String(v));
            }}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="timer-seconds" style={labelStyles}>Discussion Timer (seconds)</label>
          <input
            id="timer-seconds"
            type="number"
            min={60}
            max={1800}
            step={30}
            value={timerSecondsInput}
            onChange={(e) => setTimerSecondsInput(e.target.value)}
            onBlur={() => {
              const v = Math.max(60, Math.min(1800, parseInt(timerSecondsInput) || 60));
              setTimerSeconds(v);
              setTimerSecondsInput(String(v));
            }}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Role Selection */}
      <div style={{marginBottom: theme.spacing.md}}>
        <h2 style={{color: theme.colors.text, fontSize: '1.4rem'}}>
          Select Roles ({totalSelectedCards} / {totalCardsNeeded})
        </h2>
        <p style={subtitleStyles}>
          You need exactly {totalCardsNeeded} roles ({playerCount} players +{' '}
          {centerCount} center)
        </p>
      </div>

      <div style={roleGridStyles}>
        {roles.map((role) => {
          const count = selectedRoleCounts[role.id] || 0;
          const isSelected = count > 0;
          const showQuantityControls =
            isSelected && role.min_count !== role.max_count;

          return (
            <div
              key={role.id}
              data-role-id={role.id}
              onClick={() => selectRole(role.id)}
              style={{
                opacity: isSelected ? 1 : 0.5,
                border: isSelected
                  ? `2px solid ${theme.colors.primary}`
                  : '2px solid transparent',
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
                position: 'relative',
              }}
            >
              <RoleCard role={role} />
              {isSelected && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing.sm,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    backgroundColor: theme.colors.surfaceLight,
                    borderBottomLeftRadius: theme.borderRadius.md,
                    borderBottomRightRadius: theme.borderRadius.md,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {showQuantityControls && (
                    <button
                      aria-label={`Decrease ${role.name} count`}
                      onClick={() => adjustCount(role.id, -1)}
                      style={quantityBtnStyles}
                    >
                      −
                    </button>
                  )}
                  <span style={quantityBadgeStyles}>×{count}</span>
                  {showQuantityControls && (
                    <button
                      aria-label={`Increase ${role.name} count`}
                      onClick={() => adjustCount(role.id, 1)}
                      disabled={count >= role.max_count}
                      style={{
                        ...quantityBtnStyles,
                        opacity: count >= role.max_count ? 0.4 : 1,
                        cursor:
                          count >= role.max_count ? 'not-allowed' : 'pointer',
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recommendation Warnings */}
      {recommendationWarnings.length > 0 && (
        <div style={warningStyles}>
          <ul style={{margin: 0, paddingLeft: '1.2em'}}>
            {recommendationWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStartGame}
        disabled={submitting}
        style={{
          ...buttonStyle,
          opacity: canStart ? 1 : 0.5,
          cursor: canStart ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'Creating Game...' : 'Start Game'}
      </button>
      {validationError && <div style={{...errorStyles, marginTop: theme.spacing.md}}>{validationError}</div>}
    </div>
  );
}
