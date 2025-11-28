'use client';

// Estrategia: sidebar reutilizable del panel cliente, cumple con los ítems obligatorios e iconografía grande.
import Link from 'next/link';
import {
  CalendarDays,
  Clock4,
  CreditCard,
  MapPin,
  Newspaper,
  Settings2,
  TicketCheck,
  LogOut,
} from 'lucide-react';

import { BrandingMark } from '@/components/branding/branding-mark';

const MENU_ITEMS = [
  { icon: CalendarDays, label: 'Agendar / Turnos agendados' },
  { icon: Clock4, label: 'Horarios' },
  { icon: CreditCard, label: 'Últimos pagos' },
  { icon: TicketCheck, label: 'Historial de turnos' },
  { icon: Newspaper, label: 'Noticias' },
  { icon: MapPin, label: 'Contacto y ubicación' },
  { icon: Settings2, label: 'Cambiar de sede' },
];

export function ClientSidebar(): JSX.Element {
  return (
    <aside className="flex h-full flex-col rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-0 shadow-2xl">
      <div className="space-y-2 rounded-t-3xl bg-[linear-gradient(135deg,var(--brand-primary),#ff8b3d)] p-6 text-[var(--brand-background)]">
        <BrandingMark subtitle="Camila Torres · camila@club.com" />
        <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
          Plan Tenis 8 clases
        </span>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-5 text-sm font-semibold text-[var(--brand-text)]">
        {MENU_ITEMS.map((item) => (
          <button
            className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 transition hover:bg-[var(--brand-primary)]/15"
            key={item.label}
            type="button"
          >
            <span className="rounded-2xl bg-[var(--brand-primary)]/20 p-2 text-2xl text-[var(--brand-primary)]">
              <item.icon className="h-7 w-7" />
            </span>
            <span className="flex-1">{item.label}</span>
            {item.label === 'Noticias' ? (
              <span className="text-xs font-semibold text-[var(--brand-accent)]">★</span>
            ) : null}
          </button>
        ))}
        <Link
          className="flex items-center gap-4 rounded-2xl px-3 py-3 text-left text-slate-400 transition hover:bg-red-500/10 hover:text-red-200"
          href="/"
        >
          <span className="rounded-2xl bg-red-500/15 p-2 text-2xl text-red-400">
            <LogOut className="h-7 w-7" />
          </span>
          Cerrar sesión
        </Link>
      </nav>
      <div className="space-y-3 rounded-b-3xl border-t border-[var(--brand-border)] bg-[var(--brand-primary)]/10 p-5 text-sm text-[var(--brand-accent)]">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--brand-accent)]/70">Sede actual</p>
          <p className="text-lg font-semibold text-white">Caballito Premium</p>
          <p>Lunes a domingo · 7 a 23 hs</p>
        </div>
        <p className="text-xs text-[var(--brand-accent)]/70">Versión 2.0.17</p>
      </div>
    </aside>
  );
}

