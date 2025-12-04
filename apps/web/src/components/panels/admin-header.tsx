'use client';

// Estrategia: header superior del panel admin con logo, usuario y acciones rápidas.
import { Bell, CalendarDays, Share2 } from 'lucide-react';

import { BrandingMark } from '@/components/branding/branding-mark';
import { Button } from '@/components/ui/button';

const HEADER_ICONS = [
  { icon: CalendarDays, label: 'Agenda' },
  { icon: Bell, label: 'Notificaciones', badge: '2' },
  { icon: Share2, label: 'Compartir' },
];

type AdminHeaderProps = {
  userName?: string;
  email?: string;
  onLogout: () => void;
};

export function AdminHeader({ userName, email, onLogout }: AdminHeaderProps): JSX.Element {
  return (
    <header className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <BrandingMark subtitle={userName ? `${userName} · ${email ?? ''}` : email ?? undefined} />
        <div className="flex items-center gap-3">
          {HEADER_ICONS.map(({ icon: Icon, label, badge }) => (
            <button
              aria-label={label}
              className="relative rounded-2xl bg-[var(--brand-background)]/60 p-3 text-[var(--brand-text)]"
              key={label}
              type="button"
            >
              <Icon className="h-5 w-5" />
              {badge ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--brand-background)] text-[10px]">
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
          <Button
            onClick={onLogout}
            type="button"
            variant="ghost"
          >
            Salir
          </Button>
          <Button variant="secondary">Invitar profesor</Button>
        </div>
      </div>
    </header>
  );
}

