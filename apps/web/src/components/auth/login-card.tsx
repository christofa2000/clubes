'use client';

// Estrategia: reutilizar un formulario estilizado para ambos logins (cliente y admin) con navegación simulada.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BrandingMark } from '@/components/branding/branding-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import { getSupabaseClient } from '@/lib/supabase-client';
import type { ApiCurrentUser } from '@/types/api';

type LoginCardProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
};

export function LoginCard({ title, subtitle, ctaLabel }: LoginCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { session } = response.data;

      const accessToken = session.access_token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', accessToken);
      }

      const profile = await apiFetch<ApiCurrentUser>('/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      switch (profile.role) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'TEACHER':
          router.push('/teacher');
          break;
        default:
          router.push('/cliente');
          break;
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
      }

      const message = error instanceof Error ? error.message : 'Error al ingresar, intentá nuevamente.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-8 shadow-2xl">
      <div className="space-y-3 text-center">
        <BrandingMark direction="column" subtitle={subtitle} />
        <h1 className="text-2xl font-semibold text-[var(--brand-text)]">{title}</h1>
        <p className="text-sm text-slate-400">
          Ingresá con tu usuario oficial. Validamos credenciales en Supabase y redirigimos según tu rol.
        </p>
      </div>
      <form
        className="mt-8 space-y-5"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div className="space-y-2 text-left">
          <Label htmlFor="email">Email</Label>
          <Input
            autoComplete="email"
            id="email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            placeholder="tu.email@club.com"
            required
            type="email"
            value={email}
          />
        </div>
        <div className="space-y-2 text-left">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            autoComplete="current-password"
            id="password"
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            placeholder="••••••••"
            required
            type="password"
            value={password}
          />
        </div>
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? 'Ingresando...' : ctaLabel}
        </Button>
        {errorMessage ? <p className="text-center text-sm text-red-400">{errorMessage}</p> : null}
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
