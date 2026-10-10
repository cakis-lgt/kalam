import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth/validation";
import { AUTH_NOT_CONFIGURED_MESSAGE, isAuthConfigured } from "@/lib/auth/config";
import { createCandidateProfile } from "@/lib/auth/create-candidate-profile";
import { authCallbackUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Throttle signups per IP to curb automated account creation.
  const limited = enforceRateLimit(`register:${clientIp(req)}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: firstIssue?.message ?? "Invalid registration data",
        details: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  if (!isAuthConfigured()) {
    return NextResponse.json({ error: AUTH_NOT_CONFIGURED_MESSAGE }, { status: 503 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: authCallbackUrl(req),
      data: {
        full_name: parsed.data.fullName,
        username: parsed.data.username,
        nim: parsed.data.nim,
        faculty: parsed.data.faculty,
        study_program: parsed.data.studyProgram,
        semester: parsed.data.semester,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    const profileError = await createCandidateProfile(data.user.id, parsed.data);
    if (profileError) {
      return NextResponse.json({ error: profileError }, { status: 400 });
    }
  }

  if (data.user && !data.session) {
    return NextResponse.json({
      message: "Check your email to confirm your account before signing in.",
      redirect: "/login",
    });
  }

  return NextResponse.json({ redirect: "/dashboard" });
}
