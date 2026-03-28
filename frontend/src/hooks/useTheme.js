// frontend/src/hooks/useTheme.js
//
// Returns the active color palette and the theme-independent design tokens.
// Reads isDark from UserContext so theme state is co-located with auth state.
//
// Usage:
//   import { useTheme } from '../hooks/useTheme';
//   const { colors, isDark, fonts, spacing, radii, shadows } = useTheme();

import { useUser } from '../context/UserContext';
import {
  lightColors,
  darkColors,
  fonts,
  spacing,
  radii,
  shadows,
} from '../constants/theme';

export function useTheme() {
  const { isDark, toggleTheme } = useUser();

  return {
    colors:      isDark ? darkColors : lightColors,
    isDark,
    toggleTheme,
    // Non-color tokens passed through for convenience
    fonts,
    spacing,
    radii,
    shadows,
  };
}