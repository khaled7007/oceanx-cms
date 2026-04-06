/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef1fe',
          100: '#dde4fd',
          200: '#bbc9fb',
          300: '#99aef9',
          400: '#6681f7',
          500: '#2f48f5',
          600: '#2a40dd',
          700: '#2233b8',
          800: '#1b2993',
          900: '#161f6e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
