const AUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Google sign-in was cancelled. You can try again when you are ready.",
  callback_failed: "We could not complete Google sign-in. Please try again.",
  configuration_error: "Google sign-in is not configured for this environment.",
  missing_code: "The Google sign-in response was incomplete. Please try again.",
  provider_unavailable: "Google sign-in is temporarily unavailable. Check the local OAuth configuration and try again.",
  session_expired: "Your previous local session is no longer valid. Please sign in again.",
};

export function appUrl() {
  const configured = process.env.APP_URL ?? "http://localhost:3000";
  try {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported protocol");
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const parsed = new URL(value, "http://local");
    return parsed.origin === "http://local" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : "/";
  } catch {
    return "/";
  }
}

export function authErrorMessage(code: string) {
  return AUTH_ERROR_MESSAGES[code] ?? "Google sign-in did not complete. Please try again.";
}

export function isSupabaseAuthCookie(name: string) {
  return name.startsWith("sb-") && name.includes("auth-token");
}
