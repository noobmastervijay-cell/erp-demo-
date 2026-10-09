/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        smit: {
          50: '#fdf2f2',
          100: '#fbe4e4',
          200: '#f7c9c9',
          300: '#f09e9e',
          400: '#e56868',
          500: '#d53939',
          600: '#c02323',
          700: '#9e1818',
          800: '#800000', // Crimson Red
          900: '#701111', // Deep SMIT Maroon
          950: '#4a0e17', // Dark Chocolate Maroon
          gold: '#e59835', // SMIT Logo Gold Ribbon
          'gold-dark': '#c87c1e',
          'gold-light': '#f3b259',
        }
      }
    },
  },
  plugins: [],
}
