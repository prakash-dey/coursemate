import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";
export async function createSupabaseServerClient() {
  const cookieStore = await cookies(); const { url, anonKey } = supabaseEnv();
  return createServerClient(url, anonKey, { cookies: { getAll: () => cookieStore.getAll(), setAll: (items) => { try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} } } });
}
export async function requireUser() {
  const supabase = await createSupabaseServerClient(); const { data: { user }, error } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}
