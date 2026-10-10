import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AUTH_NOT_CONFIGURED_MESSAGE, isAuthConfigured } from "@/lib/auth/config";

export const runtime = "nodejs";

export async function POST() {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: AUTH_NOT_CONFIGURED_MESSAGE }, { status: 503 });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ redirect: "/" });
}
