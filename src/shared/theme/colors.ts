/**
 * Raw hex/rgba mirror of the color tokens in `tailwind.config.js`, for the handful of
 * RN APIs that can't take a `className` (tab bar tint/background props,
 * `ActivityIndicator`'s `color` prop). Keep in sync with `tailwind.config.js`
 * by hand — NativeWind's config is CommonJS and isn't safely importable here.
 *
 * Nocturne design system (see ARCHITECTURE.md "Design System"): single dark palette --
 * `light`/`dark` keys are kept (same value both ways) so every existing `useColorScheme()` +
 * `colors.x[scheme]` call site keeps working unchanged; there is no separate light theme to
 * switch to.
 */
export const colors = {
  background: { light: '#161826', dark: '#161826' },
  surface: { light: '#232532', dark: '#232532' },
  surfaceRaised: { light: '#3f424d', dark: '#3f424d' },
  border: { light: 'rgba(233, 233, 237, 0.16)', dark: 'rgba(233, 233, 237, 0.16)' },
  textPrimary: { light: '#e9e9ed', dark: '#e9e9ed' },
  textSecondary: { light: 'rgba(233, 233, 237, 0.62)', dark: 'rgba(233, 233, 237, 0.62)' },
  textTertiary: { light: 'rgba(233, 233, 237, 0.45)', dark: 'rgba(233, 233, 237, 0.45)' },
  primary: { DEFAULT: '#9184d9', light: '#b5abfc', dark: '#796cbf' },
  success: '#2ECC71',
  warning: '#F5A623',
  danger: '#E74C3C',
} as const;
