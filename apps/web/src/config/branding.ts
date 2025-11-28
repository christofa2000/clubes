// Reglas: definir todas las paletas aprobadas y exponer el contrato de branding para el resto del front.
export type ColorPaletteId = 'orange' | 'blue' | 'violet' | 'green';

export type ColorPalette = {
  id: ColorPaletteId;
  name: string;
  primary: string;
  primarySoft: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
};

export type BrandingConfig = {
  appName: string;
  logoUrl?: string;
  paletteId: ColorPaletteId;
};

export const COLOR_PALETTES: Record<ColorPaletteId, ColorPalette> = {
  orange: {
    id: 'orange',
    name: 'Naranja deportivo',
    primary: '#f97316',
    primarySoft: '#fb923c',
    accent: '#fef3c7',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    text: '#ffffff',
    border: '#27272a',
  },
  blue: {
    id: 'blue',
    name: 'Azul profesional',
    primary: '#2563eb',
    primarySoft: '#3b82f6',
    accent: '#dbeafe',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#ffffff',
    border: '#2b3b55',
  },
  violet: {
    id: 'violet',
    name: 'Violeta premium',
    primary: '#8b5cf6',
    primarySoft: '#a78bfa',
    accent: '#f5f3ff',
    background: '#1a1125',
    surface: '#2a1a3a',
    text: '#ffffff',
    border: '#3a274f',
  },
  green: {
    id: 'green',
    name: 'Verde wellness',
    primary: '#10b981',
    primarySoft: '#34d399',
    accent: '#d1fae5',
    background: '#0d1f19',
    surface: '#123228',
    text: '#ffffff',
    border: '#1b4134',
  },
};

export const BRANDING_PALETTES = Object.values(COLOR_PALETTES);

export const DEFAULT_BRANDING: BrandingConfig = {
  appName: 'Admin',
  logoUrl: '',
  paletteId: 'orange',
};

export const getPalette = (paletteId: ColorPaletteId): ColorPalette => COLOR_PALETTES[paletteId];