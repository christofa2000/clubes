'use client';

// Estrategia: selector reutilizable de paletas para la configuración de marca.
import { BRANDING_PALETTES } from '@/config/branding';
import { useBranding } from '@/context/branding-context';

export function PaletteSelector(): JSX.Element {
  const { branding, updateBranding } = useBranding();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {BRANDING_PALETTES.map((palette) => {
        const isActive = palette.id === branding.paletteId;
        return (
            <button
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? 'border-[var(--brand-primary)] shadow-lg'
                  : 'border-[var(--brand-border)] hover:border-[var(--brand-primary)]'
              }`}
              key={palette.id}
              onClick={() => {
                updateBranding({ paletteId: palette.id });
              }}
              type="button"
            >
            <p className="text-sm font-semibold text-[var(--brand-accent)]">{palette.name}</p>
            <div className="mt-3 flex gap-2">
              {[palette.primary, palette.primarySoft, palette.accent, palette.background].map((color) => (
                <span className="h-8 w-8 rounded-full border border-black/10" key={color} style={{ backgroundColor: color }} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

