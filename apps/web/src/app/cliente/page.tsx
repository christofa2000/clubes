'use client';

// Estrategia: panel cliente inspirado en app móvil, con sidebar, menú responsive y tarjetas informativas.
import { useState } from 'react';
import { AlarmClock, CalendarDays, ChevronRight, CreditCard, Menu, X } from 'lucide-react';

import { BrandingMark } from '@/components/branding/branding-mark';
import { ClientSidebar } from '@/components/panels/client-sidebar';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/context/branding-context';

const UPCOMING = [
  { activity: 'Funcional', date: 'Hoy · 19:30 hs', location: 'Sede Caballito' },
  { activity: 'Tenis Intermedio', date: 'Mañana · 18:00 hs', location: 'Sede Núñez' },
  { activity: 'Yoga', date: 'Sábado · 10:00 hs', location: 'Sede Centro' },
];

const QUICK_STATS = [
  { label: 'Clases esta semana', value: '5', trend: '+2 vs. semana pasada' },
  { label: 'Último pago', value: '$72.000', trend: '15 Nov · Transferencia' },
  { label: 'Sede favorita', value: 'Caballito', trend: 'Av. Rivadavia 4869' },
];

const ANNOUNCEMENTS = [
  { title: 'Torneo interno', body: 'Sábado 20 hs · confirmá tu asistencia antes del viernes.' },
  { title: 'Nuevo profesor', body: 'Marcos Gómez se suma a las clases de funcional los martes.' },
];

export default function ClientPanelPage(): JSX.Element {
  const [open, setOpen] = useState(false);
  const { branding } = useBranding();

  return (
    <div className="min-h-screen bg-[var(--brand-background)] px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="lg:hidden">
          <div className="flex items-center justify-between rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3">
            <BrandingMark />
            <Button
              onClick={() => {
                setOpen(true);
              }}
              size="sm"
              variant="secondary"
            >
              <Menu className="mr-2 h-4 w-4" /> Menú
            </Button>
          </div>
          {open ? (
            <div className="fixed inset-0 z-40 bg-black/50 px-4 py-6">
              <div className="mx-auto max-w-sm rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--brand-accent)]">Opciones</p>
                  <button
                    className="rounded-full border border-[var(--brand-border)] p-1"
                    onClick={() => {
                      setOpen(false);
                    }}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 max-h-[70vh] overflow-y-auto pr-2">
                  <ClientSidebar />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden lg:block lg:w-80">
          <ClientSidebar />
        </div>

        <section className="flex-1 space-y-6">
          <header className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--brand-muted-text)]">Bienvenida</p>
                <h1 className="text-2xl font-semibold text-[var(--brand-text)]">Hola Camila 👋</h1>
                <p className="mt-1 text-sm text-[var(--brand-muted-text)]">
                  Recordatorio: llegá 10 minutos antes para validar asistencia con el QR de {branding.appName}.
                </p>
              </div>
              <div className="space-y-2 text-right">
                <nav className="flex items-center justify-end gap-2 rounded-2xl bg-[var(--brand-primary)]/10 p-1 text-xs font-semibold">
                  {['Panel', 'Calendario', 'Pagos'].map((tab, index) => (
                    <button
                      className={`rounded-2xl px-3 py-1.5 ${
                        index === 0 ? 'bg-[var(--brand-primary)] text-[var(--brand-background)]' : 'text-[var(--brand-text)]'
                      }`}
                      key={tab}
                      type="button"
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
                <Button variant="secondary">Nueva reserva</Button>
              </div>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {QUICK_STATS.map((stat) => (
              <div
                className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
                key={stat.label}
              >
                <p className="text-sm text-[var(--brand-muted-text)]">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-[var(--brand-accent)]">{stat.value}</p>
                <p className="text-xs text-[var(--brand-muted-text)]">{stat.trend}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Próximos turnos</h2>
                <Button size="sm" variant="ghost">
                  Ver calendario
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {UPCOMING.map((item) => (
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--brand-border)] px-4 py-3" key={item.activity}>
                    <div>
                      <p className="text-lg font-semibold">{item.activity}</p>
                      <p className="text-sm text-[var(--brand-muted-text)]">
                        {item.date} · {item.location}
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--brand-primary)]/15 p-3 text-[var(--brand-primary)]">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-[var(--brand-primary)]/15 p-2">
                    <CreditCard className="h-5 w-5 text-[var(--brand-primary)]" />
                  </span>
                  <h2 className="text-xl font-semibold">Último pago</h2>
                </div>
                <p className="mt-3 text-3xl font-bold text-[var(--brand-accent)]">$72.000</p>
                <p className="text-sm text-[var(--brand-muted-text)]">Plan Tenis · 15 Nov · Transferencia</p>
                <Button className="mt-4" variant="secondary">
                  Ver comprobante
                </Button>
              </div>
              <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-primary)]/20 p-6 text-[var(--brand-accent)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Noticias del club</h2>
                  <AlarmClock className="h-5 w-5 text-[var(--brand-accent)]/70" />
                </div>
                <div className="mt-3 space-y-3">
                  {ANNOUNCEMENTS.map((item) => (
                    <div key={item.title}>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-sm text-[var(--brand-muted-strong)]">{item.body}</p>
                    </div>
                  ))}
                </div>
                <Button className="mt-4 bg-[var(--brand-primary)] text-[var(--brand-background)]" variant="secondary">
                  Confirmar asistencia
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Linea de tiempo</h2>
              <Button size="sm" variant="ghost">
                Ver historial
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {UPCOMING.map((item) => (
                <div className="flex items-center gap-4" key={`${item.activity}-timeline`}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
                    <ChevronRight className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm text-[var(--brand-muted-text)]">{item.date}</p>
                    <p className="font-semibold text-[var(--brand-text)]">{item.activity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

