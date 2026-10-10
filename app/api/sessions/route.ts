import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/auth/config";
import { ensureProfileForUser } from "@/lib/auth/ensure-profile";
import { friendlyDbError } from "@/lib/supabase/schema-errors";
import { TEST_LANGUAGES } from "@/types";

export const runtime = "nodejs";

const CreateSessionSchema = z.object({
  language: z.enum(TEST_LANGUAGES).optional(),
});

export async function GET() {
  if (!isAuthConfigured()) {
    return NextResponse.json({ sessions: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("test_sessions")
    .select("*")
    .eq("candidate_id", user.id)
    .order("started_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(req: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileError = await ensureProfileForUser(user);
  if (profileError) {
    return NextResponse.json(
      { error: friendlyDbError(profileError) },
      { status: 500 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", user.id)
    .maybeSingle();

  let language: "ar" | "en" =
    profile?.preferred_language === "en" || profile?.preferred_language === "ar"
      ? profile.preferred_language
      : "ar";

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSessionSchema.safeParse(body);
  if (parsed.success && parsed.data.language) {
    language = parsed.data.language;
  }

  const { data, error } = await supabase
    .from("test_sessions")
    .insert({
      candidate_id: user.id,
      status: "in_progress",
      language,
      current_level: "Pre-A1",
      progress_json: { currentLevelIdx: 0, testLanguage: language, attempts: [] },
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: friendlyDbError(error.message) },
      { status: 500 },
    );
  }

  return NextResponse.json({ session: data });
}
