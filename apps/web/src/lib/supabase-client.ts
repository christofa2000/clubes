'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Obtiene el cliente de Supabase configurado.
 *
 * Configuración:
 * - Usa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY desde variables de entorno
 * - Persiste la sesión en localStorage (para que el usuario permanezca autenticado)
 * - Detecta sesiones en la URL (útil para callbacks de OAuth)
 *
 * @returns Cliente de Supabase configurado
 * @throws Error si faltan las variables de entorno
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error(
        'SUPABASE_CONFIG_MISSING: Verifica que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén configuradas en .env.local',
      );
    }

    client = createClient(url, anonKey, {
      auth: {
        persistSession: true, // Cambiado a true para mantener la sesión
        detectSessionInUrl: true,
        autoRefreshToken: true, // Refresca automáticamente el token cuando expira
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }

  return client;
};
