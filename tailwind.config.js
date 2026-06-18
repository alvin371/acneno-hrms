/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Canonical palette — see DESIGN.md. Field Maroon is the single
        // brand + action color; everything else is a warm-tinted neutral.
        maroon: {
          DEFAULT: '#6B1A2B',
          tint: '#F0E8EA',
          50: '#F0E8EA', // selected / maroon-adjacent surface
          100: '#E4D0D5',
          200: '#D9C2C8', // hairline on selected
          500: '#A3253B', // Maroon Live: pressed / active accent
          600: '#6B1A2B', // Field Maroon: primary fill
          700: '#561522', // deep pressed
        },
        // Warm neutrals. Cool slate/blue-gray is the deprecated system.
        surface: '#FFFFFF',
        warm: {
          DEFAULT: '#FAFAFA', // page background
          2: '#F5F5F5', // grouped background
        },
        sand: '#F2F0ED', // divider / inset
        borderwarm: '#E8E0E2', // hairline border
        textink: '#1A1A1A', // warm near-black primary text
        textsub: '#6B7280', // secondary text
        textmuted: '#9CA3AF', // tertiary / placeholder
        // Status: color reinforces an always-present label, never replaces it.
        success: { DEFAULT: '#047857', bg: '#D1FAE5' },
        warning: { DEFAULT: '#B45309', bg: '#FEF3C7' },
        danger: { DEFAULT: '#BE123C', bg: '#FFE4E6' },
        info: { DEFAULT: '#1D4ED8', bg: '#DBEAFE' },
        // DEPRECATED — legacy blue-gray text scale. Migration debt; do not
        // use in new code. Replace with textink/textsub on touch.
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
