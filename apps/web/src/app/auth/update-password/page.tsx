'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase-client';

/**
 * Componente interno que maneja la lógica de actualización de contraseña.
 * Envuelto en Suspense para manejar useSearchParams correctamente.
 */
function UpdatePasswordForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    const initializeSession = async (): Promise<void> => {
      try {
        const supabase = getSupabaseClient();

        // Obtener parámetros de la URL
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const code = searchParams.get('code');

        let session = null;
        let user = null;

        // Si hay un código, intercambiarlo por sesión
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setError('El enlace ya fue utilizado o es inválido. Pedí una nueva invitación para continuar.');
            setIsInitializing(false);
            setIsReady(true);
            setHasValidSession(false);
            return;
          }

          if (!data.session) {
            setError('El enlace ya fue utilizado o es inválido. Pedí una nueva invitación para continuar.');
            setIsInitializing(false);
            setIsReady(true);
            setHasValidSession(false);
            return;
          }

          session = data.session;
          user = data.user;
        } else if (accessToken && refreshToken) {
          // Si hay tokens directos, establecer la sesión manualmente
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError('El enlace ya fue utilizado o es inválido. Pedí una nueva invitación para continuar.');
            setIsInitializing(false);
            setIsReady(true);
            setHasValidSession(false);
            return;
          }

          if (!data.session) {
            setError('El enlace ya fue utilizado o es inválido. Pedí una nueva invitación para continuar.');
            setIsInitializing(false);
            setIsReady(true);
            setHasValidSession(false);
            return;
          }

          session = data.session;
          user = data.user;
        } else {
          // Verificar si ya hay una sesión activa
          const { data: sessionData } = await supabase.auth.getSession();

          if (!sessionData.session) {
            setError('El enlace ya fue utilizado o es inválido. Pedí una nueva invitación para continuar.');
            setIsInitializing(false);
            setIsReady(true);
            setHasValidSession(false);
            return;
          }

          session = sessionData.session;
          user = sessionData.user;
        }

        // Verificar que realmente tenemos una sesión y usuario válidos
        if (!session || !user) {
          setError('El enlace ya fue utilizado o es inválido. Pedí una nueva invitación para continuar.');
          setIsInitializing(false);
          setIsReady(true);
          setHasValidSession(false);
          return;
        }

        // Verificar que el tipo sea recovery o invite
        if (type && type !== 'recovery' && type !== 'invite') {
          setError('Tipo de operación no válido. Solo se permiten invitaciones y recuperación de contraseña.');
          setIsInitializing(false);
          setIsReady(true);
          setHasValidSession(false);
          return;
        }

        // Todo está bien: tenemos sesión válida
        setHasValidSession(true);
        setIsInitializing(false);
        setIsReady(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al inicializar la sesión';
        setError('El enlace ya fue utilizado o es inválido. Pedí una nueva invitación para continuar.');
        setIsInitializing(false);
        setIsReady(true);
        setHasValidSession(false);
      }
    };

    void initializeSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validar longitud mínima
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();

      // Actualizar la contraseña del usuario
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      // Éxito: mostrar mensaje y redirigir
      setSuccess(true);
      setError(null);

      // Redirigir a login después de 2 segundos
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error al actualizar la contraseña. Intenta nuevamente.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras se inicializa la sesión
  if (isInitializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8 shadow-sm text-center">
          <p className="text-sm text-muted-foreground">Validando enlace de invitación...</p>
        </div>
      </main>
    );
  }

  // Mostrar mensaje de éxito
  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold">Contraseña actualizada correctamente</h1>
            <p className="text-sm text-muted-foreground">
              Serás redirigido al login en unos segundos...
            </p>
          </div>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Ir al login ahora
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-primary">Establecer contraseña</p>
          <h1 className="text-2xl font-semibold">Crea tu contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa una contraseña segura para tu cuenta. Debe tener al menos 6 caracteres.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isReady && hasValidSession && (
          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                disabled={isLoading}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                disabled={isLoading}
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <Button className="w-full" type="submit" disabled={isLoading || !password || !confirmPassword}>
              {isLoading ? 'Estableciendo contraseña...' : 'Establecer contraseña'}
            </Button>
          </form>
        )}

        {isReady && !hasValidSession && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              No se pudo validar tu enlace de invitación. Por favor, contacta al administrador para recibir una nueva invitación.
            </p>
            <Button className="w-full" variant="secondary" onClick={() => router.push('/login')}>
              Ir al login
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <Link className="text-primary underline-offset-4 hover:underline" href="/login">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

/**
 * Página para establecer o actualizar contraseña de usuarios invitados por Supabase.
 * 
 * Flujo completo:
 * 1. Usuario recibe email de invitación con link que contiene tokens en la URL
 * 2. Esta página detecta los parámetros (access_token, type, token, code, etc.)
 * 3. Si hay un código, se intercambia por sesión con exchangeCodeForSession
 * 4. Si hay tokens directos, se establece la sesión con setSession
 * 5. Se muestra formulario para establecer contraseña
 * 6. Se valida que ambas contraseñas coincidan y tengan mínimo 6 caracteres
 * 7. Se llama a supabase.auth.updateUser({ password })
 * 8. Si es exitoso, se muestra mensaje de éxito y se redirige a /login
 */
export default function UpdatePasswordPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md space-y-4 rounded-xl border bg-card p-8 shadow-sm text-center">
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        </main>
      }
    >
      <UpdatePasswordForm />
    </Suspense>
  );
}

