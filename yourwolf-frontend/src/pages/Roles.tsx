import {useRoles} from '../hooks/useRoles';
import {RoleCard} from '../components/RoleCard';
import {theme, capitalize, TEAM_COLORS} from '../styles/theme';
import {pageContainerStyles, pageHeaderStyles, pageTitleStyles, pageSubtitleStyles, loadingStyles, errorStyles} from '../styles/shared';
import {groupRolesByTeam} from '../utils/roleSort';
import type {Team} from '../types/role';

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: theme.spacing.lg,
};

const emptyStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '200px',
  color: theme.colors.textMuted,
  textAlign: 'center',
};

const emptyIconStyles: React.CSSProperties = {
  fontSize: '3rem',
  marginBottom: theme.spacing.md,
};

const teamHeaderStyles = (team: Team): React.CSSProperties => ({
  fontSize: '1.4rem',
  fontWeight: 600,
  color: TEAM_COLORS[team] ?? theme.colors.textMuted,
  margin: 0,
});

const teamSectionStyles: React.CSSProperties = {
  marginBottom: theme.spacing.xl,
};

export function Roles() {
  const {roles, loading, error} = useRoles();

  if (loading) {
    return (
      <div style={pageContainerStyles}>
        <div style={loadingStyles}>
          <span>Loading roles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageContainerStyles}>
        <div style={errorStyles}>
          <p>
            <strong>Error loading roles:</strong> {error}
          </p>
          <p style={{marginTop: theme.spacing.sm, fontSize: '0.9rem'}}>
            Make sure the backend server is running at the configured API URL.
          </p>
        </div>
      </div>
    );
  }

  const teamGroups = groupRolesByTeam(roles);

  return (
    <div style={pageContainerStyles}>
      <header style={pageHeaderStyles}>
        <h1 style={pageTitleStyles}>Official Roles</h1>
        <p style={pageSubtitleStyles}>
          Browse all official One Night Ultimate Werewolf roles
        </p>
      </header>

      {roles.length === 0 ? (
        <div style={emptyStyles}>
          <div style={emptyIconStyles}>🎭</div>
          <p>No roles found.</p>
          <p style={{fontSize: '0.9rem', marginTop: theme.spacing.xs}}>
            Check that the backend has been seeded with role data.
          </p>
        </div>
      ) : (
        teamGroups.map((group) => (
          <div key={group.team} data-testid="team-section" style={teamSectionStyles}>
            <h2 style={teamHeaderStyles(group.team)}>{capitalize(group.team)}</h2>
            <div style={gridStyles}>
              {group.roles.map((role) => (
                <RoleCard key={role.id} role={role} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

