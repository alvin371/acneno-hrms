// Design tokens. Canonical visual system — see DESIGN.md at repo root.
// `colors` mirrors the Tailwind palette for native props that can't take
// className (RefreshControl tint, navigator tint colors, ActivityIndicator).
export const tokens = {
  spacing: {
    page: 16,
    card: 16,
  },
  radius: {
    card: 16,
  },
  colors: {
    maroon: '#6B1A2B', // Field Maroon: primary / action
    maroonActive: '#A3253B', // Maroon Live: pressed
    ink: '#1A1A1A', // warm near-black text
    textSub: '#6B7280', // secondary text / inactive nav
    textMuted: '#9CA3AF', // tertiary / placeholder
    warmSurface: '#FAFAFA', // page background
    borderWarm: '#E8E0E2', // hairline border
  },
} as const;
