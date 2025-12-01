'use client';

/**
 * Página para establecer contraseña después de recibir invitación por email.
 * 
 * Flujo completo:
 * 1. SUPER_ADMIN invita usuario → se envía email con magic link
 * 2. Usuario hace clic en el link del email
 * 3. Supabase redirige a esta página (/auth/set-password) con access_token y refresh_token en la URL
 * 4. Esta página lee los tokens de la URL (query params o hash)
 * 5. Llama a supabase.auth.setSession({ access_token, refresh_token })
 * 6. Se muestra formulario para establecer contraseña
 * 7. Se valida que ambas contraseñas coincidan y tengan mínimo 6 caracteres
 * 8. Se llama a supabase.auth.updateUser({ password })
 * 9. Si es exitoso, se redirige a /login
 * 
 * IMPORTANTE: Esta URL debe estar configurada en Supabase Dashboard:
 * - Authentication → URL Configuration → Redirect URLs
 * - Agregar: http://localhost:3000/auth/set-password (dev)
 * - Agregar: https://tu-dominio.com/auth/set-password (prod)
 */
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { getSupabaseClient } from '@/lib/supabase-client';

type Status = 'checking-link' | 'ready' | 'updating' | 'error';

/**
 * Extrae los tokens de acceso de la URL.
 * Soporta tanto query params (?access_token=...) como hash (#access_token=...).
 * Prioriza el hash si está disponible.
 */
function extractTokensFromUrl(): { access_token: string | null; refresh_token: string | null } {
  // Primero intentar leer del hash (#access_token=...&refresh_token=...)
  if (typeof window !== 'undefined' && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    if (accessToken) {
      return { access_token: accessToken, refresh_token: refreshToken };
    }
  }

  // Si no hay en el hash, intentar leer de query params (?access_token=...&refresh_token=...)
  if (typeof window !== 'undefined' && window.location.search) {
    const queryParams = new URLSearchParams(window.location.search);
    const accessToken = queryParams.get('access_token');
    const refreshToken = queryParams.get('refresh_token');
    if (accessToken) {
      return { access_token: accessToken, refresh_token: refreshToken };
    }
  }

  return { access_token: null, refresh_token: null };
}

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<Status>('checking-link');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  // Para evitar llamar setSession 2 veces (React Strict Mode)
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const validateInvite = async () => {
      // Evitar doble ejecución en React Strict Mode
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      setStatus('checking-link');
      setError(null);

      // Extraer tokens de la URL (hash o query params)
      const { access_token, refresh_token } = extractTokensFromUrl();

      if (!access_token) {
        setError('No se encontró un token de invitación válido en el enlace. Pedí una nueva invitación para continuar.');
        setStatus('error');
        return;
      }

      try {
        const supabase = getSupabaseClient();

        // Establecer sesión usando los tokens de la URL
        // Esto es lo que Supabase espera cuando se usa inviteUserByEmail
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || undefined,
        });

        if (sessionError) {
          console.error('[SetPassword] Error al establecer sesión:', sessionError);
          setError('El enlace ya fue utilizado o es inválido. Pedí una nueva invitación para continuar.');
          setStatus('error');
          return;
        }

        // Verificar que tenemos una sesión válida
        if (!data.session) {
          console.error('[SetPassword] No se obtuvo sesión después de setSession');
          setError('No se pudo validar tu enlace de invitación. Pedí una nueva invitación para continuar.');
          setStatus('error');
          return;
        }

        console.log('[SetPassword] Sesión establecida desde invitación:', data.session.user.email);
        setStatus('ready');
      } catch (err) {
        console.error('[SetPassword] Error inesperado:', err);
        setError('Ocurrió un error al validar tu enlace de invitación. Intentá nuevamente o pedí una nueva invitación.');
        setStatus('error');
      }
    };

    void validateInvite();
  }, [searchParams]); // Dependemos de searchParams aunque también leemos del hash

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar longitud mínima
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Validar que las contraseñas coincidan
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setStatus('updating');
    setError(null);

    try {
      const supabase = getSupabaseClient();

      // Verificar que todavía tenemos una sesión válida
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Tu sesión expiró. Por favor, solicitá una nueva invitación.');
        setStatus('ready');
        return;
      }

      // Actualizar la contraseña del usuario
      // Esto solo funciona si el usuario tiene una sesión válida (del magic link)
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        console.error('[SetPassword] Error al actualizar contraseña:', updateError);
        setError(updateError.message || 'No se pudo actualizar la contraseña.');
        setStatus('ready');
        return;
      }

      // Opcional: avisar al backend para activar al user en Prisma
      // TODO: Si existe el endpoint /api/users/activate-self, descomentar esto
      // Si no existe, crear el endpoint en el backend que:
      // 1. Obtenga el usuario actual desde la sesión de Supabase
      // 2. Busque el usuario en Prisma por supabaseUserId
      // 3. Actualice active=true
      try {
        await fetch('/api/users/activate-self', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (err) {
        console.warn('[SetPassword] No se pudo llamar a /api/users/activate-self:', err);
        // No bloqueamos el flujo si falla esto
      }

      // Redirigir a login después del éxito
      router.push('/login');
    } catch (err) {
      console.error('[SetPassword] Error inesperado al guardar contraseña:', err);
      setError('Ocurrió un error al guardar la contraseña. Intentá de nuevo.');
      setStatus('ready');
    }
  };

  // Estado: Validando enlace
  if (status === 'checking-link') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-600">Validando tu enlace de invitación...</p>
      </div>
    );
  }

  // Estado: Error
  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h1 className="mb-2 text-lg font-semibold text-red-800">No se pudo validar tu enlace</h1>
          <p className="mb-4 text-sm text-red-700">
            {error ??
              'No se pudo validar tu enlace de invitación. Por favor, contactá al administrador para recibir una nueva invitación.'}
          </p>
        </div>
      </div>
    );
  }

  // Estado: Listo para establecer contraseña (status === 'ready' o 'updating')
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-neutral-900">Establecer contraseña</h1>
        <p className="mb-4 text-sm text-neutral-600">
          Crea tu contraseña. Debe tener al menos 6 caracteres.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800">
              Nueva contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              disabled={status === 'updating'}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800">
              Repetir contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              minLength={6}
              required
              disabled={status === 'updating'}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={status === 'updating' || !password || !password2}
            className="mt-2 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {status === 'updating' ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
