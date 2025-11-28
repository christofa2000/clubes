'use client';

import { Activity, Building2, CreditCard, Settings2, Users } from 'lucide-react';

// Estrategia: barra de secciones obligatoria del panel admin con iconografía grande.
const NAV_ITEMS = [
  { label: 'Panel de inicio', icon: Activity },
  { label: 'Clientes', icon: Users },
  { label: 'Turnos', icon: CalendarIcon },
  { label: 'Sedes', icon: Building2 },
  { label: 'Finanzas', icon: CreditCard },
  { label: 'Configuración', icon: Settings2 },
];

function CalendarIcon(): JSX.Element {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect height="16" rx="2" ry="2" width="18" x="3" y="4" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

export function AdminNav(): JSX.Element {
  return (
    <nav className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-[var(--brand-accent)]">
      {NAV_ITEMS.map((item, index) => (
        <button
          className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
            index === 0
              ? 'bg-[var(--brand-primary)] text-[var(--brand-background)] shadow-lg'
              : 'border border-[var(--brand-border)] hover:border-[var(--brand-primary)]'
          }`}
          key={item.label}
          type="button"
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

