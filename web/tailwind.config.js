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
          DEFAULT: '#673AB7', // Deep Purple
          light: '#7E57C2',
          dark: '#512DA8',
        },
        secondary: {
          DEFAULT: '#E8A0BF', // Soft Pink accent
          light: '#F4C2D7',
          dark: '#D17C9F',
        },
        surface: {
          DEFAULT: '#F7F7FA', // Very Light Grey background
          card: '#FFFFFF',
        },
        brandText: {
          DEFAULT: '#292936', // Dark Grey text
          muted: '#6B7280',
        },
        zoneA: '#2E9D64', // Green (Safe)
        zoneB: '#E5A000', // Amber (Caution)
        zoneC: '#D93636', // Red (High Risk)
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
