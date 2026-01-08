/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9e8ff',
          200: '#b4d2ff',
          300: '#86b5ff',
          400: '#5b93ff',
          500: '#336dff',
          600: '#2454db',
          700: '#1e43af',
          800: '#1c3a8f',
          900: '#1b326f',
        },
        ink: {
          700: '#1e2a3a',
          600: '#2f3a4f',
          500: '#435066',
        },
      },
    },
  },
  plugins: [],
};
