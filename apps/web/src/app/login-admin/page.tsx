// Estrategia: mismo formulario white-label orientado a administradores.
import Link from 'next/link';

import { LoginCard } from '@/components/auth/login-card';

export default function AdminLoginPage(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--brand-background)] px-4 py-24">
      <LoginCard ctaLabel="Ingresar como admin" subtitle="Acceso Administrador" targetHref="/admin" title="Panel Admin" />
      <Link className="mt-6 text-sm font-semibold text-[var(--brand-primary)]" href="/">
        ← Volver al inicio
      </Link>
    </main>
  );
}


