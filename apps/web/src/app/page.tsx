// Estrategia: componer la landing completa con todas las secciones requeridas y utilizar componentes reutilizables.
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Gift,
  Palette,
  Smartphone,
  UsersRound,
  WalletCards,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { ActionCard } from '@/components/panels/action-card';
import { Button } from '@/components/ui/button';

const FEATURE_CARDS = [
  {
    icon: <UsersRound className="h-10 w-10" />,
    title: 'Clientes y pagos',
    description: 'Controlá altas, deudas y cobranzas manuales en segundos.',
  },
  {
    icon: <CalendarCheck2 className="h-10 w-10" />,
    title: 'Turnos y agenda',
    description: 'Clases únicas y repetitivas con cupos y recordatorios.',
  },
  {
    icon: <Building2 className="h-10 w-10" />,
    title: 'Múltiples sedes',
    description: 'Gestioná horarios, contacto y ocupación de cada sede.',
  },
  {
    icon: <BellRing className="h-10 w-10" />,
    title: 'Recordatorios automáticos',
    description: 'Cumpleaños y alertas operativas para sorprender al alumno.',
  },
];

const ADMIN_ACTIONS = [
  { icon: '➕', title: 'Crear Cliente', description: 'Alta guiada con plan asignado.' },
  { icon: '🧾', title: 'Registrar Pago', description: 'Actualizá caja y deudas.' },
  { icon: '📋', title: 'Agenda Diaria', description: 'Horarios e instructores del día.' },
  { icon: '🏟️', title: 'Sede Caballito', description: 'Estado y ocupación.' },
];

const CLIENT_MENU = [
  { icon: <CalendarDays className="h-5 w-5" />, label: 'Turnos agendados' },
  { icon: <CreditCard className="h-5 w-5" />, label: 'Últimos pagos' },
  { icon: <WalletCards className="h-5 w-5" />, label: 'Planes activos' },
  { icon: <Gift className="h-5 w-5" />, label: 'Noticias y cumpleaños' },
];

const BENEFITS = [
  {
    icon: <Palette className="h-6 w-6" />,
    title: 'Marca propia',
    description: 'Nombre, logo y paleta configurables por club.',
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: 'Responsive total',
    description: 'Panel admin y cliente listos para mobile.',
  },
  {
    icon: <BellRing className="h-6 w-6" />,
    title: 'Alertas clave',
    description: 'Recordatorios de pagos, cumpleaños y operaciones.',
  },
  {
    icon: <UsersRound className="h-6 w-6" />,
    title: 'Multi-rol completo',
    description: 'Admin, profesor y alumno con accesos dedicados.',
  },
];

export default function Home(): JSX.Element {
  return (
    <div className="bg-[var(--brand-background)] text-[var(--brand-text)]">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-4 pb-20 pt-32">
        <section className="grid gap-12 lg:grid-cols-2" id="hero">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-accent)]/70">
              Plataforma white-label para clubes
            </p>
            <h1 className="text-4xl font-bold leading-snug md:text-5xl">
              Admin: tu panel de gestión multi-club y multi-sede
            </h1>
            <p className="text-lg text-slate-300">
              Panel web para administradores, experiencia moderna para clientes y branding personalizable. Preparado para clubes de tenis, gimnasios y academias que necesitan profesionalizar su operación.
            </p>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[var(--brand-primary)]" />
                Panel admin completo por club
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[var(--brand-primary)]" />
                Panel cliente estilo app móvil
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[var(--brand-primary)]" />
                Nombre, logo y paleta propia
              </li>
            </ul>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/login-admin">Entrar como Admin</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link className="flex items-center gap-2" href="/login-cliente">
                  Entrar como Cliente <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Panel Admin</p>
                  <h3 className="text-2xl font-semibold">Admin Demo</h3>
                </div>
                <span className="rounded-full bg-[var(--brand-primary-soft)]/30 px-3 py-1 text-xs font-semibold text-[var(--brand-accent)]">
                  4 sedes activas
                </span>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {ADMIN_ACTIONS.map((action) => (
                  <ActionCard description={action.description} icon={action.icon} key={action.title} title={action.title} />
                ))}
              </div>
            </div>
            <div className="absolute -bottom-8 -right-4 w-48 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-primary)] p-4 text-[var(--brand-background)] shadow-xl">
              <p className="text-xs uppercase tracking-wide">Panel Cliente</p>
              <p className="text-lg font-semibold">Turnos de hoy</p>
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <p className="font-semibold">Tenis intermedio</p>
                  <p>18:00 hs · Núñez</p>
                </div>
                <div>
                  <p className="font-semibold">Funcional</p>
                  <p>19:30 hs · Caballito</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8" id="caracteristicas">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold text-[var(--brand-primary)]">Características</p>
            <h2 className="text-3xl font-semibold">Todo lo que un club necesita</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {FEATURE_CARDS.map((card) => (
              <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-md" key={card.title}>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-primary-soft)]/20 text-[var(--brand-primary)]">
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-2" id="para-admins">
          <div className="space-y-5">
            <p className="text-sm font-semibold text-[var(--brand-primary)]">Para administradores</p>
            <h2 className="text-3xl font-semibold">Control total del club</h2>
            <ul className="space-y-3 text-slate-300">
              <li>• Configuración de marca, sedes y actividades.</li>
              <li>• Alta de profesores y alumnos con planes.</li>
              <li>• Agenda diaria y registro de pagos.</li>
              <li>• Reportes de asistencia y facturación.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-lg">
            <div className="text-sm font-semibold text-[var(--brand-accent)]">Accesos rápidos</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <ActionCard description="Alta guiada" icon="➕" title="Crear Cliente" />
              <ActionCard description="Listado completo" icon="📄" title="Clientes" />
              <ActionCard description="Control de cupos" icon="📆" title="Turnos" />
              <ActionCard description="Caja y reportes" icon="💳" title="Finanzas" />
            </div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1fr_1.1fr]" id="para-clientes">
          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-lg">
            <p className="text-sm font-semibold text-[var(--brand-primary)]">Para clientes</p>
            <h3 className="mt-2 text-2xl font-semibold">Menú lateral estilo app</h3>
            <div className="mt-6 space-y-3">
              {CLIENT_MENU.map((item) => (
                <div className="flex items-center justify-between rounded-2xl border border-[var(--brand-border)] px-4 py-3" key={item.label}>
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-[var(--brand-primary-soft)]/30 p-2 text-[var(--brand-primary)]">
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <p className="text-sm font-semibold text-[var(--brand-primary)]">Experiencia cliente</p>
            <h2 className="text-3xl font-semibold">Turnos, pagos y sedes a un click</h2>
            <ul className="space-y-3 text-slate-300">
              <li>• Ver turnos agendados y próximos.</li>
              <li>• Consultar horarios disponibles por sede.</li>
              <li>• Revisar pagos y estado del plan.</li>
              <li>• Cambiar de sede o contactar al club.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-8" id="beneficios">
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold text-[var(--brand-primary)]">Beneficios</p>
            <h2 className="text-3xl font-semibold">Un SaaS moderno para clubes</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6" key={benefit.title}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary-soft)]/20 text-[var(--brand-primary)]">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--brand-border)] bg-[var(--brand-surface)]" id="contacto">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center text-sm text-slate-400 md:flex-row">
          <p>Admin · Plataforma de gestión para clubes</p>
          <p>© {new Date().getFullYear()} · contacto@adminclub.com</p>
        </div>
      </footer>
    </div>
  );
}
