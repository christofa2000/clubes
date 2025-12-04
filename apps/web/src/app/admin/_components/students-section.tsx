'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ApiUserListItem } from '@/types/api';

export type StudentFormValues = {
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
};

type StudentsSectionProps = {
  students: ApiUserListItem[];
  loadingList: boolean;
  submitting: boolean;
  onCreate: (payload: StudentFormValues) => Promise<void>;
  onRefresh: () => Promise<void>;
};

const blankForm: StudentFormValues = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
};

export function StudentsSection({
  students,
  loadingList,
  submitting,
  onCreate,
  onRefresh,
}: StudentsSectionProps) {
  const [formValues, setFormValues] = useState<StudentFormValues>(blankForm);
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
      const message = error instanceof Error ? error.message : 'Error al crear el alumno.';
      setFormError(message);
    }
  };

  const handleRefresh = async () => {
    setRefreshError(null);
    try {
      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron recargar los alumnos.';
      setRefreshError(message);
    }
  };

  return (
    <section className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--brand-text)]">Alumnos del club</h2>
          <p className="text-xs text-[var(--brand-muted-text)]">GET /users/students · POST /users/students</p>
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
              <th className="px-4 py-2 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--brand-border)]">
            {students.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-[var(--brand-muted-text)]" colSpan={3}>
                  No hay alumnos registrados todavía.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-2 font-medium text-[var(--brand-text)]">
                    {student.firstName} {student.lastName ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[var(--brand-muted-text)]">{student.email}</td>
                  <td className="px-4 py-2 text-[var(--brand-muted-text)]">{student.role}</td>
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
          <Label htmlFor="student-email">Email *</Label>
          <Input
            autoComplete="email"
            id="student-email"
            onChange={(event) => {
              setFormValues((prev) => ({ ...prev, email: event.target.value }));
            }}
            placeholder="alumno@club.com"
            required
            type="email"
            value={formValues.email}
          />
        </div>
        <div>
          <Label htmlFor="student-firstName">Nombre *</Label>
          <Input
            id="student-firstName"
            onChange={(event) => {
              setFormValues((prev) => ({ ...prev, firstName: event.target.value }));
            }}
            placeholder="Nombre"
            required
            value={formValues.firstName}
          />
        </div>
        <div>
          <Label htmlFor="student-lastName">Apellido</Label>
          <Input
            id="student-lastName"
            onChange={(event) => {
              setFormValues((prev) => ({ ...prev, lastName: event.target.value }));
            }}
            placeholder="Apellido"
            value={formValues.lastName ?? ''}
          />
        </div>
        <div>
          <Label htmlFor="student-phone">Teléfono</Label>
          <Input
            id="student-phone"
            onChange={(event) => {
              setFormValues((prev) => ({ ...prev, phone: event.target.value }));
            }}
            placeholder="+54..."
            value={formValues.phone ?? ''}
          />
        </div>
        {formError ? <p className="text-sm text-red-400">{formError}</p> : null}
        <Button disabled={submitting} type="submit">
          {submitting ? 'Creando alumno…' : 'Crear alumno'}
        </Button>
      </form>
    </section>
  );
}






