import {useRoles} from '../hooks/useRoles';
import {RoleCard} from '../components/RoleCard';
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

const gridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: theme.spacing.lg,
};

const loadingStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
  color: theme.colors.textMuted,
  fontSize: '1.1rem',
};

const errorStyles: React.CSSProperties = {
  backgroundColor: `${theme.colors.error}20`,
  border: `1px solid ${theme.colors.error}`,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.lg,
  color: theme.colors.error,
  textAlign: 'center',
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

export function Roles() {
  const {roles, loading, error} = useRoles();

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={loadingStyles}>
          <span>Loading roles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyles}>
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

  return (
    <div style={containerStyles}>
      <header style={headerStyles}>
        <h1 style={titleStyles}>Official Roles</h1>
        <p style={subtitleStyles}>
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
        <div style={gridStyles}>
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}

