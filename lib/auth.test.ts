import { afterEach, describe, expect, it } from "vitest";

import { appUrl, authErrorMessage, isSupabaseAuthCookie, safeNextPath } from "./auth";

describe("authentication helpers", () => {
  const originalAppUrl = process.env.APP_URL;

  afterEach(() => {
    if (originalAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = originalAppUrl;
  });

  it("allows only relative post-authentication destinations", () => {
    expect(safeNextPath("/courses/123?tab=quiz")).toBe("/courses/123?tab=quiz");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example/path")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });

  it("uses a safe canonical application origin", () => {
    process.env.APP_URL = "https://courses.example/path";
    expect(appUrl()).toBe("https://courses.example");
    process.env.APP_URL = "javascript:alert(1)";
    expect(appUrl()).toBe("http://localhost:3000");
  });

  it("identifies Supabase session cookies including chunked cookies", () => {
    expect(isSupabaseAuthCookie("sb-project-auth-token.0")).toBe(true);
    expect(isSupabaseAuthCookie("other-cookie")).toBe(false);
  });

  it("does not echo untrusted provider errors", () => {
    expect(authErrorMessage("access_denied")).toContain("cancelled");
    expect(authErrorMessage("secret internal detail")).toBe("Google sign-in did not complete. Please try again.");
  });
});
