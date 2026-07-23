/**
 * Raw hex mirror of the color tokens in `tailwind.config.js`, for the handful of
 * RN APIs that can't take a `className` (tab bar tint/background props,
 * `ActivityIndicator`'s `color` prop). Keep in sync with `tailwind.config.js`
 * by hand — NativeWind's config is CommonJS and isn't safely importable here.
 */
export const colors = {
  background: { light: '#FFFFFF', dark: '#0B0B0F' },
  surface: { light: '#F4F4F6', dark: '#17171C' },
  border: { light: '#E5E5EA', dark: '#2A2A31' },
  textPrimary: { light: '#0B0B0F', dark: '#F4F4F6' },
  textSecondary: { light: '#6B6B76', dark: '#9C9CA8' },
  textTertiary: { light: '#A4A4AE', dark: '#6B6B76' },
  primary: { DEFAULT: '#6C5CE7', light: '#8778EE', dark: '#5445D1' },
  success: '#2ECC71',
  warning: '#F5A623',
  danger: '#E74C3C',
} as const;
