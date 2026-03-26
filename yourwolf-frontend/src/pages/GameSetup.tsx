import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useRoles} from '../hooks/useRoles';
import {RoleCard} from '../components/RoleCard';
import {gamesApi} from '../api/games';
import {theme} from '../styles/theme';

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

export function GameSetupPage(): React.ReactElement {
  const navigate = useNavigate();
  const {roles, loading} = useRoles();

  const [playerCount, setPlayerCount] = useState(5);
  const [centerCount, setCenterCount] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCardsNeeded = playerCount + centerCount;
  const canStart = selectedRoleIds.length === totalCardsNeeded && !submitting;

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

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
            value={playerCount}
            onChange={(e) =>
              setPlayerCount(
                Math.max(3, Math.min(20, parseInt(e.target.value) || 3)),
              )
            }
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
            value={centerCount}
            onChange={(e) =>
              setCenterCount(
                Math.max(0, Math.min(5, parseInt(e.target.value) || 0)),
              )
            }
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
            value={timerSeconds}
            onChange={(e) =>
              setTimerSeconds(
                Math.max(60, Math.min(1800, parseInt(e.target.value) || 60)),
              )
            }
            style={inputStyle}
          />
        </div>
      </div>

      {/* Role Selection */}
      <div style={{marginBottom: theme.spacing.md}}>
        <h2 style={{color: theme.colors.text, fontSize: '1.4rem'}}>
          Select Roles ({selectedRoleIds.length} / {totalCardsNeeded})
        </h2>
        <p style={subtitleStyles}>
          You need exactly {totalCardsNeeded} roles ({playerCount} players +{' '}
          {centerCount} center)
        </p>
      </div>

      <div style={roleGridStyles}>
        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => toggleRole(role.id)}
            style={{
              opacity: selectedRoleIds.includes(role.id) ? 1 : 0.5,
              border: selectedRoleIds.includes(role.id)
                ? `2px solid ${theme.colors.primary}`
                : '2px solid transparent',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
          >
            <RoleCard role={role} />
          </div>
        ))}
      </div>

      {/* Start Button */}
      <button
        onClick={handleStartGame}
        disabled={!canStart}
        style={{
          ...buttonStyle,
          opacity: canStart ? 1 : 0.5,
          cursor: canStart ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'Creating Game...' : 'Start Game'}
      </button>
    </div>
  );
}
