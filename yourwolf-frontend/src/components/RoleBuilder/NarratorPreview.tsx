import {NarratorPreviewAction} from '../../types/role';
import {theme} from '../../styles/theme';

interface NarratorPreviewProps {
  actions: NarratorPreviewAction[];
  loading: boolean;
  roleName: string;
}

const panelStyles: React.CSSProperties = {
  backgroundColor: theme.colors.surface,
  borderLeft: `3px solid ${theme.colors.primaryLight}`,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.md,
  marginTop: theme.spacing.lg,
};

const headerStyles: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: theme.colors.textMuted,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: theme.spacing.sm,
};

const listStyles: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.xs,
};

const instructionStyles: React.CSSProperties = {
  color: theme.colors.text,
  fontSize: '0.95rem',
  lineHeight: 1.5,
  padding: `${theme.spacing.xs} 0`,
};

const sectionHeaderStyles: React.CSSProperties = {
  ...instructionStyles,
  color: theme.colors.primaryLight,
  fontWeight: 600,
  fontStyle: 'italic',
  borderTop: `1px solid ${theme.colors.secondary}`,
  marginTop: theme.spacing.sm,
  paddingTop: theme.spacing.sm,
};

const mutedStyles: React.CSSProperties = {
  color: theme.colors.textMuted,
  fontSize: '0.9rem',
  fontStyle: 'italic',
};

export function NarratorPreview({actions, loading, roleName}: NarratorPreviewProps) {
  if (loading) {
    return (
      <div style={panelStyles} data-testid="narrator-preview">
        <div style={headerStyles}>Narrator Preview</div>
        <p style={mutedStyles}>Generating preview...</p>
      </div>
    );
  }

  if (!actions || actions.length === 0) {
    const message = roleName.trim().length >= 2
      ? 'This role does not wake up — no narrator instructions.'
      : 'Narrator preview will appear as you build your role.';

    return (
      <div style={panelStyles} data-testid="narrator-preview">
        <div style={headerStyles}>Narrator Preview</div>
        <p style={mutedStyles}>{message}</p>
      </div>
    );
  }

  return (
    <div style={panelStyles} data-testid="narrator-preview">
      <div style={headerStyles}>Narrator Preview</div>
      <ol style={listStyles}>
        {actions.map((action) => (
          <li
            key={action.order}
            style={action.is_section_header ? sectionHeaderStyles : instructionStyles}
          >
            {action.instruction}
          </li>
        ))}
      </ol>
    </div>
  );
}
