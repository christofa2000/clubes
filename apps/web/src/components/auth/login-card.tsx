'use client';

// Estrategia: reutilizar un formulario estilizado para ambos logins (cliente y admin) con navegación simulada.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BrandingMark } from '@/components/branding/branding-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginCardProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  targetHref: string;
};

export function LoginCard({ title, subtitle, ctaLabel, targetHref }: LoginCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push(targetHref);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-8 shadow-2xl">
      <div className="space-y-3 text-center">
        <BrandingMark direction="column" subtitle={subtitle} />
        <h1 className="text-2xl font-semibold text-[var(--brand-text)]">{title}</h1>
        <p className="text-sm text-slate-400">
          Próximamente conectaremos la autenticación real; por ahora navegamos al panel para mostrar el flujo completo.
        </p>
      </div>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2 text-left">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="tu.email@club.com" required type="email" />
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" placeholder="••••••••" required type="password" />
        </div>
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? 'Ingresando...' : ctaLabel}
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-slate-500">
        ¿Problemas para acceder?{' '}
        <Link className="text-[var(--brand-primary)]" href="/">
          Contactá a tu club
        </Link>
      </p>
    </div>
  );
}


