/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: { light: '#FFFFFF', dark: '#0B0B0F' },
        surface: { light: '#F4F4F6', dark: '#17171C' },
        border: { light: '#E5E5EA', dark: '#2A2A31' },
        text: {
          primary: { light: '#0B0B0F', dark: '#F4F4F6' },
          secondary: { light: '#6B6B76', dark: '#9C9CA8' },
        },
        primary: {
          DEFAULT: '#6C5CE7',
          light: '#8778EE',
          dark: '#5445D1',
        },
        success: '#2ECC71',
        danger: '#E74C3C',
        warning: '#F5A623',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
};
