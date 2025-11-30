'use client';

// Estrategia: panel admin completo conectado a la API real respetando el diseño original y soportando tanto SUPER_ADMIN como ADMIN.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NotebookPen, Palette, UsersRound, WalletCards, CalendarCheck2, Building2 } from 'lucide-react';

import { AdminHeader } from '@/components/panels/admin-header';
import { AdminNav } from '@/components/panels/admin-nav';
import { ActionCard } from '@/components/panels/action-card';
import { PaletteSelector } from '@/components/panels/palette-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBranding } from '@/context/branding-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import { apiFetch } from '@/lib/api';
import { logout, getCurrentUserFromBackend } from '@/lib/authApi';
import type { ApiBranch, ApiClub, ApiUserListItem, ApiUserProfile } from '@/types/api';

const BIRTHDAYS = [
  { name: 'Lucía Gómez', detail: 'Tenis intermedio · 19:30 hs' },
  { name: 'Diego Salas', detail: 'Funcional · 20:00 hs' },
];

const splitName = (value: string): { firstName: string; lastName?: string } => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ') || undefined;
  return { firstName, lastName };
};

export default function AdminPanelPage(): JSX.Element {
  const router = useRouter();
  const { branding, updateBranding } = useBranding();
  const { data: currentUser, loading: authLoading } = useCurrentUser();

  const [notes, setNotes] = useState('Pendiente: subir planilla de pagos masivos de noviembre.');
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [club, setClub] = useState<ApiClub | null>(null);
  const [superAdminClubs, setSuperAdminClubs] = useState<ApiClub[]>([]);
  const [students, setStudents] = useState<ApiUserListItem[]>([]);
  const [teachers, setTeachers] = useState<ApiUserListItem[]>([]);
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [clubForm, setClubForm] = useState({ name: '', slug: '', description: '' });
  const [studentForm, setStudentForm] = useState({ email: '', name: '', branchId: '' });
  const [teacherForm, setTeacherForm] = useState({ email: '', name: '', branchId: '' });

  const [creatingClub, setCreatingClub] = useState(false);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [creatingTeacher, setCreatingTeacher] = useState(false);

  const [clubFormError, setClubFormError] = useState<string | null>(null);
  const [studentFormError, setStudentFormError] = useState<string | null>(null);
  const [teacherFormError, setTeacherFormError] = useState<string | null>(null);

  /**
   * Maneja el cierre de sesión.
   * Cierra la sesión en Supabase y redirige al login.
   */
  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [router]);

  const loadSuperAdminData = useCallback(async () => {
    setLoadingData(true);
    setPageError(null);
    try {
      const [profileResponse, clubsResponse] = await Promise.all([
        apiFetch<ApiUserProfile>('/users/me'),
        apiFetch<ApiClub[]>('/clubs'),
      ]);
      setProfile(profileResponse);
      setSuperAdminClubs(clubsResponse);
      setClub(null);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'API_ERROR');
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    setLoadingData(true);
    setPageError(null);
    try {
      const [profileResponse, clubResponse, studentsResponse, teachersResponse, branchesResponse] = await Promise.all([
        apiFetch<ApiUserProfile>('/users/me'),
        apiFetch<ApiClub>('/clubs/my'),
        apiFetch<ApiUserListItem[]>('/users/students'),
        apiFetch<ApiUserListItem[]>('/users/teachers'),
        apiFetch<ApiBranch[]>('/branches'),
      ]);
      setProfile(profileResponse);
      setClub(clubResponse);
      setStudents(studentsResponse);
      setTeachers(teachersResponse);
      setBranches(branchesResponse);
      updateBranding({
        appName: clubResponse.name,
        logoUrl: clubResponse.logoUrl ?? undefined,
      });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'API_ERROR');
    } finally {
      setLoadingData(false);
    }
  }, [updateBranding]);

  /**
   * Efecto que verifica la autenticación y carga los datos según el rol.
   * 
   * Flujo:
   * 1. Espera a que termine la carga inicial de autenticación
   * 2. Si no hay usuario o es 401, redirige a /login
   * 3. Si el usuario no es ADMIN o SUPER_ADMIN, redirige a /login
   * 4. Si todo está bien, carga los datos correspondientes al rol
   */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    // Si no hay usuario autenticado, redirigir a login
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Solo ADMIN y SUPER_ADMIN pueden acceder a esta página
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }

    // Cargar datos según el rol
    if (currentUser.role === 'SUPER_ADMIN') {
      void loadSuperAdminData();
    } else {
      void loadAdminData();
    }
  }, [authLoading, currentUser, loadAdminData, loadSuperAdminData, router]);

  const displayName = useMemo(() => {
    if (!profile) {
      return undefined;
    }
    const fullName = `${profile.firstName} ${profile.lastName ?? ''}`.trim();
    return fullName.length > 0 ? fullName : profile.email;
  }, [profile]);

  const adminKpis = useMemo(
    () => [
      { label: 'Alumnos activos', value: students.length.toString(), helper: 'Sincronizados con /users/students' },
      { label: 'Profesores activos', value: teachers.length.toString(), helper: 'Desde /users/teachers' },
      { label: 'Sedes activas', value: branches.length.toString(), helper: 'Datos reales /branches' },
    ],
    [branches.length, students.length, teachers.length],
  );

  const actionCards = useMemo(() => {
    const studentsCount = students.length.toLocaleString();
    const teachersCount = teachers.length.toLocaleString();
    const branchesCount = branches.length.toLocaleString();
    return [
      { icon: <UsersRound className="h-9 w-9" />, title: 'Crear alumno', description: `${studentsCount} alumnos registrados`, emphasis: 'primary' as const },
      { icon: <WalletCards className="h-9 w-9" />, title: 'Profesores', description: `${teachersCount} profesores activos` },
      { icon: <CalendarCheck2 className="h-9 w-9" />, title: 'Agenda diaria', description: 'Profesores y turnos' },
      { icon: <Building2 className="h-9 w-9" />, title: 'Sedes', description: `${branchesCount} sedes disponibles` },
      { icon: '📄', title: 'Listado de Clientes', description: 'Ver todos los alumnos.' },
      { icon: '🏟️', title: 'Reservas', description: 'Próximamente cupos reales.' },
    ];
  }, [branches.length, students.length, teachers.length]);

  const handleCreateClub = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setClubFormError(null);
    setCreatingClub(true);
    try {
      await apiFetch<ApiClub>('/clubs', {
        method: 'POST',
        body: JSON.stringify({
          name: clubForm.name,
          description: clubForm.description || undefined,
          // TODO(negocio): enviar slug cuando el backend lo soporte.
        }),
      });
      setClubForm({ name: '', slug: '', description: '' });
      await loadSuperAdminData();
    } catch (error) {
      setClubFormError(error instanceof Error ? error.message : 'Error al crear el club');
    } finally {
      setCreatingClub(false);
    }
  };

  const handleCreateStudent = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setStudentFormError(null);
    setCreatingStudent(true);
    try {
      const { firstName, lastName } = splitName(studentForm.name);
      if (!firstName) {
        throw new Error('El nombre es obligatorio');
      }
      await apiFetch('/users/students', {
        method: 'POST',
        body: JSON.stringify({
          email: studentForm.email,
          firstName,
          lastName,
          branchId: studentForm.branchId || undefined,
        }),
      });
      setStudentForm({ email: '', name: '', branchId: '' });
      await loadAdminData();
    } catch (error) {
      setStudentFormError(error instanceof Error ? error.message : 'Error al crear el alumno');
    } finally {
      setCreatingStudent(false);
    }
  };

  const handleCreateTeacher = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setTeacherFormError(null);
    setCreatingTeacher(true);
    try {
      const { firstName, lastName } = splitName(teacherForm.name);
      if (!firstName) {
        throw new Error('El nombre es obligatorio');
      }
      await apiFetch('/users/teachers', {
        method: 'POST',
        body: JSON.stringify({
          email: teacherForm.email,
          firstName,
          lastName,
          branchId: teacherForm.branchId || undefined,
        }),
      });
      setTeacherForm({ email: '', name: '', branchId: '' });
      await loadAdminData();
    } catch (error) {
      setTeacherFormError(error instanceof Error ? error.message : 'Error al crear el profesor');
    } finally {
      setCreatingTeacher(false);
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--brand-background)] px-4 py-10 text-center">
        <div className="space-y-4 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-10 py-12 shadow-2xl">
          <p className="text-sm text-[var(--brand-muted-text)]">Verificando autenticación...</p>
        </div>
      </main>
    );
  }

  if (pageError && pageError !== 'SESSION_REQUIRED' && !loadingData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--brand-background)] px-4 py-10 text-center">
        <div className="space-y-5 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-10 py-12 shadow-2xl">
          <h1 className="text-2xl font-semibold text-[var(--brand-text)]">No pudimos cargar el panel</h1>
          <p className="text-sm text-red-300">{pageError}</p>
          <Button
            onClick={() => {
              if (currentUser?.role === 'SUPER_ADMIN') {
                void loadSuperAdminData();
              } else {
                void loadAdminData();
              }
            }}
          >
            Reintentar
          </Button>
        </div>
      </main>
    );
  }

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isBusy = loadingData || authLoading;

  const renderSuperAdminView = () => (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
        <h2 className="text-2xl font-semibold text-[var(--brand-text)]">Clubs conectados</h2>
        <p className="text-sm text-[var(--brand-muted-text)]">Datos reales desde /clubs</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
            <p className="text-sm text-[var(--brand-muted-text)]">Total de clubes</p>
            <p className="text-3xl font-semibold text-[var(--brand-accent)]">{superAdminClubs.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
            <p className="text-sm text-[var(--brand-muted-text)]">Último club creado</p>
            <p className="text-lg font-semibold text-[var(--brand-text)]">
              {superAdminClubs[0]?.name ?? 'Sin registros'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6"
          onSubmit={(event) => {
            void handleCreateClub(event);
          }}
        >
          <h3 className="text-xl font-semibold text-[var(--brand-text)]">Crear nuevo club</h3>
          <div>
            <Label htmlFor="club-name">Nombre</Label>
            <Input
              id="club-name"
              onChange={(event) => {
                setClubForm((prev) => ({ ...prev, name: event.target.value }));
              }}
              placeholder="Club X"
              required
              value={clubForm.name}
            />
          </div>
          <div>
            <Label htmlFor="club-slug">Slug interno</Label>
            <Input
              id="club-slug"
              onChange={(event) => {
                setClubForm((prev) => ({ ...prev, slug: event.target.value }));
              }}
              placeholder="club-x"
              value={clubForm.slug}
            />
          </div>
          <div>
            <Label htmlFor="club-description">Descripción</Label>
            <textarea
              className="h-24 w-full rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-3 text-sm text-[var(--brand-text)]"
              id="club-description"
              onChange={(event) => {
                setClubForm((prev) => ({ ...prev, description: event.target.value }));
              }}
              value={clubForm.description}
            />
          </div>
          {clubFormError ? <p className="text-sm text-red-400">{clubFormError}</p> : null}
          <Button disabled={creatingClub || !clubForm.name} type="submit">
            {creatingClub ? 'Creando...' : 'Crear club'}
          </Button>
        </form>
        <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-primary)]/15 p-6 text-[var(--brand-accent)]">
          <p className="text-sm uppercase text-[var(--brand-accent)]/70">Tip</p>
          <h3 className="text-2xl font-semibold">Asociá un admin después del alta</h3>
          <p className="text-sm text-white/80">
            Recordá crear el usuario ADMIN correspondiente y asignarlo al club para que pueda ingresar.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {superAdminClubs.map((clubItem) => (
          <ActionCard
            description={clubItem.description ?? 'Sin descripción'}
            icon={<span className="text-2xl font-semibold">{clubItem.name.slice(0, 2).toUpperCase()}</span>}
            key={clubItem.id}
            title={clubItem.name}
          />
        ))}
        {superAdminClubs.length === 0 ? <p className="text-sm text-[var(--brand-muted-text)]">Todavía no hay clubes registrados.</p> : null}
      </section>
    </div>
  );

  const renderAdminView = () => (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        {adminKpis.map((kpi) => (
          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5" key={kpi.label}>
            <p className="text-sm text-[var(--brand-muted-text)]">{kpi.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--brand-accent)]">{kpi.value}</p>
            <p className="text-xs text-[var(--brand-muted-text)]">{kpi.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {actionCards.map((action, index) => (
          <ActionCard
            description={action.description}
            icon={action.icon}
            key={action.title}
            title={action.title}
            emphasis={index === 0 ? 'primary' : action.emphasis ?? 'default'}
          />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--brand-muted-text)]">Club</p>
              <h2 className="text-2xl font-semibold text-[var(--brand-text)]">{club?.name ?? 'Club no definido'}</h2>
            </div>
            <Button size="sm" variant="ghost">
              Ver detalle
            </Button>
          </div>
          <p className="mt-2 text-sm text-[var(--brand-muted-text)]">{club?.description ?? 'No hay descripción cargada.'}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--brand-muted-text)]">
            <span className="rounded-full bg-[var(--brand-primary)]/20 px-3 py-1 text-[var(--brand-primary)]">
              ID · {club ? club.id.slice(0, 8) : '—'}
            </span>
            <span className="rounded-full bg-[var(--brand-primary)]/20 px-3 py-1 text-[var(--brand-primary)]">Sedes · {branches.length}</span>
            <span className="rounded-full bg-[var(--brand-primary)]/20 px-3 py-1 text-[var(--brand-primary)]">Alumnos · {students.length}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--brand-accent)]">Cumpleaños del día</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              {BIRTHDAYS.map((item) => (
                <div className="rounded-2xl border border-[var(--brand-border)] px-4 py-3" key={item.name}>
                  <p className="font-semibold text-[var(--brand-accent)]">{item.name}</p>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" variant="secondary">
              Ver agenda de cumpleaños
            </Button>
          </div>
          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-primary)]/20 p-6 text-[var(--brand-accent)]">
            <p className="text-sm uppercase text-[var(--brand-accent)]/70">Siguiente acción</p>
            <h3 className="text-2xl font-semibold">Cerrar caja Caballito</h3>
            <p className="text-sm text-slate-200">21:30 hs · Caja y reportes</p>
            <Button className="mt-4 bg-[var(--brand-primary)] text-[var(--brand-background)]" variant="secondary">
              Ir a caja
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <div className="flex items-center gap-2 text-[var(--brand-accent)]">
            <NotebookPen className="h-5 w-5 text-[var(--brand-primary)]" />
            <h2 className="text-xl font-semibold">Notas rápidas</h2>
          </div>
          <textarea
            className="mt-4 h-40 w-full rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4 text-sm text-[var(--brand-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            onChange={(event) => {
              setNotes(event.target.value);
            }}
            value={notes}
          />
          <div className="mt-2 flex gap-2">
            {['Editar', 'Refrescar'].map((label) => (
              <button
                className="rounded-xl border border-[var(--brand-border)] px-3 py-1 text-xs text-[var(--brand-muted-text)]"
                key={label}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">TODO(negocio): persistir notas por usuario.</p>
        </div>
        <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-[var(--brand-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--brand-accent)]">Branding rápido</h3>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="appName">Nombre visible</Label>
                <Input
                  id="appName"
                  onChange={(event) => {
                    updateBranding({ appName: event.target.value });
                  }}
                  value={branding.appName}
                />
              </div>
              <div>
                <Label htmlFor="logo">Logo (URL)</Label>
                <Input
                  id="logo"
                  onChange={(event) => {
                    updateBranding({ logoUrl: event.target.value });
                  }}
                  placeholder="https://..."
                  value={branding.logoUrl ?? ''}
                />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[var(--brand-accent)]">Paleta de colores</p>
              <PaletteSelector />
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-background)] p-4 text-xs text-slate-500">
            Los cambios impactan inmediatamente en el header. TODO(negocio): persistir en backend cuando esté disponible.
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6"
          onSubmit={(event) => {
            void handleCreateStudent(event);
          }}
        >
          <h3 className="text-xl font-semibold">Alta de alumno</h3>
          <div>
            <Label htmlFor="student-email">Email</Label>
            <Input
              id="student-email"
              onChange={(event) => {
                setStudentForm((prev) => ({ ...prev, email: event.target.value }));
              }}
              placeholder="alumno@club.com"
              required
              type="email"
              value={studentForm.email}
            />
          </div>
          <div>
            <Label htmlFor="student-name">Nombre completo</Label>
            <Input
              id="student-name"
              onChange={(event) => {
                setStudentForm((prev) => ({ ...prev, name: event.target.value }));
              }}
              placeholder="Nombre y apellido"
              required
              value={studentForm.name}
            />
          </div>
          <div>
            <Label htmlFor="student-branch">Sede</Label>
            <select
              className="w-full rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-3 text-sm text-[var(--brand-text)]"
              id="student-branch"
              onChange={(event) => {
                setStudentForm((prev) => ({ ...prev, branchId: event.target.value }));
              }}
              value={studentForm.branchId}
            >
              <option value="">Sin sede asignada</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          {studentFormError ? <p className="text-sm text-red-400">{studentFormError}</p> : null}
          <Button disabled={creatingStudent} type="submit">
            {creatingStudent ? 'Creando...' : 'Crear alumno'}
          </Button>
        </form>

        <form
          className="space-y-4 rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6"
          onSubmit={(event) => {
            void handleCreateTeacher(event);
          }}
        >
          <h3 className="text-xl font-semibold">Alta de profesor</h3>
          <div>
            <Label htmlFor="teacher-email">Email</Label>
            <Input
              id="teacher-email"
              onChange={(event) => {
                setTeacherForm((prev) => ({ ...prev, email: event.target.value }));
              }}
              placeholder="profe@club.com"
              required
              type="email"
              value={teacherForm.email}
            />
          </div>
          <div>
            <Label htmlFor="teacher-name">Nombre completo</Label>
            <Input
              id="teacher-name"
              onChange={(event) => {
                setTeacherForm((prev) => ({ ...prev, name: event.target.value }));
              }}
              placeholder="Nombre y apellido"
              required
              value={teacherForm.name}
            />
          </div>
          <div>
            <Label htmlFor="teacher-branch">Sede</Label>
            <select
              className="w-full rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-3 text-sm text-[var(--brand-text)]"
              id="teacher-branch"
              onChange={(event) => {
                setTeacherForm((prev) => ({ ...prev, branchId: event.target.value }));
              }}
              value={teacherForm.branchId}
            >
              <option value="">Sin sede asignada</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          {teacherFormError ? <p className="text-sm text-red-400">{teacherFormError}</p> : null}
          <Button disabled={creatingTeacher} type="submit">
            {creatingTeacher ? 'Creando...' : 'Crear profesor'}
          </Button>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Alumnos</h3>
            <span className="text-sm text-[var(--brand-muted-text)]">{students.length} registros</span>
          </div>
          <ul className="mt-4 space-y-3">
            {students.slice(0, 8).map((student) => (
              <li className="rounded-2xl border border-[var(--brand-border)] px-4 py-3" key={student.id}>
                <p className="font-semibold text-[var(--brand-text)]">
                  {student.firstName} {student.lastName ?? ''}
                </p>
                <p className="text-sm text-[var(--brand-muted-text)]">{student.email}</p>
              </li>
            ))}
          </ul>
          <Button className="mt-4 w-full" variant="secondary">
            Ver todos los alumnos
          </Button>
        </div>
        <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Profesores</h3>
            <span className="text-sm text-[var(--brand-muted-text)]">{teachers.length} registros</span>
          </div>
          <ul className="mt-4 space-y-3">
            {teachers.slice(0, 8).map((teacher) => (
              <li className="rounded-2xl border border-[var(--brand-border)] px-4 py-3" key={teacher.id}>
                <p className="font-semibold text-[var(--brand-text)]">
                  {teacher.firstName} {teacher.lastName ?? ''}
                </p>
                <p className="text-sm text-[var(--brand-muted-text)]">{teacher.email}</p>
              </li>
            ))}
          </ul>
          <Button className="mt-4 w-full" variant="secondary">
            Ver todos los profesores
          </Button>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--brand-background)] px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <AdminHeader email={profile?.email} onLogout={handleLogout} userName={displayName} />
        <AdminNav />
        {isBusy ? (
          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 text-center text-sm text-[var(--brand-muted-text)]">
            Sincronizando datos reales...
          </div>
        ) : isSuperAdmin ? (
          renderSuperAdminView()
        ) : (
          renderAdminView()
        )}
      </div>
    </div>
  );
}

