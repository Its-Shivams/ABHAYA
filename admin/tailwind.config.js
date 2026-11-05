/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#673AB7',
          50: '#F3EEFF',
          100: '#E8DDFF',
          200: '#D0BBFF',
          300: '#B899FF',
          400: '#9F77F5',
          500: '#673AB7',
          600: '#5A32A0',
          700: '#4A2882',
          800: '#3A1E65',
          900: '#2A1548',
        },
        secondary: {
          DEFAULT: '#E8A0BF',
          100: '#FDF0F6',
          200: '#F8D6E8',
          300: '#F2BCDA',
          400: '#EDB0CC',
          500: '#E8A0BF',
        },
        zoneA: '#2E9D64',
        zoneB: '#E5A000',
        zoneC: '#D93636',
      },
    },
  },
  plugins: [],
};
