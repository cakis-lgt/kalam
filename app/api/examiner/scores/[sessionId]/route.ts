import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireExaminer } from "@/lib/auth/roles";
import { isAuthConfigured } from "@/lib/auth/config";
import { CEFR_LEVELS } from "@/types";

export const runtime = "nodejs";

const scoreSchema = z.object({
  overallLevel: z.enum(CEFR_LEVELS as unknown as [string, ...string[]]),
  dimensionScores: z.record(z.string(), z.number().int().min(0).max(5)),
  dimensionNotes: z.record(z.string(), z.string()).optional(),
  summary: z.string().optional(),
});

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const { sessionId } = await context.params;

  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const auth = await requireExaminer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);
  const parsed = scoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rubric data" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("test_sessions")
    .select("id, examiner_id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.examiner_id && session.examiner_id !== auth.userId) {
    return NextResponse.json({ error: "Not your session" }, { status: 403 });
  }

  const { error } = await supabase.from("session_results").upsert(
    {
      session_id: sessionId,
      examiner_id: auth.userId,
      overall_level: parsed.data.overallLevel,
      dimension_scores: parsed.data.dimensionScores,
      dimension_notes: parsed.data.dimensionNotes ?? {},
      summary: parsed.data.summary ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!session.examiner_id) {
    await supabase
      .from("test_sessions")
      .update({ examiner_id: auth.userId, status: "under_review" })
      .eq("id", sessionId);
  }

  return NextResponse.json({ ok: true });
}
