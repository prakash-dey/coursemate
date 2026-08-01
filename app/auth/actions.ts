"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function signIn(formData: FormData) {
  const supabase = await createSupabaseServerClient(); const email = String(formData.get("email") ?? "").trim(); const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) redirect(`/auth?error=${encodeURIComponent("Email or password is incorrect.")}`); redirect("/");
}
export async function signUp(formData: FormData) {
  const supabase = await createSupabaseServerClient(); const email = String(formData.get("email") ?? "").trim(); const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect(`/auth?error=${encodeURIComponent("Use at least 8 characters for your password.")}`);
  const { error } = await supabase.auth.signUp({ email, password }); if (error) redirect(`/auth?error=${encodeURIComponent("Account creation failed. Check your details and try again.")}`); redirect("/auth?message=Check your email to confirm your account.");
}
export async function signOut() { const supabase = await createSupabaseServerClient(); await supabase.auth.signOut(); redirect("/auth"); }
