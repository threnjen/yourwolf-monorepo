export const theme = {
  colors: {
    background: '#0f0f0f',
    surface: '#1a1a1a',
    surfaceLight: '#252525',
    primary: '#8b0000',
    primaryLight: '#a52a2a',
    secondary: '#4a4a4a',
    text: '#e0e0e0',
    textMuted: '#9a9a9a',

    // Team colors
    village: '#4a7c59',
    werewolf: '#8b0000',
    vampire: '#4b0082',
    alien: '#2e8b57',
    neutral: '#696969',

    success: '#2e7d32',
    warning: '#f57c00',
    error: '#c62828',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 4px 6px rgba(0,0,0,0.4)',
    lg: '0 10px 15px rgba(0,0,0,0.5)',
  },
} as const;

export type Theme = typeof theme;
export type TeamColor = keyof typeof theme.colors;
