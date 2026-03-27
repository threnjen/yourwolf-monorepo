import {RoleListItem, Team} from '../types/role';
import {theme, TEAM_COLORS, capitalize} from '../styles/theme';

interface RoleCardProps {
  role: RoleListItem;
}

function getTeamColor(team: Team): string {
  return TEAM_COLORS[team];
}

function getTeamLabel(team: Team): string {
  return capitalize(team);
}

const cardStyles: React.CSSProperties = {
  backgroundColor: theme.colors.surface,
  borderRadius: theme.borderRadius.md,
  overflow: 'hidden',
  boxShadow: theme.shadows.md,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  cursor: 'pointer',
};

const cardContentStyles: React.CSSProperties = {
  padding: theme.spacing.md,
};

const headerRowStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing.sm,
};

const titleStyles: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: theme.colors.text,
  margin: 0,
};

const descriptionStyles: React.CSSProperties = {
  fontSize: '0.875rem',
  color: theme.colors.textMuted,
  lineHeight: 1.5,
  marginBottom: theme.spacing.md,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const footerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const badgeBaseStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
  borderRadius: theme.borderRadius.sm,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const wakeOrderStyles: React.CSSProperties = {
  fontSize: '0.8rem',
  color: theme.colors.textMuted,
};

const officialBadgeStyles: React.CSSProperties = {
  fontSize: '0.7rem',
  color: theme.colors.warning,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const copyCountBadgeStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: theme.colors.textMuted,
  fontWeight: 500,
};

export function RoleCard({role}: RoleCardProps) {
  const teamColor = getTeamColor(role.team);
  const isOfficial = role.visibility === 'official';

  return (
    <div
      style={{
        ...cardStyles,
        borderLeft: `4px solid ${teamColor}`,
      }}
      tabIndex={0}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = theme.shadows.lg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = theme.shadows.md;
      }}
      onFocus={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = theme.shadows.lg;
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = theme.shadows.md;
      }}
    >
      <div style={cardContentStyles}>
        <div style={headerRowStyles}>
          <h3 style={titleStyles}>{role.name}</h3>
          {isOfficial && (
            <span style={officialBadgeStyles}>
              <span>✓</span> Official
            </span>
          )}
        </div>

        <p style={descriptionStyles}>
          {role.description || 'No description available.'}
        </p>

        <div style={footerStyles}>
          <span
            style={{
              ...badgeBaseStyles,
              backgroundColor: `${teamColor}20`,
              color: teamColor,
              border: `1px solid ${teamColor}40`,
            }}
          >
            {getTeamLabel(role.team)}
          </span>

          {role.wake_order !== undefined && role.wake_order !== null && (
            <span style={wakeOrderStyles}>Wake Order: {role.wake_order}</span>
          )}

          {role.max_count > 1 && (
            <span style={copyCountBadgeStyles}>
              {role.min_count === role.max_count
                ? `×${role.max_count}`
                : `×${role.min_count}–${role.max_count}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
