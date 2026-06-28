/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff0f0',
          100: '#ffdddd',
          200: '#ffbbbb',
          300: '#ff8888',
          400: '#ff4444',
          500: '#ff1a1a',
          600: '#e60000',
          700: '#c30000',
          800: '#9e0000',
          900: '#820000',
          950: '#450000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
