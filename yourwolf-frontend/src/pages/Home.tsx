import {Link} from 'react-router-dom';
import {theme} from '../styles/theme';

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 150px)',
  textAlign: 'center',
  padding: theme.spacing.xl,
};

const titleStyles: React.CSSProperties = {
  fontSize: '3rem',
  fontWeight: 700,
  color: theme.colors.text,
  marginBottom: theme.spacing.md,
};

const accentStyles: React.CSSProperties = {
  color: theme.colors.primary,
};

const subtitleStyles: React.CSSProperties = {
  fontSize: '1.25rem',
  color: theme.colors.textMuted,
  maxWidth: '600px',
  marginBottom: theme.spacing.xl,
  lineHeight: 1.6,
};

const ctaButtonStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
  backgroundColor: theme.colors.primary,
  color: theme.colors.text,
  borderRadius: theme.borderRadius.md,
  fontSize: '1rem',
  fontWeight: 500,
  transition: 'background-color 0.2s ease',
  border: 'none',
};

const featuresContainerStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: theme.spacing.lg,
  marginTop: theme.spacing.xl,
  width: '100%',
  maxWidth: '900px',
};

const featureCardStyles: React.CSSProperties = {
  backgroundColor: theme.colors.surface,
  padding: theme.spacing.lg,
  borderRadius: theme.borderRadius.md,
  boxShadow: theme.shadows.sm,
};

const featureIconStyles: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: theme.spacing.sm,
};

const featureTitleStyles: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: theme.colors.text,
  marginBottom: theme.spacing.xs,
};

const featureDescStyles: React.CSSProperties = {
  fontSize: '0.9rem',
  color: theme.colors.textMuted,
};

export function Home() {
  return (
    <div style={containerStyles}>
      <h1 style={titleStyles}>
        Welcome to Your<span style={accentStyles}>Wolf</span>
      </h1>
      <p style={subtitleStyles}>
        A customizable One Night Ultimate Werewolf game facilitator. Browse
        official roles, create your own, and run games with friends.
      </p>

      <Link
        to="/roles"
        style={ctaButtonStyles}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.primaryLight;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = theme.colors.primary;
        }}
      >
        <span>🎭</span> Browse Roles
      </Link>

      <div style={featuresContainerStyles}>
        <div style={featureCardStyles}>
          <div style={featureIconStyles}>📚</div>
          <h3 style={featureTitleStyles}>Official Roles</h3>
          <p style={featureDescStyles}>
            Access all official One Night Ultimate Werewolf roles with detailed
            descriptions and abilities.
          </p>
        </div>

        <div style={featureCardStyles}>
          <div style={featureIconStyles}>🔧</div>
          <h3 style={featureTitleStyles}>Custom Roles</h3>
          <p style={featureDescStyles}>
            Create and share your own custom roles with unique abilities and
            win conditions.
          </p>
        </div>

        <div style={featureCardStyles}>
          <div style={featureIconStyles}>🎮</div>
          <h3 style={featureTitleStyles}>Game Facilitator</h3>
          <p style={featureDescStyles}>
            Run games smoothly with our built-in game facilitator that handles
            night phases and timing.
          </p>
        </div>
      </div>
    </div>
  );
}

