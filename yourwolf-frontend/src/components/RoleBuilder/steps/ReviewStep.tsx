import {RoleDraft, ValidationResult, Team} from '../../../types/role';
import {theme, TEAM_COLORS} from '../../../styles/theme';

interface ReviewStepProps {
  draft: RoleDraft;
  validation: ValidationResult | null;
}

const sectionStyles: React.CSSProperties = {
  marginBottom: theme.spacing.xl,
};

const sectionTitleStyles: React.CSSProperties = {
  color: theme.colors.textMuted,
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: theme.spacing.sm,
};

const roleNameStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: theme.colors.text,
  marginBottom: theme.spacing.xs,
};

const teamBadgeStyles = (team: Team): React.CSSProperties => ({
  display: 'inline-block',
  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
  borderRadius: theme.borderRadius.sm,
  backgroundColor: `${TEAM_COLORS[team]}30`,
  color: TEAM_COLORS[team],
  fontSize: '0.8rem',
  fontWeight: 600,
  textTransform: 'capitalize',
  marginBottom: theme.spacing.sm,
});

const metaRowStyles: React.CSSProperties = {
  display: 'flex',
  gap: theme.spacing.xl,
  color: theme.colors.textMuted,
  fontSize: '0.9rem',
  marginBottom: theme.spacing.md,
};

const descriptionStyles: React.CSSProperties = {
  color: theme.colors.text,
  fontSize: '0.9rem',
  lineHeight: 1.6,
};

const listItemStyles: React.CSSProperties = {
  display: 'flex',
  gap: theme.spacing.sm,
  padding: `${theme.spacing.xs} 0`,
  borderBottom: `1px solid ${theme.colors.surfaceLight}`,
  fontSize: '0.9rem',
  color: theme.colors.text,
};

const validationBoxStyles: React.CSSProperties = {
  padding: theme.spacing.md,
  borderRadius: theme.borderRadius.md,
  backgroundColor: theme.colors.surfaceLight,
};

const errorListItemStyles: React.CSSProperties = {
  color: theme.colors.error,
  fontSize: '0.9rem',
  marginBottom: theme.spacing.xs,
};

const warningListItemStyles: React.CSSProperties = {
  color: theme.colors.warning,
  fontSize: '0.9rem',
  marginBottom: theme.spacing.xs,
};

const validStatusStyles: React.CSSProperties = {
  color: theme.colors.success,
  fontWeight: 600,
  fontSize: '0.9rem',
};

const mutedStyles: React.CSSProperties = {
  color: theme.colors.textMuted,
  fontSize: '0.9rem',
};

export function ReviewStep({draft, validation}: ReviewStepProps) {
  return (
    <div>
      <div style={sectionStyles}>
        <div style={sectionTitleStyles}>Role Summary</div>
        <div style={roleNameStyles}>{draft.name || '(unnamed)'}</div>
        <div style={teamBadgeStyles(draft.team)}>{draft.team}</div>
        <div style={metaRowStyles}>
          <span>Wake Order: {draft.wake_order ?? 'N/A'}</span>
          <span>Votes: {draft.votes}</span>
        </div>
        {draft.description && (
          <div style={descriptionStyles}>{draft.description}</div>
        )}
      </div>

      <div style={sectionStyles}>
        <div style={sectionTitleStyles}>Ability Steps ({draft.ability_steps.length})</div>
        {draft.ability_steps.length === 0 ? (
          <p style={mutedStyles}>No ability steps configured</p>
        ) : (
          <div>
            {draft.ability_steps.map((step, index) => (
              <div key={step.id} style={listItemStyles}>
                <span style={{color: theme.colors.textMuted, minWidth: '20px'}}>{step.order}.</span>
                <span>{step.ability_name}</span>
                {step.modifier !== 'none' && (
                  <span style={{color: theme.colors.textMuted, fontSize: '0.8rem'}}>({step.modifier})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={sectionStyles}>
        <div style={sectionTitleStyles}>Win Conditions ({draft.win_conditions.length})</div>
        {draft.win_conditions.length === 0 ? (
          <p style={mutedStyles}>No win conditions configured</p>
        ) : (
          <div>
            {draft.win_conditions.map((wc, index) => (
              <div key={wc.id} style={listItemStyles}>
                <span>{wc.condition_type}</span>
                {wc.is_primary && (
                  <span style={{color: theme.colors.primaryLight, fontSize: '0.8rem'}}>(primary)</span>
                )}
                {wc.overrides_team && (
                  <span style={{color: theme.colors.textMuted, fontSize: '0.8rem'}}>(overrides team)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={sectionStyles}>
        <div style={sectionTitleStyles}>Validation</div>
        <div style={validationBoxStyles}>
          {validation === null ? (
            <p style={mutedStyles}>Validating...</p>
          ) : (
            <>
              {validation.errors.length === 0 && validation.warnings.length === 0 && (
                <p style={validStatusStyles}>✓ Valid — ready to create</p>
              )}
              {validation.errors.map((error, i) => (
                <p key={i} style={errorListItemStyles}>✗ {error}</p>
              ))}
              {validation.warnings.map((warning, i) => (
                <p key={i} style={warningListItemStyles}>⚠ {warning}</p>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

