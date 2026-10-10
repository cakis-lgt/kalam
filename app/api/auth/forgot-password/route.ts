import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_NOT_CONFIGURED_MESSAGE, isAuthConfigured } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  let email: string;
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    email = parsed.data.email;
  } else {
    const form = await req.formData();
    const parsed = schema.safeParse({ email: form.get("email") });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    email = parsed.data.email;
  }

  if (!isAuthConfigured()) {
    return NextResponse.json({ error: AUTH_NOT_CONFIGURED_MESSAGE }, { status: 503 });
  }

  const origin = req.headers.get("origin") ?? req.nextUrl.origin;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/login`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "If that email is registered, a password reset link has been sent.",
  });
}
