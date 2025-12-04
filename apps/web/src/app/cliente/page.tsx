'use client';

// Estrategia: panel cliente inspirado en app móvil, ahora consume datos reales del backend sin perder el diseño original.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlarmClock, CalendarDays, ChevronRight, CreditCard, Menu, X } from 'lucide-react';

import { BrandingMark } from '@/components/branding/branding-mark';
import { ClientSidebar } from '@/components/panels/client-sidebar';
import { Button } from '@/components/ui/button';
import { useBranding } from '@/context/branding-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import { apiFetch } from '@/lib/api';
import type { ApiClub, ApiUserProfile } from '@/types/api';

const UPCOMING = [
  { activity: 'Funcional', date: 'Hoy · 19:30 hs', location: 'Sede Caballito' },
  { activity: 'Tenis Intermedio', date: 'Mañana · 18:00 hs', location: 'Sede Núñez' },
  { activity: 'Yoga', date: 'Sábado · 10:00 hs', location: 'Sede Centro' },
];

const ANNOUNCEMENTS = [
  { title: 'Torneo interno', body: 'Sábado 20 hs · confirmá tu asistencia antes del viernes.' },
  { title: 'Nuevo profesor', body: 'Marcos Gómez se suma a las clases de funcional los martes.' },
];

export default function ClientPanelPage(): JSX.Element {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { branding, updateBranding } = useBranding();
  const { data: currentUser, loading: authLoading } = useCurrentUser();
  const [club, setClub] = useState<ApiClub | null>(null);
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
      setError('SESSION_REQUIRED');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [clubResponse, profileResponse] = await Promise.all([
        apiFetch<ApiClub>('/clubs/my'),
        apiFetch<ApiUserProfile>('/users/me'),
      ]);

      setClub(clubResponse);
      setProfile(profileResponse);

      updateBranding({
        appName: clubResponse.name,
        logoUrl: clubResponse.logoUrl ?? undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API_ERROR');
    } finally {
      setLoading(false);
    }
  }, [updateBranding]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== 'STUDENT') {
      const redirectTo =
        currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN'
          ? '/admin'
          : '/teacher';
      router.replace(redirectTo);
    }
  }, [authLoading, currentUser, router]);

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
    router.push('/login-cliente');
  }, [router]);

  const profileName = useMemo(() => {
    if (!profile) {
      return null;
    }
    const fullName = `${profile.firstName} ${profile.lastName ?? ''}`.trim();
    return fullName.length > 0 ? fullName : profile.email;
  }, [profile]);

  const quickStats = useMemo(
    () => [
      {
        label: 'Mi club',
        value: club?.name ?? '—',
        helper: club?.description ?? 'Club asignado',
      },
      {
        label: 'Usuario',
        value: profileName ?? profile?.email ?? currentUser?.email ?? '—',
        helper: profile?.email ?? currentUser?.email ?? 'Sin email',
      },
      {
        label: 'Rol',
        value: currentUser?.role ?? '—',
        helper: profile?.branchId ? `Sede ${profile.branchId.slice(0, 6)}` : 'Sin sede asignada',
      },
    ],
    [club, currentUser, profile, profileName],
  );

  if (!loading && error === 'SESSION_REQUIRED') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--brand-background)] px-4 py-10 text-center">
        <div className="space-y-4 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-8 py-10 shadow-2xl">
          <h1 className="text-2xl font-semibold text-[var(--brand-text)]">Necesitás iniciar sesión</h1>
          <p className="text-sm text-[var(--brand-muted-text)]">Guardamos la UI, pero no encontramos un token válido.</p>
          <Button onClick={handleLogout}>Ir al login</Button>
        </div>
      </main>
    );
  }

  if (error && error !== 'SESSION_REQUIRED' && !loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--brand-background)] px-4 py-10 text-center">
        <div className="space-y-5 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-8 py-10 shadow-2xl">
          <h1 className="text-2xl font-semibold text-[var(--brand-text)]">No pudimos cargar tus datos</h1>
          <p className="text-sm text-red-300">{error}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => {
                void loadData();
              }}
            >
              Reintentar
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              Cerrar sesión
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const sidebarProps = {
    userName: profileName ?? undefined,
    userEmail: profile?.email ?? currentUser?.email,
    planLabel: 'Alumno activo',
    branchLabel: profile?.branchId ?? undefined,
    onLogout: handleLogout,
  };

  const isBusy = loading || authLoading;

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
                  <ClientSidebar {...sidebarProps} />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="hidden lg:block lg:w-80">
          <ClientSidebar {...sidebarProps} />
        </div>

        <section className="flex-1 space-y-6">
          <header className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--brand-muted-text)]">
                  {isBusy ? 'Sincronizando con el club...' : `Bienvenida · ${club?.name ?? branding.appName}`}
                </p>
                <h1 className="text-2xl font-semibold text-[var(--brand-text)]">
                  Hola {profileName ?? 'alumno/a'} 👋
                </h1>
                <p className="mt-1 text-sm text-[var(--brand-muted-text)]">
                  Recordatorio: llegá 10 minutos antes para validar asistencia con el QR de {club?.name ?? branding.appName}.
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
                <Button disabled={isBusy} variant="secondary">
                  Nueva reserva
                </Button>
              </div>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {quickStats.map((stat) => (
              <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5" key={stat.label}>
                <p className="text-sm text-[var(--brand-muted-text)]">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold text-[var(--brand-accent)]">{stat.value}</p>
                <p className="text-xs text-[var(--brand-muted-text)]">{stat.helper}</p>
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
                <p className="mt-2 text-xs text-[var(--brand-muted-text)]">
                  TODO(negocio): reemplazar por datos reales de pagos cuando el endpoint esté disponible.
                </p>
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
              <h2 className="text-xl font-semibold">Línea de tiempo</h2>
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

