export const colors = {
  bg: '#0F110E', surface: '#2F322C', rule: '#242820',
  text: '#F4F1EC', muted: '#A6A99F',
  accent: '#CBFF3C', accentHover: '#d8ff5c', onAccent: '#101208',
} as const;
export const space = { screenX: 22, cardGap: 12, segGap: 4 } as const;
export const type = {
  hero: 200, title: 34, titleXL: 58, cta: 42, metric: 36, cardTitle: 22,
  label: 13, body: 15,
} as const;
export const BORDER = 2; // px, solid colors.surface unless active
