import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseAuthCookie } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === "/auth";
  const isAuthCallback = pathname === "/auth/callback";
  const authCookieNames = request.cookies.getAll()
    .map(({ name }) => name)
    .filter(isSupabaseAuthCookie);

  if (error && authCookieNames.length > 0) {
    const destination = isAuthPage || isAuthCallback
      ? NextResponse.next({ request })
      : NextResponse.redirect(new URL("/auth?error=session_expired", request.url));
    authCookieNames.forEach((name) => destination.cookies.delete(name));
    return destination;
  }
  if (!user && !isAuthPage && !isAuthCallback) return NextResponse.redirect(new URL("/auth", request.url));
  if (user && isAuthPage) return NextResponse.redirect(new URL("/", request.url));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico|api/health).*)"] };
