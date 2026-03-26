import {Link} from 'react-router-dom';
import {theme} from '../styles/theme';

const headerStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '60px',
  backgroundColor: theme.colors.surface,
  borderBottom: `1px solid ${theme.colors.surfaceLight}`,
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${theme.spacing.lg}`,
  zIndex: 1000,
  boxShadow: theme.shadows.md,
};

const logoStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
};

const titleStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: theme.colors.text,
  letterSpacing: '0.5px',
};

const accentStyles: React.CSSProperties = {
  color: theme.colors.primary,
};

export function Header() {
  return (
    <header style={headerStyles}>
      <Link to="/" style={logoStyles}>
        <span style={titleStyles}>
          Your<span style={accentStyles}>Wolf</span>
        </span>
      </Link>
    </header>
  );
}
