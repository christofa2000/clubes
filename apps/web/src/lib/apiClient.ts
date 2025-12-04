/**
 * Cliente de API para hacer requests autenticados al backend NestJS.
 * 
 * Este módulo proporciona funciones para comunicarse con el backend usando
 * tokens de autenticación de Supabase.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiClientError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Asegura que el path tenga una barra inicial.
 */
const ensureLeadingSlash = (path: string): string => (path.startsWith('/') ? path : `/${path}`);

/**
 * Realiza un fetch autenticado al backend con un token Bearer.
 * 
 * @param path - Ruta del endpoint (ej: '/auth/me')
 * @param token - Token de acceso de Supabase (access_token de la sesión)
 * @param init - Opciones adicionales de fetch (method, body, headers, etc.)
 * @returns Promise con la respuesta parseada como JSON
 * @throws ApiClientError si la respuesta no es exitosa
 * 
 * Ejemplo:
 * ```ts
 * const session = await supabase.auth.getSession();
 * const user = await fetchWithAuth('/auth/me', session.data.session?.access_token);
 * ```
 */
export async function fetchWithAuth<TResponse = unknown>(
  path: string,
  token: string | null | undefined,
  init: RequestInit = {},
): Promise<TResponse> {
  if (!token) {
    throw new ApiClientError('TOKEN_REQUIRED: Se necesita un token de acceso para esta petición', 401);
  }

  const headers = new Headers(init.headers ?? {});
  
  // Configurar Content-Type si no está definido y el body no es FormData
  const isFormDataBody = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (!headers.has('Content-Type') && !isFormDataBody) {
    headers.set('Content-Type', 'application/json');
  }

  // Configurar Accept header
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Agregar token Bearer
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${ensureLeadingSlash(path)}`, {
    ...init,
    cache: init.cache ?? 'no-store',
    headers,
  });

  // Intentar parsear JSON de forma segura
  const parseJsonSafe = async (): Promise<unknown> => {
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return null;
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      return null;
    }
  };

  // Si la respuesta no es exitosa, lanzar error
  if (!response.ok) {
    const payload = (await parseJsonSafe()) as { message?: string; error?: string } | null;
    const message = payload?.message ?? payload?.error ?? `HTTP ${response.status}: ${response.statusText}`;
    const error = new ApiClientError(message, response.status, payload);
    throw error;
  }

  // Si es 204 No Content, retornar null
  if (response.status === 204) {
    return null as TResponse;
  }

  // Parsear y retornar la respuesta
  const data = await parseJsonSafe();
  return (data as TResponse) ?? (null as TResponse);
}






