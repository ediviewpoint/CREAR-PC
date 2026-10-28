import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client público (anon). Usar SOLO para lecturas que
 * las políticas RLS de Supabase permitan al rol anon.
 *
 * Para operaciones privilegiadas usar `getDb()` (Drizzle) desde server-only.
 */

let cachedPublic: SupabaseClient | null = null;

export function getSupabasePublic(): SupabaseClient {
  if (cachedPublic) return cachedPublic;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están definidos.",
    );
  }
  cachedPublic = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return cachedPublic;
}
