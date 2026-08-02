import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";
export function createSupabaseAdminClient() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!serviceRole) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for ingestion.");
  return createClient(supabaseEnv().url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
}
