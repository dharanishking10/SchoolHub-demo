/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B2447',
          50: '#e8ecf4',
          100: '#c5cfdf',
          200: '#9eb0ca',
          300: '#7591b4',
          400: '#507ba4',
          500: '#2d6595',
          600: '#1e5080',
          700: '#163d6a',
          800: '#0e2b53',
          900: '#0B2447',
        },
        secondary: {
          DEFAULT: '#D4AF37',
          light: '#f0d060',
          dark: '#a88a1a',
        },
        gov: {
          bg: '#F5F7FA',
          border: '#E2E8F0',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
