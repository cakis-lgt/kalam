import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_NOT_CONFIGURED_MESSAGE, isAuthConfigured } from "@/lib/auth/config";
import { authCallbackUrl } from "@/lib/auth/site-url";
import { resolveLoginEmail } from "@/lib/auth/resolve-login";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().optional(),
  identifier: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isAuthConfigured()) {
    return NextResponse.json({ error: AUTH_NOT_CONFIGURED_MESSAGE }, { status: 503 });
  }

  let email = parsed.data.email;
  if (!email && parsed.data.identifier) {
    const resolved = await resolveLoginEmail(parsed.data.identifier);
    if (resolved.error) {
      return NextResponse.json({ error: resolved.error }, { status: 503 });
    }
    email = resolved.email ?? undefined;
  }

  if (!email) {
    return NextResponse.json(
      { error: "Enter your email or username to resend confirmation." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: authCallbackUrl(req),
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Confirmation email sent. Check your inbox and open the latest link.",
  });
}
