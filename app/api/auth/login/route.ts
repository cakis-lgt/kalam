import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth/validation";
import { AUTH_NOT_CONFIGURED_MESSAGE, isAuthConfigured } from "@/lib/auth/config";
import { resolveLoginEmail } from "@/lib/auth/resolve-login";
import { createClient } from "@/lib/supabase/server";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Throttle credential attempts per IP to slow brute-force.
  const limited = enforceRateLimit(`login:${clientIp(req)}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid login data", details: parsed.error.issues },
      { status: 400 },
    );
  }

  if (!isAuthConfigured()) {
    return NextResponse.json({ error: AUTH_NOT_CONFIGURED_MESSAGE }, { status: 503 });
  }

  const resolved = await resolveLoginEmail(parsed.data.identifier);
  if (resolved.error) {
    return NextResponse.json({ error: resolved.error }, { status: 503 });
  }
  if (!resolved.email) {
    return NextResponse.json(
      { error: "Incorrect username/email or password." },
      { status: 401 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: resolved.email,
    password: parsed.data.password,
  });

  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? "Incorrect username/email or password."
        : error.message === "Email not confirmed"
          ? "Email not confirmed. Open the latest confirmation link in your inbox, or resend below."
          : error.message;
    return NextResponse.json(
      {
        error: message,
        code: error.message === "Email not confirmed" ? "email_not_confirmed" : undefined,
      },
      { status: 401 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let redirect = "/dashboard";
  if (user) {
    const metaRole = user.app_metadata?.role as string | undefined;
    if (metaRole === "admin") {
      redirect = "/admin";
    } else if (metaRole === "examiner") {
      redirect = "/examiner";
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role === "admin") {
        redirect = "/admin";
      } else if (profile?.role === "examiner") {
        redirect = "/examiner";
      }
    }
  }

  return NextResponse.json({ redirect });
}
