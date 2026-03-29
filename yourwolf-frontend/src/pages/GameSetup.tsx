import {useNavigate} from 'react-router-dom';
import {useRoles} from '../hooks/useRoles';
import {useGameSetup, PLAYER_COUNT_MIN, PLAYER_COUNT_MAX, CENTER_COUNT_MIN, CENTER_COUNT_MAX, TIMER_MIN_SECONDS, TIMER_MAX_SECONDS, TIMER_STEP_SECONDS} from '../hooks/useGameSetup';
import {RoleCard} from '../components/RoleCard';
import {theme, capitalize} from '../styles/theme';
import {pageContainerStyles, pageHeaderStyles, pageTitleStyles, pageSubtitleStyles, teamHeaderStyles} from '../styles/shared';
import {groupRolesByTeam} from '../utils/roleSort';

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

const teamSectionStyles: React.CSSProperties = {
  marginBottom: theme.spacing.lg,
};

export function GameSetupPage() {
  const navigate = useNavigate();
  const {roles, loading} = useRoles();

  const {
    playerCount,
    setPlayerCount,
    playerCountInput,
    setPlayerCountInput,
    centerCount,
    setCenterCount,
    centerCountInput,
    setCenterCountInput,
    setTimerSeconds,
    timerSecondsInput,
    setTimerSecondsInput,
    selectedRoleCounts,
    totalSelectedCards,
    totalCardsNeeded,
    canStart,
    selectRole,
    adjustCount,
    handleNext,
  } = useGameSetup(roles, navigate);

  if (loading) {
    return (
      <div style={{color: theme.colors.textMuted, padding: theme.spacing.xl}}>
        Loading roles...
      </div>
    );
  }

  const teamGroups = groupRolesByTeam(roles);

  return (
    <div style={pageContainerStyles}>
      <div style={pageHeaderStyles}>
        <h1 style={pageTitleStyles}>New Game Setup</h1>
        <p style={pageSubtitleStyles}>
          Configure your game and select roles for all players and center cards.
        </p>
      </div>

      {/* Configuration */}
      <div style={configGridStyles}>
        <div>
          <label htmlFor="player-count" style={labelStyles}>Players</label>
          <input
            id="player-count"
            type="number"
            min={PLAYER_COUNT_MIN}
            max={PLAYER_COUNT_MAX}
            value={playerCountInput}
            onChange={(e) => setPlayerCountInput(e.target.value)}
            onBlur={() => {
              const v = Math.max(PLAYER_COUNT_MIN, Math.min(PLAYER_COUNT_MAX, parseInt(playerCountInput) || PLAYER_COUNT_MIN));
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
            min={CENTER_COUNT_MIN}
            max={CENTER_COUNT_MAX}
            value={centerCountInput}
            onChange={(e) => setCenterCountInput(e.target.value)}
            onBlur={() => {
              const v = Math.max(CENTER_COUNT_MIN, Math.min(CENTER_COUNT_MAX, parseInt(centerCountInput) || CENTER_COUNT_MIN));
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
            min={TIMER_MIN_SECONDS}
            max={TIMER_MAX_SECONDS}
            step={TIMER_STEP_SECONDS}
            value={timerSecondsInput}
            onChange={(e) => setTimerSecondsInput(e.target.value)}
            onBlur={() => {
              const v = Math.max(TIMER_MIN_SECONDS, Math.min(TIMER_MAX_SECONDS, parseInt(timerSecondsInput) || TIMER_MIN_SECONDS));
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
        <p style={pageSubtitleStyles}>
          You need exactly {totalCardsNeeded} roles ({playerCount} players +{' '}
          {centerCount} center)
        </p>
      </div>

      {teamGroups.map((group) => (
        <div key={group.team} data-testid="team-section" style={teamSectionStyles}>
          <h3 style={teamHeaderStyles(group.team)}>{capitalize(group.team)}</h3>
          <div style={roleGridStyles}>
            {group.roles.map((role) => {
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
        </div>
      ))}

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={!canStart}
        style={{
          ...buttonStyle,
          opacity: canStart ? 1 : 0.5,
          cursor: canStart ? 'pointer' : 'not-allowed',
        }}
      >
        Next
      </button>
    </div>
  );
}
