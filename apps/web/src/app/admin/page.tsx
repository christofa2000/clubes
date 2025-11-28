'use client';

// Estrategia: panel admin completo con nav superior, cards, notas rápidas y configuración de marca.
import { useState } from 'react';
import { NotebookPen, Palette, UsersRound, WalletCards, CalendarCheck2, Building2 } from 'lucide-react';

import { AdminHeader } from '@/components/panels/admin-header';
import { AdminNav } from '@/components/panels/admin-nav';
import { ActionCard } from '@/components/panels/action-card';
import { PaletteSelector } from '@/components/panels/palette-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBranding } from '@/context/branding-context';

const QUICK_ACTIONS = [
  { icon: <UsersRound className="h-9 w-9" />, title: 'Crear Cliente', description: 'Alta guiada con plan.' },
  { icon: '📄', title: 'Listado de Clientes', description: 'Ver todos los alumnos.' },
  { icon: <WalletCards className="h-9 w-9" />, title: 'Registrar Pago', description: 'Actualizá caja diaria.' },
  { icon: <CalendarCheck2 className="h-9 w-9" />, title: 'Agenda diaria', description: 'Profesores y turnos.' },
  { icon: <Building2 className="h-9 w-9" />, title: 'Sede Caballito', description: 'Ocupación · 85%.' },
  { icon: '🏟️', title: 'Sede Núñez', description: 'Ocupación · 72%.' },
];

const KPI_CARDS = [
  { label: 'Alumnos activos', value: '438', helper: '+12 este mes' },
  { label: 'Ingresos noviembre', value: '$4.2M', helper: '+8% vs. octubre' },
  { label: 'Reservas de hoy', value: '68', helper: '12 en lista de espera' },
];

const BIRTHDAYS = [
  { name: 'Lucía Gómez', detail: 'Tenis intermedio · 19:30 hs' },
  { name: 'Diego Salas', detail: 'Funcional · 20:00 hs' },
];

export default function AdminPanelPage(): JSX.Element {
  const { branding, updateBranding } = useBranding();
  const [notes, setNotes] = useState('Pendiente: subir planilla de pagos masivos de noviembre.');

  return (
    <div className="min-h-screen bg-[var(--brand-background)] px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <AdminHeader />
        <AdminNav />

        <section className="grid gap-4 md:grid-cols-3">
          {KPI_CARDS.map((kpi) => (
            <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5" key={kpi.label}>
              <p className="text-sm text-[var(--brand-muted-text)]">{kpi.label}</p>
              <p className="mt-2 text-3xl font-semibold text-[var(--brand-accent)]">{kpi.value}</p>
              <p className="text-xs text-[var(--brand-muted-text)]">{kpi.helper}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_ACTIONS.map((action, index) => (
            <ActionCard
              description={action.description}
              icon={action.icon}
              key={action.title}
              title={action.title}
              emphasis={index === 0 ? 'primary' : 'default'}
            />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
            <div className="flex items-center gap-2 text-[var(--brand-accent)]">
              <NotebookPen className="h-5 w-5 text-[var(--brand-primary)]" />
              <h2 className="text-xl font-semibold">Notas rápidas</h2>
            </div>
            <textarea
              className="mt-4 h-40 w-full rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4 text-sm text-[var(--brand-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              onChange={(event) => {
                setNotes(event.target.value);
              }}
              value={notes}
            />
            <div className="mt-2 flex gap-2">
              {['Editar', 'Refrescar'].map((label) => (
                <button
                  className="rounded-xl border border-[var(--brand-border)] px-3 py-1 text-xs text-[var(--brand-muted-text)]"
                  key={label}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">TODO(negocio): persistir notas por usuario.</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
              <h3 className="text-lg font-semibold text-[var(--brand-accent)]">Cumpleaños del día</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-400">
                {BIRTHDAYS.map((item) => (
                  <div className="rounded-2xl border border-[var(--brand-border)] px-4 py-3" key={item.name}>
                    <p className="font-semibold text-[var(--brand-accent)]">{item.name}</p>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
              <Button className="mt-4 w-full" variant="secondary">
                Ver agenda de cumpleaños
              </Button>
            </div>
            <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-primary)]/20 p-6 text-[var(--brand-accent)]">
              <p className="text-sm uppercase text-[var(--brand-accent)]/70">Siguiente acción</p>
              <h3 className="text-2xl font-semibold">Cerrar caja Caballito</h3>
              <p className="text-sm text-slate-200">21:30 hs · Caja y reportes</p>
              <Button className="mt-4 bg-[var(--brand-primary)] text-[var(--brand-background)]" variant="secondary">
                Ir a caja
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-primary)]">Configuración</p>
              <h2 className="text-2xl font-semibold">Marca y Apariencia</h2>
            </div>
            <Palette className="h-8 w-8 text-[var(--brand-primary)]" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="appName">Nombre visible</Label>
                <Input
                  id="appName"
                  onChange={(event) => {
                    updateBranding({ appName: event.target.value });
                  }}
                  value={branding.appName}
                />
              </div>
              <div>
                <Label htmlFor="logo">Logo (URL)</Label>
                <Input
                  id="logo"
                  onChange={(event) => {
                    updateBranding({ logoUrl: event.target.value });
                  }}
                  placeholder="https://..."
                  value={branding.logoUrl ?? ''}
                />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[var(--brand-accent)]">Paleta de colores</p>
              <PaletteSelector />
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-background)] p-4 text-xs text-slate-500">
            Los cambios impactan inmediatamente en el header y en todos los paneles. // TODO(negocio): persistir en backend cuando esté disponible.
          </div>
        </section>
      </div>
    </div>
  );
}

