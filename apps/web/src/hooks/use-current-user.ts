'use client';

import { useCallback, useEffect, useState } from 'react';

import { getCurrentUserFromBackend } from '@/lib/authApi';
import type { CurrentUser } from '@/lib/authApi';
import type { ApiCurrentUser } from '@/types/api';

type UseCurrentUserState = {
  data: ApiCurrentUser | null;
  loading: boolean;
  error: string | null;
};

/**
 * Hook para obtener el usuario actual autenticado.
 * 
 * Usa Supabase Auth para obtener la sesión y luego llama al backend
 * para obtener los datos completos del usuario desde Prisma.
 * 
 * @returns Estado con el usuario actual, loading y error
 */
export function useCurrentUser() {
  const [state, setState] = useState<UseCurrentUserState>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchProfile = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Obtener usuario del backend usando la sesión de Supabase
      const user = await getCurrentUserFromBackend();
      
      // Convertir a ApiCurrentUser (compatibilidad con tipos existentes)
      const apiUser: ApiCurrentUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        clubId: user.clubId,
        branchId: user.branchId ?? null,
      };
      
      setState({ data: apiUser, loading: false, error: null });
    } catch (error) {
      // Si es 401, significa que no hay sesión válida (no es realmente un error)
      const isUnauthorized = error instanceof Error && 'status' in error && (error as { status?: number }).status === 401;
      
      if (isUnauthorized) {
        setState({ data: null, loading: false, error: null });
      } else {
        const message = error instanceof Error ? error.message : 'AUTH_ERROR';
        setState({ data: null, loading: false, error: message });
      }
    }
  }, []);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return {
    ...state,
    refetch: fetchProfile,
  };
}






