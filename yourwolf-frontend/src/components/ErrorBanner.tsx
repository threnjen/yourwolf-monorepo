import {theme} from '../styles/theme';

interface ErrorBannerProps {
  message: string;
  helpText?: string;
  onDismiss?: () => void;
}

const bannerStyles: React.CSSProperties = {
  backgroundColor: `${theme.colors.error}20`,
  border: `1px solid ${theme.colors.error}`,
  borderRadius: theme.borderRadius.md,
  padding: theme.spacing.lg,
  color: theme.colors.error,
  textAlign: 'center',
  marginBottom: theme.spacing.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.sm,
};

const helpTextStyles: React.CSSProperties = {
  marginTop: theme.spacing.sm,
  fontSize: '0.9rem',
};

const dismissButtonStyles: React.CSSProperties = {
  marginLeft: theme.spacing.md,
  background: 'none',
  border: 'none',
  color: theme.colors.error,
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1.1rem',
};

export function ErrorBanner({message, helpText, onDismiss}: ErrorBannerProps) {
  return (
    <div style={bannerStyles} role="alert">
      <div>
        <span>{message}</span>
        {helpText && <p style={helpTextStyles}>{helpText}</p>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={dismissButtonStyles}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}
