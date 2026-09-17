/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,vue}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0D12',
          900: '#12151C',
          800: '#181C26',
          700: '#232836',
          600: '#323A4C',
          500: '#4A5468',
          400: '#6B7690',
          300: '#96A0B8',
          200: '#C4CADA',
          100: '#E7E9F0',
        },
        signal: {
          blue: '#5B7FFF',
          blueDim: '#3A4E99',
          amber: '#F2B341',
          green: '#3FBF7F',
          red: '#EF5B5B',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
