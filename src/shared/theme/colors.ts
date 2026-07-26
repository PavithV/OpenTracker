/**
 * Raw hex/rgba mirror of the color tokens in `tailwind.config.js`, for the handful of
 * RN APIs that can't take a `className` (tab bar tint/background props,
 * `ActivityIndicator`'s `color` prop). Keep in sync with `tailwind.config.js`
 * by hand — NativeWind's config is CommonJS and isn't safely importable here.
 *
 * iOS-redesign design system (see ARCHITECTURE.md "Design System"): real light/dark palettes,
 * translated from the oklch tokens in the imported Claude Design mockup. `primary`/`danger` stay
 * single flat accents here rather than per-scheme (unlike `background`/`surface`/`text`) — every
 * raw consumer of these two (chart fills, tab bar tint, small icon colors) is a decorative accent
 * rather than body text, so one value that reads reasonably on both a near-white and a near-black
 * background is an acceptable simplification; the scheme-correct pair (`primary-light`/
 * `primary-dark`) is still exposed as `className`s for the handful of call sites where legibility
 * matters (links, focus rings, selected states) — see `tailwind.config.js`.
 */
export const colors = {
  background: { light: '#F7F7F8', dark: '#101114' },
  surface: { light: '#FFFFFF', dark: '#1C1D22' },
  surfaceRaised: { light: '#F0F0F3', dark: '#222329' },
  border: { light: 'rgba(0, 0, 0, 0.08)', dark: '#3A3B42' },
  textPrimary: { light: '#17181B', dark: '#F5F5F7' },
  textSecondary: { light: 'rgba(23, 24, 27, 0.55)', dark: 'rgba(245, 245, 247, 0.72)' },
  textTertiary: { light: 'rgba(23, 24, 27, 0.38)', dark: 'rgba(245, 245, 247, 0.55)' },
  primary: { DEFAULT: '#4F6FE0', light: '#3E5FDB', dark: '#6E8FF2' },
  success: '#2ECC71',
  warning: '#F5A623',
  danger: '#DC4B3E',
} as const;
