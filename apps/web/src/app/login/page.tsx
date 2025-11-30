'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { loginWithEmailPassword } from '@/lib/authApi';
import type { CurrentUser } from '@/lib/authApi';

/**
 * Página de login que integra Supabase Auth con el backend NestJS.
 * 
 * Flujo:
 * 1. Usuario ingresa email y password
 * 2. Se llama a loginWithEmailPassword() que:
 *    - Autentica con Supabase Auth
 *    - Obtiene el access_token
 *    - Llama a GET /auth/me en el backend con el token
 *    - Retorna el usuario del backend
 * 3. Según el rol del usuario, redirige a la página correspondiente
 */
export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { me } = await loginWithEmailPassword(email, password);

      // Redirigir según el rol del usuario
      if (me.role === 'ADMIN' || me.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (me.role === 'TEACHER') {
        router.push('/teacher');
      } else if (me.role === 'STUDENT') {
        router.push('/cliente');
      } else {
        setError('Rol de usuario no reconocido');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-primary">Portal de acceso</p>
          <h1 className="text-2xl font-semibold">Ingresá a tu club</h1>
          <p className="text-sm text-muted-foreground">
            ADMIN, PROFESOR, ALUMNO y SUPER_ADMIN utilizan el mismo login. El sistema redirigirá según tu rol.
          </p>
        </div>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isLoading}
              placeholder="tu.correo@club.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
          </div>
          <div className="space-y-2 text-left">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              disabled={isLoading}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
          </div>
          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          ¿Problemas para acceder?{' '}
          <Link className="text-primary underline-offset-4 hover:underline" href="#">
            Contactá al SUPER_ADMIN
          </Link>
        </p>
      </div>
    </main>
  );
}

