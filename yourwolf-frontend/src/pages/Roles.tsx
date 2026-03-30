import {useState, useMemo} from 'react';
import {useRoles} from '../hooks/useRoles';
import {RoleCard} from '../components/RoleCard';
import {theme, capitalize} from '../styles/theme';
import {pageContainerStyles, pageHeaderStyles, pageTitleStyles, pageSubtitleStyles, loadingStyles, errorStyles, teamHeaderStyles} from '../styles/shared';
import {groupRolesByTeam} from '../utils/roleSort';

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

const teamSectionStyles: React.CSSProperties = {
  marginBottom: theme.spacing.xl,
};

const filterBarStyles: React.CSSProperties = {
  display: 'flex',
  gap: theme.spacing.sm,
  marginBottom: theme.spacing.lg,
};

function getFilterButtonStyles(isActive: boolean): React.CSSProperties {
  return {
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.sm,
    border: `2px solid ${isActive ? theme.colors.primary : theme.colors.secondary}`,
    backgroundColor: isActive ? `${theme.colors.primary}30` : 'transparent',
    color: isActive ? theme.colors.primary : theme.colors.textMuted,
    cursor: 'pointer',
    fontWeight: isActive ? 600 : 400,
    fontSize: '0.85rem',
  };
}

const FILTER_CONFIG = [
  {key: 'official', label: 'Official'},
  {key: 'private', label: 'My Roles'},
  {key: 'public', label: 'Downloaded'},
] as const;

const DEFAULT_FILTERS = new Set(['official', 'private']);

export function Roles() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(() => new Set(DEFAULT_FILTERS));
  const visibility = useMemo(() => Array.from(activeFilters), [activeFilters]);
  const {roles, loading, error} = useRoles(visibility);

  const handleFilterToggle = (key: string) => {
    setActiveFilters((prev) => {
      if (prev.has(key)) {
        if (prev.size <= 1) return prev;
        const next = new Set(prev);
        next.delete(key);
        return next;
      }
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

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
        <h1 style={pageTitleStyles}>Roles</h1>
        <p style={pageSubtitleStyles}>
          Browse and manage your werewolf roles
        </p>
      </header>

      <div style={filterBarStyles}>
        {FILTER_CONFIG.map(({key, label}) => (
          <button
            key={key}
            type="button"
            aria-pressed={activeFilters.has(key)}
            style={getFilterButtonStyles(activeFilters.has(key))}
            onClick={() => handleFilterToggle(key)}
          >
            {label}
          </button>
        ))}
      </div>

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

