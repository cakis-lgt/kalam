import { NextResponse } from "next/server";
import { profileUpdateSchema } from "@/lib/auth/validation";
import { AUTH_NOT_CONFIGURED_MESSAGE, isAuthConfigured } from "@/lib/auth/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: AUTH_NOT_CONFIGURED_MESSAGE }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Invalid profile data" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fullName, username, nim, faculty, studyProgram, semester } =
    parsed.data;

  const [{ data: usernameRow }, { data: nimRow }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id")
      .eq("nim", nim)
      .neq("id", user.id)
      .maybeSingle(),
  ]);

  if (usernameRow) {
    return NextResponse.json({ error: "Username is already taken." }, { status: 400 });
  }
  if (nimRow) {
    return NextResponse.json({ error: "NIM is already registered." }, { status: 400 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      username,
      nim,
      faculty,
      study_program: studyProgram,
      semester,
    })
    .eq("id", user.id);

  if (profileError) {
    if (profileError.message.includes("profiles_username_unique")) {
      return NextResponse.json({ error: "Username is already taken." }, { status: 400 });
    }
    if (profileError.message.includes("profiles_nim_unique")) {
      return NextResponse.json({ error: "NIM is already registered." }, { status: 400 });
    }
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      username,
      nim,
      faculty,
      study_program: studyProgram,
      semester,
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
