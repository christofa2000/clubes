'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ApiUserListItem } from '@/types/api';

export type TeacherFormValues = {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
};

type TeachersSectionProps = {
  teachers: ApiUserListItem[];
  loadingList: boolean;
  submitting: boolean;
  onCreate: (payload: TeacherFormValues) => Promise<void>;
  onRefresh: () => Promise<void>;
};

const blankForm: TeacherFormValues = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
};

export function TeachersSection({
  teachers,
  loadingList,
  submitting,
  onCreate,
  onRefresh,
}: TeachersSectionProps) {
  const [formValues, setFormValues] = useState<TeacherFormValues>(blankForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!formValues.email || !formValues.firstName) {
      setFormError('Email y nombre son obligatorios.');
      return;
    }

    try {
      await onCreate({
        email: formValues.email.trim(),
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName?.trim() || undefined,
        phone: formValues.phone?.trim() || undefined,
      });
      setFormValues(blankForm);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear el profesor.';
      setFormError(message);
    }
  };

  const handleRefresh = async () => {
    setRefreshError(null);
    try {
      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron recargar los profesores.';
      setRefreshError(message);
    }
  };

  return (
    <section className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--brand-text)]">Profesores del club</h2>
          <p className="text-xs text-[var(--brand-muted-text)]">GET /users/teachers · POST /users/teachers</p>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={loadingList}
            onClick={() => {
              void handleRefresh();
            }}
            type="button"
            variant="secondary"
          >
            {loadingList ? 'Actualizando…' : 'Actualizar'}
          </Button>
        </div>
      </div>

      {refreshError ? <p className="mt-3 text-sm text-red-400">{refreshError}</p> : null}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--brand-border)]">
        <table className="min-w-full divide-y divide-[var(--brand-border)] text-sm">
          <thead className="bg-[var(--brand-background)] text-[var(--brand-muted-text)]">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Nombre</th>
              <th className="px-4 py-2 text-left font-medium">Email</th>
              <th className="px-4 py-2 text-left font-medium">Teléfono</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--brand-border)]">
            {teachers.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-[var(--brand-muted-text)]" colSpan={3}>
                  No hay profesores registrados todavía.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="px-4 py-2 font-medium text-[var(--brand-text)]">
                    {teacher.firstName} {teacher.lastName ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[var(--brand-muted-text)]">{teacher.email}</td>
                  <td className="px-4 py-2 text-[var(--brand-muted-text)]">{teacher.phone ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form
        className="mt-6 space-y-4 rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-background)] p-4"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div>
          <Label htmlFor="teacher-email">Email *</Label>
          <Input
            autoComplete="email"
            id="teacher-email"
            onChange={(event) => {
              setFormValues((prev) => ({ ...prev, email: event.target.value }));
            }}
            placeholder="profe@club.com"
            required
            type="email"
            value={formValues.email}
          />
        </div>
        <div>
          <Label htmlFor="teacher-firstName">Nombre *</Label>
          <Input
            id="teacher-firstName"
            onChange={(event) => {
              setFormValues((prev) => ({ ...prev, firstName: event.target.value }));
            }}
            placeholder="Nombre"
            required
            value={formValues.firstName}
          />
        </div>
        <div>
          <Label htmlFor="teacher-lastName">Apellido</Label>
          <Input
            id="teacher-lastName"
            onChange={(event) => {
              setFormValues((prev) => ({ ...prev, lastName: event.target.value }));
            }}
            placeholder="Apellido"
            value={formValues.lastName ?? ''}
          />
        </div>
        <div>
          <Label htmlFor="teacher-phone">Teléfono</Label>
          <Input
            id="teacher-phone"
            onChange={(event) => {
              setFormValues((prev) => ({ ...prev, phone: event.target.value }));
            }}
            placeholder="+54..."
            value={formValues.phone ?? ''}
          />
        </div>
        {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
        <Button disabled={submitting} type="submit">
          {submitting ? 'Creando profesor…' : 'Crear profesor'}
        </Button>
      </form>
    </section>
  );
}





