'use client';

// Estrategia: compartir el estado del branding (nombre, logo, paleta) para todo el front y exponer variables CSS dinámicas.
import type { CSSProperties, ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import {
  COLOR_PALETTES,
  DEFAULT_BRANDING,
  type BrandingConfig,
  type ColorPalette,
} from '@/config/branding';

type BrandingContextValue = {
  branding: BrandingConfig;
  palette: ColorPalette;
  updateBranding: (payload: Partial<BrandingConfig>) => void;
};

const BrandingContext = createContext<BrandingContextValue | null>(null);

const addAlpha = (hex: string, alphaHex: string): string => {
  const normalized = hex.replace('#', '');
  if (normalized.length === 8) {
    return `#${normalized}`;
  }
  return `#${normalized}${alphaHex}`;
};

export function BrandingProvider({ children }: { children: ReactNode }): JSX.Element {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const palette = useMemo(() => COLOR_PALETTES[branding.paletteId], [branding.paletteId]);

  const updateBranding = (payload: Partial<BrandingConfig>): void => {
    setBranding((prev) => ({ ...prev, ...payload }));
  };

  const contextValue = useMemo<BrandingContextValue>(
    () => ({
      branding,
      palette,
      updateBranding,
    }),
    [branding, palette]
  );

  const cssVars = useMemo<CSSProperties & Record<string, string>>(
    () => ({
      '--branding-primary': palette.primary,
      '--branding-primary-soft': palette.primarySoft,
      '--branding-accent': palette.accent,
      '--branding-background': palette.background,
      '--branding-surface': palette.surface,
      '--branding-text': palette.text,
      '--branding-border': palette.border,
      '--branding-muted-text': palette.accent,
      '--branding-muted-strong': addAlpha(palette.text, 'b3'),
      '--branding-overlay': addAlpha(palette.background, 'e6'),
      // Compat: exponer también variables prefijadas sin “ing” para componentes existentes.
      '--brand-primary': palette.primary,
      '--brand-primary-soft': palette.primarySoft,
      '--brand-accent': palette.accent,
      '--brand-background': palette.background,
      '--brand-surface': palette.surface,
      '--brand-text': palette.text,
      '--brand-border': palette.border,
      '--brand-muted-text': palette.accent,
      '--brand-muted-strong': addAlpha(palette.text, 'b3'),
      '--brand-overlay': addAlpha(palette.background, 'e6'),
    }),
    [palette]
  );

  return (
    <BrandingContext.Provider value={contextValue}>
      <div
        className="min-h-screen bg-[var(--branding-background)] text-[var(--branding-text)]"
        style={cssVars}
      >
        {children}
      </div>
    </BrandingContext.Provider>
  );
}

export const useBranding = (): BrandingContextValue => {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    throw new Error('useBranding debe usarse dentro de BrandingProvider');
  }
  return ctx;
};

