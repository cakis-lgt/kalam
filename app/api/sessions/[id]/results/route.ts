import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/auth/config";
import { mapSessionResultToView } from "@/lib/results/published-result";
import type { SessionResult } from "@/types/database";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id: sessionId } = await context.params;

  if (!isAuthConfigured()) {
    return NextResponse.json({ published: false, result: null });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: session } = await supabase
    .from("test_sessions")
    .select("id, candidate_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.candidate_id !== user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: row } = await supabase
    .from("session_results")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!row?.published_at) {
    return NextResponse.json({ published: false, result: null });
  }

  const result = mapSessionResultToView(
    sessionId,
    row as SessionResult,
  );

  return NextResponse.json({ published: Boolean(result), result });
}
