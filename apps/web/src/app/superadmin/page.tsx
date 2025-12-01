'use client';

/**
 * Registro rápido (IA · 2025-11-30):
 * - Archivos tocados: este /superadmin/page.tsx, apps/web/src/app/admin/page.tsx
 *   y los componentes /admin/_components/*. Dejan documentado el flujo completo.
 * - Endpoints usados acá: GET /auth/me, GET /clubs, GET /users/admins, POST /users/admin.
 * - Flujo: SUPER_ADMIN valida token vía Supabase, lista clubes, ve admins por club y crea nuevos admins.
 *   ADMIN continúa en /admin creando profesores/alumnos (ver admin/page.tsx).
 */
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiClientError, fetchWithAuth } from '@/lib/apiClient';
import type { CurrentUser } from '@/lib/authApi';
import { getCurrentUserFromBackend, logout } from '@/lib/authApi';
import { getSupabaseClient } from '@/lib/supabase-client';
import type {
  ApiClub,
  ApiUserListItem,
  CreateClubRequest,
  CreateClubResponse,
  DeleteClubResponse,
  DeleteUserResponse,
} from '@/types/api';

type AdminFormValues = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
};

const blankAdminForm: AdminFormValues = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
};

export default function SuperAdminPage(): JSX.Element | null {
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [clubs, setClubs] = useState<ApiClub[]>([]);
  const [clubsLoading, setClubsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [adminsByClub, setAdminsByClub] = useState<Record<string, ApiUserListItem[]>>({});
  const [adminsLoadingClub, setAdminsLoadingClub] = useState<string | null>(null);
  const [adminsError, setAdminsError] = useState<string | null>(null);
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState<AdminFormValues>(blankAdminForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [shouldFocusForm, setShouldFocusForm] = useState(false);
  const [showCreateClubForm, setShowCreateClubForm] = useState(false);
  const [creatingClub, setCreatingClub] = useState(false);
  const [clubFormData, setClubFormData] = useState<CreateClubRequest>({
    name: '',
    description: '',
    logoUrl: '',
    primaryColor: '',
    secondaryColor: '',
  });
  const [clubFormError, setClubFormError] = useState<string | null>(null);
  const [deletingClubId, setDeletingClubId] = useState<string | null>(null);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [confirmDeleteClub, setConfirmDeleteClub] = useState<string | null>(null);
  const [confirmDeleteAdmin, setConfirmDeleteAdmin] = useState<{
    id: string;
    clubId: string;
  } | null>(null);

  const ensureToken = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      const statusCode = 'status' in error && typeof error.status === 'number' ? error.status : 401;
      const errorMessage = error.message || 'Error al recuperar la sesión';
      throw new ApiClientError(errorMessage, statusCode, error);
    }
    const token = data.session?.access_token;
    if (!token) {
      throw new ApiClientError('SESSION_REQUIRED', 401);
    }
    return token;
  }, []);

  const loadClubs = useCallback(async (token: string) => {
    setClubsLoading(true);
    setPageError(null);
    try {
      const response = await fetchWithAuth<ApiClub[]>('/clubs', token);
      setClubs(response);
    } catch (error) {
      setPageError(getErrorMessage(error));
      throw error;
    } finally {
      setClubsLoading(false);
    }
  }, []);

  const fetchAdminsForClub = useCallback(
    async (clubId: string, tokenOverride?: string) => {
      const token = tokenOverride ?? authToken;
      if (!token) {
        throw new Error('No hay token de sesión');
      }
      setAdminsLoadingClub(clubId);
      setAdminsError(null);
      try {
        const params = new URLSearchParams({ clubId });
        const response = await fetchWithAuth<ApiUserListItem[]>(
          `/users/admins?${params.toString()}`,
          token,
        );
        setAdminsByClub((prev) => ({ ...prev, [clubId]: response }));
      } catch (error) {
        setAdminsError(getErrorMessage(error));
        throw error;
      } finally {
        setAdminsLoadingClub(null);
      }
    },
    [authToken],
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

  useEffect(() => {
    setAdminForm(blankAdminForm);
    setFormError(null);
  }, [expandedClubId]);

  useEffect(() => {
    if (shouldFocusForm && emailInputRef.current) {
      emailInputRef.current.focus();
      setShouldFocusForm(false);
    }
  }, [shouldFocusForm]);

  const handleRefreshClubs = useCallback(async () => {
    if (!authToken) {
      return;
    }
    try {
      await loadClubs(authToken);
    } catch {
      // loadClubs ya setea el error necesario.
    }
  }, [authToken, loadClubs]);

  const handleViewAdmins = useCallback(
    async (clubId: string) => {
      setFormError(null);
      if (expandedClubId === clubId) {
        setExpandedClubId(null);
        setShouldFocusForm(false);
        return;
      }
      setExpandedClubId(clubId);
      setShouldFocusForm(false);
      if (!adminsByClub[clubId]) {
        try {
          await fetchAdminsForClub(clubId);
        } catch {
          // Error ya reportado en adminsError.
        }
      }
    },
    [adminsByClub, expandedClubId, fetchAdminsForClub],
  );

  const handleCreateAdminClick = useCallback(
    async (clubId: string) => {
      setFormError(null);
      if (expandedClubId !== clubId) {
        setExpandedClubId(clubId);
        if (!adminsByClub[clubId]) {
          try {
            await fetchAdminsForClub(clubId);
          } catch {
            // Error ya reportado.
          }
        }
      }
      setShouldFocusForm(true);
    },
    [adminsByClub, expandedClubId, fetchAdminsForClub],
  );

  const handleCreateAdmin = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!expandedClubId) {
        setFormError('Seleccioná un club para crear un admin.');
        return;
      }
      if (!authToken) {
        setFormError('No hay token de sesión disponible.');
        return;
      }
      if (!adminForm.email.trim() || !adminForm.firstName.trim()) {
        setFormError('Email y nombre son obligatorios.');
        return;
      }

      setCreatingAdmin(true);
      setFormError(null);

      try {
        await fetchWithAuth('/users/admin', authToken, {
          method: 'POST',
          body: JSON.stringify({
            email: adminForm.email.trim(),
            firstName: adminForm.firstName.trim(),
            lastName: adminForm.lastName.trim() || undefined,
            phone: adminForm.phone.trim() || undefined,
            clubId: expandedClubId,
          }),
        });
        setAdminForm(blankAdminForm);
        await fetchAdminsForClub(expandedClubId, authToken);
      } catch (error) {
        setFormError(getErrorMessage(error));
      } finally {
        setCreatingAdmin(false);
      }
    },
    [adminForm, authToken, expandedClubId, fetchAdminsForClub],
  );

  const handleDeleteClub = useCallback(
    async (clubId: string) => {
      if (!authToken) {
        setPageError('No hay token de sesión disponible.');
        return;
      }

      setDeletingClubId(clubId);
      setPageError(null);

      try {
        await fetchWithAuth<DeleteClubResponse>(`/clubs/${clubId}`, authToken, {
          method: 'DELETE',
        });
        // Remover el club de la lista local
        setClubs((prev) => prev.filter((club) => club.id !== clubId));
        // Si estaba expandido, cerrarlo
        if (expandedClubId === clubId) {
          setExpandedClubId(null);
        }
        // Limpiar admins de ese club
        setAdminsByClub((prev) => {
          const { [clubId]: _, ...rest } = prev;
          return rest;
        });
      } catch (error) {
        setPageError(getErrorMessage(error));
      } finally {
        setDeletingClubId(null);
        setConfirmDeleteClub(null);
      }
    },
    [authToken, expandedClubId],
  );

  const handleDeleteAdmin = useCallback(
    async (adminId: string, clubId: string) => {
      if (!authToken) {
        setAdminsError('No hay token de sesión disponible.');
        return;
      }

      setDeletingAdminId(adminId);
      setAdminsError(null);

      try {
        // Usar el nuevo endpoint DELETE /users/:id que hace delete real en Supabase + soft delete en Prisma
        await fetchWithAuth<DeleteUserResponse>(`/users/${adminId}`, authToken, {
          method: 'DELETE',
        });
        // Remover el admin de la lista local
        setAdminsByClub((prev) => ({
          ...prev,
          [clubId]: (prev[clubId] ?? []).filter((admin) => admin.id !== adminId),
        }));
      } catch (error) {
        setAdminsError(getErrorMessage(error));
      } finally {
        setDeletingAdminId(null);
        setConfirmDeleteAdmin(null);
      }
    },
    [authToken],
  );

  const handleCreateClub = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!authToken) {
        setClubFormError('No hay token de sesión disponible.');
        return;
      }

      if (!clubFormData.name.trim()) {
        setClubFormError('El nombre del club es obligatorio.');
        return;
      }

      setCreatingClub(true);
      setClubFormError(null);

      try {
        const payload: CreateClubRequest = {
          name: clubFormData.name.trim(),
          description: clubFormData.description?.trim() || undefined,
          logoUrl: clubFormData.logoUrl?.trim() || undefined,
          primaryColor: clubFormData.primaryColor?.trim() || undefined,
          secondaryColor: clubFormData.secondaryColor?.trim() || undefined,
        };

        await fetchWithAuth<CreateClubResponse>('/clubs', authToken, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        // Resetear formulario
        setClubFormData({
          name: '',
          description: '',
          logoUrl: '',
          primaryColor: '',
          secondaryColor: '',
        });
        setShowCreateClubForm(false);

        // Recargar lista de clubs
        await loadClubs(authToken);
      } catch (error) {
        setClubFormError(getErrorMessage(error));
      } finally {
        setCreatingClub(false);
      }
    },
    [authToken, clubFormData, loadClubs],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [router]);

  const greeting = useMemo(() => {
    if (!currentUser) {
      return null;
    }
    return `Hola, ${currentUser.email} · rol: ${currentUser.role}`;
  }, [currentUser]);

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
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <div>
            <p className="text-sm text-[var(--brand-muted-text)]">{greeting}</p>
            <h1 className="text-2xl font-semibold text-[var(--brand-text)]">Panel SUPER_ADMIN</h1>
            <p className="text-xs text-[var(--brand-muted-text)]">
              Gestioná clubes y admins sin ver datos internos.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                router.push('/superadmin/users');
              }}
              type="button"
            >
              Invitar usuario
            </Button>
            <Button
              disabled={clubsLoading || !authToken}
              onClick={() => {
                void handleRefreshClubs();
              }}
              type="button"
              variant="secondary"
            >
              {clubsLoading ? 'Actualizando…' : 'Refrescar clubes'}
            </Button>
            <Button
              onClick={() => {
                void handleLogout();
              }}
              type="button"
              variant="outline"
            >
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--brand-text)]">Gestión de Clubes</h2>
              <p className="text-xs text-[var(--brand-muted-text)]">
                GET /clubs (solo SUPER_ADMIN)
              </p>
            </div>
            <Button
              onClick={() => {
                setShowCreateClubForm(!showCreateClubForm);
                setClubFormError(null);
              }}
              type="button"
            >
              {showCreateClubForm ? 'Cancelar' : 'Crear nuevo club'}
            </Button>
          </div>

          {showCreateClubForm ? (
            <form
              className="mt-6 space-y-4 rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-background)] p-4"
              onSubmit={(e) => {
                void handleCreateClub(e);
              }}
            >
              <h3 className="text-sm font-semibold text-[var(--brand-text)]">
                Nuevo club (POST /clubs)
              </h3>
              <div>
                <Label htmlFor="club-name">Nombre del club *</Label>
                <Input
                  id="club-name"
                  onChange={(e) => {
                    setClubFormData((prev) => ({ ...prev, name: e.target.value }));
                  }}
                  placeholder="Club de Tenis"
                  required
                  type="text"
                  value={clubFormData.name}
                />
              </div>
              <div>
                <Label htmlFor="club-description">Descripción</Label>
                <Input
                  id="club-description"
                  onChange={(e) => {
                    setClubFormData((prev) => ({ ...prev, description: e.target.value }));
                  }}
                  placeholder="Descripción del club"
                  type="text"
                  value={clubFormData.description}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="club-logo">Logo URL</Label>
                  <Input
                    id="club-logo"
                    onChange={(e) => {
                      setClubFormData((prev) => ({ ...prev, logoUrl: e.target.value }));
                    }}
                    placeholder="https://..."
                    type="url"
                    value={clubFormData.logoUrl}
                  />
                </div>
                <div>
                  <Label htmlFor="club-primary-color">Color primario</Label>
                  <Input
                    id="club-primary-color"
                    onChange={(e) => {
                      setClubFormData((prev) => ({ ...prev, primaryColor: e.target.value }));
                    }}
                    placeholder="#FF5733"
                    type="text"
                    value={clubFormData.primaryColor}
                  />
                </div>
              </div>
              {clubFormError ? <p className="text-sm text-red-400">{clubFormError}</p> : null}
              <div className="flex gap-3">
                <Button disabled={creatingClub} type="submit">
                  {creatingClub ? 'Creando...' : 'Crear club'}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateClubForm(false);
                    setClubFormError(null);
                  }}
                  type="button"
                  variant="secondary"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
              <p className="text-xs text-[var(--brand-muted-text)]">Total de clubes</p>
              <p className="text-3xl font-semibold text-[var(--brand-accent)]">{clubs.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
              <p className="text-xs text-[var(--brand-muted-text)]">Club más reciente</p>
              <p className="text-lg font-semibold text-[var(--brand-text)]">
                {clubs[0]?.name ?? 'Sin registros'}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
              <p className="text-xs text-[var(--brand-muted-text)]">Admins cargados</p>
              <p className="text-lg font-semibold text-[var(--brand-text)]">
                {Object.values(adminsByClub).reduce((acc, list) => acc + list.length, 0)}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {clubs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 text-sm text-[var(--brand-muted-text)]">
              Todavía no hay clubes. Usá el botón &quot;Crear nuevo club&quot; arriba para crear tu
              primer club.
            </p>
          ) : (
            clubs.map((club) => {
              const isExpanded = expandedClubId === club.id;
              const admins = adminsByClub[club.id] ?? [];
              return (
                <article
                  className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6"
                  key={club.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--brand-text)]">
                        {club.name}
                      </h3>
                      <p className="text-xs text-[var(--brand-muted-text)]">
                        {club.description ?? 'Sin descripción'}
                      </p>
                      <p className="text-[10px] uppercase text-[var(--brand-muted-text)]">
                        ClubId: {club.id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          void handleViewAdmins(club.id);
                        }}
                        type="button"
                        variant="secondary"
                      >
                        {isExpanded ? 'Ocultar admins' : 'Ver admins'}
                      </Button>
                      <Button
                        onClick={() => {
                          void handleCreateAdminClick(club.id);
                        }}
                        type="button"
                      >
                        Crear admin
                      </Button>
                      <Button
                        disabled={deletingClubId === club.id}
                        onClick={() => {
                          setConfirmDeleteClub(club.id);
                        }}
                        type="button"
                        variant="destructive"
                      >
                        {deletingClubId === club.id ? 'Eliminando...' : 'Eliminar'}
                      </Button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-5 space-y-6 border-t border-dashed border-[var(--brand-border)] pt-5">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-[var(--brand-text)]">
                            Admins (GET /users/admins?clubId)
                          </h4>
                          <span className="text-xs text-[var(--brand-muted-text)]">
                            {adminsLoadingClub === club.id
                              ? 'Cargando...'
                              : `${String(admins.length)} registros`}
                          </span>
                        </div>
                        {adminsError ? (
                          <p className="mt-2 text-sm text-red-400">{adminsError}</p>
                        ) : (
                          <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--brand-border)]">
                            <table className="min-w-full divide-y divide-[var(--brand-border)] text-sm">
                              <thead className="bg-[var(--brand-background)] text-[var(--brand-muted-text)]">
                                <tr>
                                  <th className="px-4 py-2 text-left font-medium">Nombre</th>
                                  <th className="px-4 py-2 text-left font-medium">Email</th>
                                  <th className="px-4 py-2 text-left font-medium">Club</th>
                                  <th className="px-4 py-2 text-left font-medium">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--brand-border)]">
                                {admins.length === 0 ? (
                                  <tr>
                                    <td
                                      className="px-4 py-4 text-sm text-[var(--brand-muted-text)]"
                                      colSpan={4}
                                    >
                                      Este club aún no tiene admins.
                                    </td>
                                  </tr>
                                ) : (
                                  admins.map((admin) => (
                                    <tr key={admin.id}>
                                      <td className="px-4 py-2 font-medium text-[var(--brand-text)]">
                                        {admin.firstName} {admin.lastName ?? ''}
                                      </td>
                                      <td className="px-4 py-2 text-[var(--brand-muted-text)]">
                                        {admin.email}
                                      </td>
                                      <td className="px-4 py-2 text-[var(--brand-muted-text)]">
                                        {admin.clubId}
                                      </td>
                                      <td className="px-4 py-2">
                                        <Button
                                          disabled={
                                            deletingAdminId === admin.id ||
                                            currentUser.id === admin.id
                                          }
                                          onClick={() => {
                                            setConfirmDeleteAdmin({
                                              id: admin.id,
                                              clubId: club.id,
                                            });
                                          }}
                                          size="sm"
                                          type="button"
                                          variant="destructive"
                                        >
                                          {deletingAdminId === admin.id
                                            ? 'Eliminando...'
                                            : 'Eliminar'}
                                        </Button>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <form
                        className="space-y-4 rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-background)] p-4"
                        onSubmit={(event) => {
                          void handleCreateAdmin(event);
                        }}
                      >
                        <h4 className="text-sm font-semibold text-[var(--brand-text)]">
                          Nuevo admin (POST /users/admin)
                        </h4>
                        <div>
                          <Label htmlFor={`admin-email-${club.id}`}>Email *</Label>
                          <Input
                            id={`admin-email-${club.id}`}
                            onChange={(event) => {
                              setAdminForm((prev) => ({ ...prev, email: event.target.value }));
                            }}
                            placeholder="admin@club.com"
                            ref={emailInputRef}
                            required
                            type="email"
                            value={adminForm.email}
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor={`admin-firstName-${club.id}`}>Nombre *</Label>
                            <Input
                              id={`admin-firstName-${club.id}`}
                              onChange={(event) => {
                                setAdminForm((prev) => ({
                                  ...prev,
                                  firstName: event.target.value,
                                }));
                              }}
                              placeholder="Nombre"
                              required
                              value={adminForm.firstName}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`admin-lastName-${club.id}`}>Apellido</Label>
                            <Input
                              id={`admin-lastName-${club.id}`}
                              onChange={(event) => {
                                setAdminForm((prev) => ({ ...prev, lastName: event.target.value }));
                              }}
                              placeholder="Apellido"
                              value={adminForm.lastName}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`admin-phone-${club.id}`}>Teléfono</Label>
                          <Input
                            id={`admin-phone-${club.id}`}
                            onChange={(event) => {
                              setAdminForm((prev) => ({ ...prev, phone: event.target.value }));
                            }}
                            placeholder="+54..."
                            value={adminForm.phone}
                          />
                        </div>
                        {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
                        <Button disabled={creatingAdmin} type="submit">
                          {creatingAdmin ? 'Creando admin…' : 'Crear admin para este club'}
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </section>
      </div>

      {/* Modal de confirmación para eliminar club */}
      {confirmDeleteClub ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[var(--brand-text)]">
              Confirmar eliminación
            </h3>
            <p className="mt-2 text-sm text-[var(--brand-muted-text)]">
              ¿Seguro que querés eliminar este club? Esta acción desactivará el club y ya no
              aparecerá como activo.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1"
                onClick={() => {
                  setConfirmDeleteClub(null);
                }}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={deletingClubId === confirmDeleteClub}
                onClick={() => {
                  void handleDeleteClub(confirmDeleteClub);
                }}
                type="button"
                variant="destructive"
              >
                {deletingClubId === confirmDeleteClub ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal de confirmación para eliminar admin */}
      {confirmDeleteAdmin ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[var(--brand-text)]">
              Confirmar eliminación
            </h3>
            <p className="mt-2 text-sm text-[var(--brand-muted-text)]">
              ¿Seguro que querés eliminar este administrador? Esta acción desactivará el admin y ya
              no aparecerá como activo.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1"
                onClick={() => {
                  setConfirmDeleteAdmin(null);
                }}
                type="button"
                variant="secondary"
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={deletingAdminId === confirmDeleteAdmin.id}
                onClick={() => {
                  void handleDeleteAdmin(confirmDeleteAdmin.id, confirmDeleteAdmin.clubId);
                }}
                type="button"
                variant="destructive"
              >
                {deletingAdminId === confirmDeleteAdmin.id ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
