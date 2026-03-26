import {NavLink} from 'react-router-dom';
import {theme} from '../styles/theme';

const sidebarStyles: React.CSSProperties = {
  position: 'fixed',
  top: '60px',
  left: 0,
  width: '240px',
  height: 'calc(100vh - 60px)',
  backgroundColor: theme.colors.surface,
  borderRight: `1px solid ${theme.colors.surfaceLight}`,
  padding: theme.spacing.md,
  overflowY: 'auto',
};

const navStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.xs,
};

const navLinkBaseStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  borderRadius: theme.borderRadius.md,
  color: theme.colors.textMuted,
  transition: 'all 0.2s ease',
  fontSize: '0.95rem',
};

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
}

function NavItem({to, icon, label}: NavItemProps) {
  return (
    <NavLink
      to={to}
      style={({isActive}) => ({
        ...navLinkBaseStyles,
        backgroundColor: isActive ? theme.colors.surfaceLight : 'transparent',
        color: isActive ? theme.colors.text : theme.colors.textMuted,
        fontWeight: isActive ? 500 : 400,
      })}
    >
      <span style={{fontSize: '1.2rem'}}>{icon}</span>
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside style={sidebarStyles}>
      <nav style={navStyles}>
        <NavItem to="/" icon="🏠" label="Home" />
        <NavItem to="/roles" icon="🎭" label="Roles" />
        <NavItem to="/games/new" icon="🎮" label="New Game" />
      </nav>
    </aside>
  );
}
