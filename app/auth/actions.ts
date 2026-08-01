"use server";

import { redirect } from "next/navigation";

import { appUrl } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  const supabase = await createSupabaseServerClient();
  const callbackUrl = new URL("/auth/callback", appUrl());
  callbackUrl.searchParams.set("next", "/");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) redirect("/auth?error=provider_unavailable");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
