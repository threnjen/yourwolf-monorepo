import {theme, TEAM_COLORS} from './theme';
import type {Team} from '../types/role';

export const loadingStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
  color: theme.colors.textMuted,
  fontSize: '1.1rem',
};

export const errorStyles: React.CSSProperties = {
  backgroundColor: `${theme.colors.error}20`,
  border: `1px solid ${theme.colors.error}`,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.lg,
  color: theme.colors.error,
  textAlign: 'center',
};

export const pageContainerStyles: React.CSSProperties = {
  width: '100%',
};

export const pageHeaderStyles: React.CSSProperties = {
  marginBottom: theme.spacing.lg,
};

export const pageTitleStyles: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: theme.colors.text,
  marginBottom: theme.spacing.xs,
};

export const pageSubtitleStyles: React.CSSProperties = {
  fontSize: '1rem',
  color: theme.colors.textMuted,
};

export const selectStyles: React.CSSProperties = {
  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
  borderRadius: theme.borderRadius.sm,
  border: `1px solid ${theme.colors.secondary}`,
  backgroundColor: theme.colors.surface,
  color: theme.colors.text,
  fontSize: '0.85rem',
};

export const teamHeaderStyles = (team: Team): React.CSSProperties => ({
  fontSize: '1.4rem',
  fontWeight: 600,
  color: TEAM_COLORS[team] ?? theme.colors.textMuted,
  margin: 0,
});
