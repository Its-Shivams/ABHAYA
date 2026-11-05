// src/theme/index.ts
import { MD3LightTheme, MD3Theme } from 'react-native-paper';
import { colors } from './colors';

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    background: colors.background,
    surface: colors.card,
    surfaceVariant: colors.divider,
    error: colors.danger,
    errorContainer: colors.dangerLight,
    onPrimary: colors.white,
    onSecondary: colors.text,
    onBackground: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    outlineVariant: colors.divider,
  },
  roundness: 12,
};

export { colors };
export * from './colors';
