export const colors = {
  // Chrome Black & Dark Matter Canvas
  obsidian: {
    DEFAULT: '#0D0D0D',
    950: '#0E0E0E',
    900: '#131313',
    800: '#1C1B1B',
    700: '#201F1F',
    600: '#2A2A2A',
    500: '#353534',
  },
  // Editorial restraint layer: liquid champagne on warm obsidian. This is the
  // tone the product surfaces; the saturated gold/lilac/indigo ramps below are
  // legacy aliases retained only so older package code keeps resolving.
  champagne: {
    DEFAULT: '#CBB079',
    bright: '#E0CCA0',
    dim: '#9A825A',
    hairline: 'rgba(203, 176, 121, 0.28)',
    gold: '#F5D061',
    brass: '#DFC066',
  },
  // Obsidian canvas steps used by the editorial deck.
  charcoal: {
    DEFAULT: '#121212',
    deep: '#0D0D0D',
    black: '#0A0A0A',
  },
  // Liquid Gold & Executive Brass
  gold: {
    light: '#FFE089',
    DEFAULT: '#F5D061',
    brass: '#DFC066',
    amber: '#E8B938',
    dim: '#E7C355',
    dark: '#6F5800',
  },
  // Digital Lilac Telemetry
  lilac: {
    DEFAULT: '#D9B8FF',
    dim: '#D9B9FF',
    glow: 'rgba(217, 184, 255, 0.12)',
    container: '#573C79',
    deep: '#3E225E',
  },
  // Nordic Indigo Vectors & Radar Cones
  indigo: {
    DEFAULT: '#263BAA',
    bright: '#3C50BE',
    deep: '#001E92',
    glass: 'rgba(38, 59, 170, 0.35)',
  },
  // Slate Ocean Structural Dividers & Neutrals
  slateOcean: {
    DEFAULT: '#2F4858',
    border: 'rgba(47, 72, 88, 0.4)',
    muted: '#94A3B8',
    outline: '#99907D',
    outlineVariant: '#4D4636',
  },
  text: {
    primary: '#FFFFFF',
    onSurface: '#E5E2E1',
    muted: '#94A3B8',
    dim: '#D0C6B0',
  },
} as const;

export type Colors = typeof colors;
