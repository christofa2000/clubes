'use client';

/**
 * Registro rápido (IA · 2025-11-30):
 * - Archivos coordinados: este archivo, apps/web/src/app/superadmin/page.tsx
 *   y los componentes en apps/web/src/app/admin/_components/.
 * - Endpoints cubiertos aquí: GET /auth/me, GET /clubs/my, GET+POST /users/teachers,
 *   GET+POST /users/students (todas las llamadas con fetchWithAuth + token de Supabase).
 * - Flujo V1 completo: SUPER_ADMIN crea club + ADMIN en /superadmin → este panel /admin
 *   usa currentUser.clubId para crear profesores y alumnos dentro del club.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { StudentsSection, type StudentFormValues } from './_components/students-section';
import { TeachersSection, type TeacherFormValues } from './_components/teachers-section';
import { Button } from '@/components/ui/button';
import { ApiClientError, fetchWithAuth } from '@/lib/apiClient';
import { getCurrentUserFromBackend, logout } from '@/lib/authApi';
import type { CurrentUser } from '@/lib/authApi';
import { getSupabaseClient } from '@/lib/supabase-client';
import type { ApiClub, ApiUserListItem } from '@/types/api';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.message) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
};

export default function AdminPage(): JSX.Element | null {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [club, setClub] = useState<ApiClub | null>(null);
  const [clubLoading, setClubLoading] = useState(false);
  const [teachers, setTeachers] = useState<ApiUserListItem[]>([]);
  const [students, setStudents] = useState<ApiUserListItem[]>([]);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);
  const [studentSubmitting, setStudentSubmitting] = useState(false);

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

  const fetchClubInfo = useCallback(
    async (token: string) => {
      setClubLoading(true);
      try {
        const response = await fetchWithAuth<ApiClub>('/clubs/my', token);
        setClub(response);
      } catch (error) {
        throw error;
      } finally {
        setClubLoading(false);
      }
    },
    [],
  );

  const fetchTeachersList = useCallback(
    async (token: string) => {
      setTeachersLoading(true);
      try {
        const response = await fetchWithAuth<ApiUserListItem[]>('/users/teachers', token);
        setTeachers(response);
      } catch (error) {
        throw error;
      } finally {
        setTeachersLoading(false);
      }
    },
    [],
  );

  const fetchStudentsList = useCallback(
    async (token: string) => {
      setStudentsLoading(true);
      try {
        const response = await fetchWithAuth<ApiUserListItem[]>('/users/students', token);
        setStudents(response);
      } catch (error) {
        throw error;
      } finally {
        setStudentsLoading(false);
      }
    },
    [],
  );

  const loadAll = useCallback(
    async (token: string) => {
      setLoadingData(true);
      setPageError(null);
      try {
        await Promise.all([fetchClubInfo(token), fetchTeachersList(token), fetchStudentsList(token)]);
      } catch (error) {
        setPageError(getErrorMessage(error));
        throw error;
      } finally {
        setLoadingData(false);
      }
    },
    [fetchClubInfo, fetchStudentsList, fetchTeachersList],
  );

  useEffect(() => {
    const bootstrap = async () => {
      setLoadingUser(true);
      setPageError(null);
      try {
        const user = await getCurrentUserFromBackend();
        if (user.role === 'SUPER_ADMIN') {
          router.replace('/superadmin');
          return;
        }
        if (user.role !== 'ADMIN') {
          router.replace('/login');
          return;
        }
        setCurrentUser(user);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
          router.replace('/login');
          return;
        }
        setPageError(getErrorMessage(error));
      } finally {
        setLoadingUser(false);
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
        await loadAll(token);
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
  }, [currentUser, ensureToken, loadAll, router]);

  const handleRefreshAll = useCallback(async () => {
    if (!authToken) {
      return;
    }
    try {
      await loadAll(authToken);
    } catch {
      // loadAll ya setea el error correspondiente.
    }
  }, [authToken, loadAll]);

  const handleTeachersRefresh = useCallback(async () => {
    if (!authToken) {
      throw new Error('No hay token de sesión');
    }
    await fetchTeachersList(authToken);
  }, [authToken, fetchTeachersList]);

  const handleStudentsRefresh = useCallback(async () => {
    if (!authToken) {
      throw new Error('No hay token de sesión');
    }
    await fetchStudentsList(authToken);
  }, [authToken, fetchStudentsList]);

  const handleCreateTeacher = useCallback(
    async (payload: TeacherFormValues) => {
      if (!authToken) {
        throw new Error('No hay token de sesión');
      }
      setTeacherSubmitting(true);
      try {
        await fetchWithAuth('/users/teachers', authToken, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        await fetchTeachersList(authToken);
      } catch (error) {
        throw error instanceof Error ? error : new Error('No se pudo crear el profesor');
      } finally {
        setTeacherSubmitting(false);
      }
    },
    [authToken, fetchTeachersList],
  );

  const handleCreateStudent = useCallback(
    async (payload: StudentFormValues) => {
      if (!authToken) {
        throw new Error('No hay token de sesión');
      }
      setStudentSubmitting(true);
      try {
        await fetchWithAuth('/users/students', authToken, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        await fetchStudentsList(authToken);
      } catch (error) {
        throw error instanceof Error ? error : new Error('No se pudo crear el alumno');
      } finally {
        setStudentSubmitting(false);
      }
    },
    [authToken, fetchStudentsList],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/login');
  }, [router]);

  const clubDisplayName = useMemo(() => {
    if (club?.name) {
      return club.name;
    }
    if (currentUser?.clubId) {
      return currentUser.clubId;
    }
    return 'Club sin nombre';
  }, [club, currentUser]);

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--brand-background)] px-4 py-10">
        <p className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-6 py-4 text-sm text-[var(--brand-muted-text)]">
          Verificando sesión con GET /auth/me...
        </p>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[var(--brand-background)] px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <div>
            <p className="text-sm text-[var(--brand-muted-text)]">Hola, {currentUser.email}</p>
            <h1 className="text-2xl font-semibold text-[var(--brand-text)]">Panel ADMIN</h1>
            <p className="text-xs text-[var(--brand-muted-text)]">Club actual: {clubDisplayName}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={loadingData || !authToken}
              onClick={() => {
                void handleRefreshAll();
              }}
              type="button"
              variant="secondary"
            >
              {loadingData ? 'Sincronizando…' : 'Actualizar datos'}
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
            {pageError}{' '}
            <button
              className="underline decoration-dotted"
              onClick={() => {
                void handleRefreshAll();
              }}
              type="button"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        <section className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--brand-text)]">Resumen del club</h2>
              <p className="text-xs text-[var(--brand-muted-text)]">GET /clubs/my filtra por clubId = {currentUser.clubId}</p>
            </div>
            <span className="text-xs text-[var(--brand-muted-text)]">{clubLoading ? 'Actualizando...' : 'Datos al día'}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--brand-muted-text)]">
            Todas las acciones usan el token actual para respetar la segregación multi-tenant.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
              <p className="text-xs text-[var(--brand-muted-text)]">Profesores activos</p>
              <p className="text-2xl font-semibold text-[var(--brand-accent)]">{teachers.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
              <p className="text-xs text-[var(--brand-muted-text)]">Alumnos activos</p>
              <p className="text-2xl font-semibold text-[var(--brand-accent)]">{students.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
              <p className="text-xs text-[var(--brand-muted-text)]">Token listo</p>
              <p className="text-2xl font-semibold text-[var(--brand-accent)]">{authToken ? 'Sí' : 'No'}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <TeachersSection
            loadingList={teachersLoading}
            onCreate={handleCreateTeacher}
            onRefresh={() => handleTeachersRefresh()}
            submitting={teacherSubmitting}
            teachers={teachers}
          />
          <StudentsSection
            loadingList={studentsLoading}
            onCreate={handleCreateStudent}
            onRefresh={() => handleStudentsRefresh()}
            students={students}
            submitting={studentSubmitting}
          />
        </section>
      </div>
    </main>
  );
}




