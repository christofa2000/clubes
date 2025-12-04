'use client';

/**
 * Página para invitar usuarios al sistema.
 * 
 * Solo accesible para SUPER_ADMIN.
 * Permite invitar usuarios de cualquier rol (SUPER_ADMIN, ADMIN, TEACHER, STUDENT).
 * 
 * Flujo:
 * 1. SUPER_ADMIN completa el formulario con email, rol y datos básicos
 * 2. Se llama a POST /users/invite en el backend
 * 3. El backend envía invitación vía Supabase Auth
 * 4. El usuario recibe email con magic link
 * 5. Usuario hace clic en el link → redirige a /auth/set-password
 * 6. Usuario establece su contraseña y puede hacer login
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiClientError, fetchWithAuth } from '@/lib/apiClient';
import { getCurrentUserFromBackend, logout } from '@/lib/authApi';
import type { CurrentUser } from '@/lib/authApi';
import { getSupabaseClient } from '@/lib/supabase-client';
import type { InviteUserRequest, InviteUserResponse, ApiClub } from '@/types/api';
import type { UserRole } from '@/types/api';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
};

export default function InviteUsersPage(): JSX.Element | null {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [clubs, setClubs] = useState<ApiClub[]>([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState<InviteUserRequest>({
    email: '',
    role: 'ADMIN',
    firstName: '',
    lastName: '',
    phone: '',
    clubId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const ensureToken = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new ApiClientError(error.message ?? 'Error al recuperar la sesión', error.status ?? 401, error);
    }
    const token = data.session?.access_token;
    if (!token) {
      throw new ApiClientError('SESSION_REQUIRED', 401);
    }
    return token;
  }, []);

  const loadClubs = useCallback(
    async (token: string) => {
      setClubsLoading(true);
      setPageError(null);
      try {
        const response = await fetchWithAuth<ApiClub[]>('/clubs', token);
        setClubs(response);
      } catch (error) {
        setPageError(getErrorMessage(error));
      } finally {
        setClubsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const bootstrap = async () => {
      setPageError(null);
      try {
        const user = await getCurrentUserFromBackend();
        if (user.role !== 'SUPER_ADMIN') {
          router.replace(user.role === 'ADMIN' ? '/admin' : '/login');
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
          router.replace('/login');
          return;
        }
        setPageError(getErrorMessage(error));
      }
    };

    void bootstrap();
  }, [router]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const sync = async () => {
      try {
        const token = await ensureToken();
        setAuthToken(token);
        await loadClubs(token);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
          await logout();
          router.replace('/login');
          return;
        }
        setPageError(getErrorMessage(error));
      }
    };

    void sync();
  }, [currentUser, ensureToken, loadClubs, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitError(null);
      setSubmitSuccess(false);

      if (!authToken) {
        setSubmitError('No hay token de sesión disponible.');
        return;
      }

      // Validar campos requeridos
      if (!formData.email.trim() || !formData.firstName.trim()) {
        setSubmitError('Email y nombre son obligatorios.');
        return;
      }

      // Validar clubId según el rol
      if (formData.role !== 'SUPER_ADMIN' && !formData.clubId) {
        setSubmitError('Debes seleccionar un club para este rol.');
        return;
      }

      setIsSubmitting(true);

      try {
        // Preparar payload para la API
        const payload: InviteUserRequest = {
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName?.trim() || undefined,
          phone: formData.phone?.trim() || undefined,
          clubId: formData.role !== 'SUPER_ADMIN' ? formData.clubId : undefined,
        };

        await fetchWithAuth<InviteUserResponse>('/users/invite', authToken, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        // Éxito: resetear formulario y mostrar mensaje
        setSubmitSuccess(true);
        setFormData({
          email: '',
          role: 'ADMIN',
          firstName: '',
          lastName: '',
          phone: '',
          clubId: '',
        });

        // Ocultar mensaje de éxito después de 5 segundos
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        // Mejorar mensajes de error comunes
        if (errorMessage.includes('EMAIL_ALREADY_IN_USE') || errorMessage.includes('already registered')) {
          setSubmitError('Este email ya está registrado en el sistema.');
        } else if (errorMessage.includes('CLUB_ID_REQUIRED')) {
          setSubmitError('Debes seleccionar un club para este rol.');
        } else {
          setSubmitError(errorMessage);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, authToken],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [router]);

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--brand-background)] px-4 py-10">
        <p className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-6 py-4 text-sm text-[var(--brand-muted-text)]">
          Verificando sesión SUPER_ADMIN...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--brand-background)] px-4 py-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--brand-text)]">Invitar Usuario</h1>
            <p className="text-xs text-[var(--brand-muted-text)]">
              Envía una invitación por email. El usuario recibirá un link para establecer su contraseña.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                router.push('/superadmin');
              }}
              type="button"
              variant="secondary"
            >
              Volver al panel
            </Button>
            <Button onClick={() => void handleLogout()} type="button" variant="outline">
              Cerrar sesión
            </Button>
          </div>
        </header>

        {pageError ? (
          <div className="rounded-2xl border border-red-500 bg-red-950/40 p-4 text-sm text-red-100">
            {pageError}
          </div>
        ) : null}

        <section className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, email: e.target.value }));
                  }}
                  placeholder="usuario@ejemplo.com"
                  required
                  type="email"
                  value={formData.email}
                />
                <p className="mt-1 text-xs text-[var(--brand-muted-text)]">
                  El usuario recibirá un email de invitación en esta dirección.
                </p>
              </div>

              <div>
                <Label htmlFor="role">Rol *</Label>
                <select
                  className="flex h-11 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-background)] px-3 py-2 text-sm text-[var(--brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  id="role"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      role: e.target.value as UserRole,
                      clubId: e.target.value === 'SUPER_ADMIN' ? '' : prev.clubId,
                    }));
                  }}
                  required
                  value={formData.role}
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin de Club</option>
                  <option value="TEACHER">Profesional/Profesor</option>
                  <option value="STUDENT">Estudiante</option>
                </select>
                <p className="mt-1 text-xs text-[var(--brand-muted-text)]">
                  Selecciona el rol que tendrá el usuario en el sistema.
                </p>
              </div>

              <div>
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, firstName: e.target.value }));
                  }}
                  placeholder="Juan"
                  required
                  type="text"
                  value={formData.firstName}
                />
              </div>

              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, lastName: e.target.value }));
                  }}
                  placeholder="Pérez"
                  type="text"
                  value={formData.lastName}
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, phone: e.target.value }));
                  }}
                  placeholder="+54 11 1234-5678"
                  type="tel"
                  value={formData.phone}
                />
              </div>

              {formData.role !== 'SUPER_ADMIN' && (
                <div>
                  <Label htmlFor="clubId">Club *</Label>
                  {clubsLoading ? (
                    <p className="text-sm text-[var(--brand-muted-text)]">Cargando clubes...</p>
                  ) : (
                    <select
                      className="flex h-11 w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-background)] px-3 py-2 text-sm text-[var(--brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                      id="clubId"
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, clubId: e.target.value }));
                      }}
                      required={formData.role !== 'SUPER_ADMIN'}
                      value={formData.clubId}
                    >
                      <option value="">Selecciona un club</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="mt-1 text-xs text-[var(--brand-muted-text)]">
                    El usuario pertenecerá a este club.
                  </p>
                </div>
              )}
            </div>

            {submitError ? (
              <div className="rounded-xl border border-red-500 bg-red-950/40 p-3 text-sm text-red-100">
                {submitError}
              </div>
            ) : null}

            {submitSuccess ? (
              <div className="rounded-xl border border-green-500 bg-green-950/40 p-3 text-sm text-green-100">
                ✓ Invitación enviada exitosamente. El usuario recibirá un email con instrucciones para establecer su contraseña.
              </div>
            ) : null}

            <div className="flex gap-3">
              <Button className="flex-1" disabled={isSubmitting} type="submit">
                {isSubmitting ? 'Enviando invitación...' : 'Enviar invitación'}
              </Button>
              <Button
                onClick={() => {
                  router.push('/superadmin');
                }}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}



