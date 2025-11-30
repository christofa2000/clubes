const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status?: number;
  details?: unknown;
}

const ensureLeadingSlash = (path: string): string => (path.startsWith('/') ? path : `/${path}`);

export async function apiFetch<TResponse = unknown>(path: string, options: RequestInit = {}): Promise<TResponse> {
  if (!API_BASE_URL) {
    throw new Error('API_URL_NOT_CONFIGURED');
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers = new Headers(options.headers ?? undefined);
  const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!headers.has('Content-Type') && !isFormDataBody) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${ensureLeadingSlash(path)}`, {
    ...options,
    cache: options.cache ?? 'no-store',
    headers,
  });

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

  if (!response.ok) {
    const payload = (await parseJsonSafe()) as { message?: string; error?: string } | null;
    const message = payload?.message ?? payload?.error ?? 'API_ERROR';
    const error = new ApiError(message);
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  if (response.status === 204) {
    return null as TResponse;
  }

  const data = await parseJsonSafe();
  return (data as TResponse) ?? (null as TResponse);
}


