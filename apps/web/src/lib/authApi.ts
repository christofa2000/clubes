/**
 * Módulo de autenticación que integra Supabase Auth con el backend NestJS.
 * 
 * Este módulo proporciona funciones para:
 * - Login con email y password usando Supabase Auth
 * - Obtener el usuario actual desde el backend usando el token de Supabase
 * 
 * Flujo:
 * 1. Usuario hace login con Supabase → obtiene access_token
 * 2. Usamos el access_token para llamar al backend → GET /auth/me
 * 3. El backend valida el token con Supabase y retorna el usuario de Prisma
 */

import type { Session, User } from '@supabase/supabase-js';

import { getSupabaseClient } from './supabase-client';
import { fetchWithAuth, ApiClientError } from './apiClient';

export type CurrentUser = {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  clubId: string | null;
  branchId?: string | null;
};

export type LoginResult = {
  me: CurrentUser;
  session: Session;
  user: User;
};

/**
 * Inicia sesión con email y password usando Supabase Auth.
 * 
 * Después de autenticarse con Supabase, obtiene el usuario del backend
 * usando el access_token de la sesión.
 * 
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 * @returns Objeto con el usuario del backend (me), la sesión de Supabase y el usuario de Supabase
 * @throws ApiClientError si el login falla o si no se puede obtener el usuario del backend
 * 
 * Ejemplo:
 * ```ts
 * try {
 *   const { me, session } = await loginWithEmailPassword('admin@club.com', 'password123');
 *   console.log('Usuario autenticado:', me.email, me.role);
 * } catch (error) {
 *   console.error('Error de login:', error.message);
 * }
 * ```
 */
export async function loginWithEmailPassword(
  email: string,
  password: string,
): Promise<LoginResult> {
  const supabase = getSupabaseClient();

  // 1. Autenticar con Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw new ApiClientError(
      authError.message || 'Error al iniciar sesión',
      authError.status || 401,
      authError,
    );
  }

  if (!authData.session || !authData.user) {
    throw new ApiClientError('No se obtuvo sesión válida de Supabase', 401);
  }

  const { session, user } = authData;

  // 2. Obtener el usuario del backend usando el access_token
  const accessToken = session.access_token;
  if (!accessToken) {
    throw new ApiClientError('No se obtuvo access_token de la sesión', 401);
  }

  try {
    const me = await fetchWithAuth<CurrentUser>('/auth/me', accessToken);
    return { me, session, user };
  } catch (error) {
    // Si falla la obtención del usuario del backend, cerrar sesión de Supabase
    await supabase.auth.signOut();
    throw error;
  }
}

/**
 * Obtiene el usuario actual desde el backend usando la sesión activa de Supabase.
 * 
 * Esta función es útil para verificar si el usuario sigue autenticado y obtener
 * sus datos actualizados del backend.
 * 
 * @returns Usuario actual del backend
 * @throws ApiClientError si no hay sesión activa o si falla la obtención del usuario
 * 
 * Ejemplo:
 * ```ts
 * try {
 *   const user = await getCurrentUserFromBackend();
 *   console.log('Usuario actual:', user.email, user.role);
 * } catch (error) {
 *   if (error.status === 401) {
 *     // Redirigir a login
 *   }
 * }
 * ```
 */
export async function getCurrentUserFromBackend(): Promise<CurrentUser> {
  const supabase = getSupabaseClient();

  // 1. Obtener la sesión actual de Supabase
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new ApiClientError(
      sessionError.message || 'Error al obtener la sesión',
      sessionError.status || 401,
      sessionError,
    );
  }

  if (!sessionData.session) {
    throw new ApiClientError('No hay sesión activa. Por favor, inicia sesión.', 401);
  }

  const accessToken = sessionData.session.access_token;
  if (!accessToken) {
    throw new ApiClientError('No se obtuvo access_token de la sesión', 401);
  }

  // 2. Obtener el usuario del backend usando el access_token
  return fetchWithAuth<CurrentUser>('/auth/me', accessToken);
}

/**
 * Cierra la sesión actual en Supabase.
 * 
 * @returns Promise que se resuelve cuando la sesión se cierra
 */
export async function logout(): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
}
