export const THEME = {
  colors: {
    primary: '#3b82f6', primaryHover: '#2563eb',
    success: '#22c55e', successHover: '#16a34a',
    warning: '#f59e0b', warningHover: '#d97706',
    error: '#ef4444', errorHover: '#dc2626',
    bgLight: '#f8fafc', bgDark: '#0f172a',
    surfaceLight: '#ffffff', surfaceDark: '#1e293b',
    textLight: '#0f172a', textDark: '#f1f5f9',
    textSecLight: '#64748b', textSecDark: '#94a3b8',
    borderLight: '#e2e8f0', borderDark: '#334155'
  },
  space: { xs: '4px', s: '8px', m: '12px', l: '16px', xl: '20px', xxl: '24px' },
  radius: { sm: '6px', md: '8px', lg: '12px', xl: '16px' },
  shadow: { sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px -1px rgba(0,0,0,0.1)', lg: '0 10px 15px -3px rgba(0,0,0,0.15)' }
};

export const getThemeColors = (isDark) => ({
  primary: THEME.colors.primary,
  primaryHover: THEME.colors.primaryHover,
  success: THEME.colors.success,
  warning: THEME.colors.warning,
  error: THEME.colors.error,
  bg: isDark ? THEME.colors.bgDark : THEME.colors.bgLight,
  surface: isDark ? THEME.colors.surfaceDark : THEME.colors.surfaceLight,
  text: isDark ? THEME.colors.textDark : THEME.colors.textLight,
  textSec: isDark ? THEME.colors.textSecDark : THEME.colors.textSecLight,
  border: isDark ? THEME.colors.borderDark : THEME.colors.borderLight
});