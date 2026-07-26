/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // iOS-redesign design system (see ARCHITECTURE.md "Design System") -- real light+dark
      // palettes, translated from the oklch tokens in the imported Claude Design mockup
      // (`OpenTracker Redesign.dc.html`, `renderVals()`'s `theme` object) to plain hex/rgba since
      // RN's style processor doesn't parse `oklch()`. Replaces Nocturne's single dark palette.
      colors: {
        background: { light: '#F7F7F8', dark: '#101114' },
        surface: {
          light: '#FFFFFF',
          dark: '#1C1D22',
          raised: { light: '#F0F0F3', dark: '#222329' },
        },
        border: { light: 'rgba(0, 0, 0, 0.08)', dark: '#3A3B42' },
        text: {
          primary: { light: '#17181B', dark: '#F5F5F7' },
          secondary: { light: 'rgba(23, 24, 27, 0.55)', dark: 'rgba(245, 245, 247, 0.72)' },
          tertiary: { light: 'rgba(23, 24, 27, 0.38)', dark: 'rgba(245, 245, 247, 0.55)' },
        },
        primary: {
          DEFAULT: '#4F6FE0',
          light: '#3E5FDB',
          dark: '#6E8FF2',
          soft: { light: '#E8ECFB', dark: '#242C46' },
        },
        success: { DEFAULT: '#2ECC71', foreground: '#161826' },
        warning: { DEFAULT: '#F5A623', foreground: '#161826' },
        danger: {
          DEFAULT: '#DC4B3E',
          light: '#DC4B3E',
          dark: '#E8695C',
          foreground: '#FFFFFF',
        },
      },
      // Nocturne is deliberately dense (readme: "density 0.7x... this system is dense on
      // purpose"). Its own --space-* tokens (2.8/5.6/8.4/11.2/16.8/22.4px) were tuned for
      // desktop-deck HTML padding, not RN touch spacing -- adapted here to round, still-compact
      // mobile values at roughly the same reduction from the previous scale.
      spacing: {
        xs: '4px',
        sm: '6px',
        md: '12px',
        lg: '18px',
        xl: '24px',
        '2xl': '34px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '14px',
        xl: '20px',
      },
      // Named to avoid colliding with Tailwind's built-in `fontWeight` utility classes
      // (font-medium/font-semibold/font-bold already exist there) -- Inter is loaded as
      // per-weight static files (@expo-google-fonts/inter), not a variable font, so RN can't
      // synthesize weight from `font-weight` alone. Getting a different weight on screen means
      // selecting a different `fontFamily` value, so weight has to be its own utility axis here.
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
