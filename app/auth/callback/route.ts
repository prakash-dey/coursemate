import { NextResponse } from "next/server";

import { appUrl, safeNextPath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const providerError = requestUrl.searchParams.get("error");
  const code = requestUrl.searchParams.get("code");

  if (providerError) return NextResponse.redirect(new URL("/auth?error=access_denied", appUrl()));
  if (!code) return NextResponse.redirect(new URL("/auth?error=missing_code", appUrl()));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/auth?error=callback_failed", appUrl()));
  return NextResponse.redirect(new URL(next, appUrl()));
}
