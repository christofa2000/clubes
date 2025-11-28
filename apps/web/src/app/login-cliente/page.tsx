// Estrategia: reutilizar el formulario de LoginCard y ofrecer navegación simulada al panel cliente.
import Link from 'next/link';

import { LoginCard } from '@/components/auth/login-card';

export default function ClientLoginPage(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--brand-background)] px-4 py-24">
      <LoginCard ctaLabel="Ingresar como cliente" subtitle="Acceso Cliente / Alumno" targetHref="/cliente" title="Panel Cliente" />
      <Link className="mt-6 text-sm font-semibold text-[var(--brand-primary)]" href="/">
        ← Volver al inicio
      </Link>
    </main>
  );
}


