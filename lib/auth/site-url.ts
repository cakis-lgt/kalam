import type { NextRequest } from "next/server";

/** Canonical app origin for Supabase email redirect URLs. */
export function getSiteUrl(request?: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (request) {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export function authCallbackUrl(request?: NextRequest): string {
  return `${getSiteUrl(request)}/auth/callback`;
}
