import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/auth/config";

export const runtime = "nodejs";

export async function GET() {
  if (!isAuthConfigured()) {
    return NextResponse.json({ profile: null });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile,
  });
}
