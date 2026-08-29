export const colors = {
  bg: '#121014', surface: '#332E36', rule: '#241f27',
  text: '#F4F1EC', muted: '#9B959D',
  accent: '#FF5C1F', accentHover: '#ff6e38', onAccent: '#121014',
} as const;
export const space = { screenX: 22, cardGap: 12, segGap: 4 } as const;
export const type = {
  hero: 200, title: 34, titleXL: 58, cta: 42, metric: 36, cardTitle: 22,
  label: 13, body: 15,
} as const;
export const BORDER = 2; // px, solid colors.surface unless active
