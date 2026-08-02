import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitAction = "chat" | "quiz" | "course_create" | "document_upload";

export async function consumeRateLimit(supabase: SupabaseClient, action: RateLimitAction) {
  const { data, error } = await supabase.rpc("consume_api_rate_limit", { requested_action: action });
  if (error) throw new Error("Rate-limit service unavailable.");
  return data === true;
}
