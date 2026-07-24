/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Nocturne design system (see ARCHITECTURE.md "Design System") -- a single dark palette.
      // `light`/`dark` keys are kept equal rather than removed: it preserves every existing
      // `dark:`-prefixed className across the app unchanged (they resolve identically now)
      // instead of a mechanical rewrite of every screen for a purely cosmetic rename.
      colors: {
        background: { light: '#161826', dark: '#161826' },
        surface: {
          light: '#232532',
          dark: '#232532',
          raised: { light: '#3f424d', dark: '#3f424d' },
        },
        border: { light: 'rgba(233, 233, 237, 0.16)', dark: 'rgba(233, 233, 237, 0.16)' },
        text: {
          primary: { light: '#e9e9ed', dark: '#e9e9ed' },
          secondary: { light: 'rgba(233, 233, 237, 0.62)', dark: 'rgba(233, 233, 237, 0.62)' },
          tertiary: { light: 'rgba(233, 233, 237, 0.45)', dark: 'rgba(233, 233, 237, 0.45)' },
        },
        primary: {
          DEFAULT: '#9184d9',
          light: '#b5abfc',
          dark: '#796cbf',
        },
        success: { DEFAULT: '#2ECC71', foreground: '#161826' },
        warning: { DEFAULT: '#F5A623', foreground: '#161826' },
        danger: { DEFAULT: '#E74C3C', foreground: '#FFFFFF' },
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
