export const theme = {
  colors: {
    background: '#EEF2FF',
    surface: '#FFFFFF',
    primary: '#4B7BF5',
    primaryLight: '#E8EFFE',
    primaryGradient: 'linear-gradient(135deg, #4B7BF5 0%, #6B9BFF 100%)',
    textPrimary: '#1A1F36',
    textSecondary: '#8A94A6',
    textOnPrimary: '#FFFFFF',
    danger: '#FF6B8A',
    warning: '#FFB347',
    success: '#4BC8A0',
    hairline: '#E8EDF5',
  },
  radius: {
    sm: '8px',
    md: '14px',
    lg: '20px',
    xl: '24px',
    full: '9999px',
  },
  shadow: {
    card: '0 4px 20px rgba(75, 123, 245, 0.08)',
    button: '0 4px 16px rgba(75, 123, 245, 0.35)',
  },
  font: {
    family: "'Pretendard Variable', Pretendard, -apple-system, sans-serif",
  },
} as const;

export type AppTheme = typeof theme;
