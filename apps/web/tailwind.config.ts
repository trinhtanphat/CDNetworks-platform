/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0a4cff',
          dark: '#0735b8',
          light: '#3a72ff',
        },
        accent: '#00c8b8',
      },
    },
  },
  plugins: [],
};
