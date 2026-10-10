import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireExaminer } from "@/lib/auth/roles";
import { isAuthConfigured } from "@/lib/auth/config";
import { isScoresComplete } from "@/lib/examiner/rubric";
import { claimSession } from "@/lib/examiner/queries";
import { CEFR_LEVELS } from "@/types";
import type { ExaminerDimensionScores } from "@/lib/examiner/rubric";

export const runtime = "nodejs";

const publishSchema = z.object({
  overallLevel: z.enum(CEFR_LEVELS as unknown as [string, ...string[]]),
  dimensionScores: z.record(z.string(), z.number().int().min(0).max(5)),
  dimensionNotes: z.record(z.string(), z.string()).optional(),
  summary: z.string().min(1, "Summary is required"),
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
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid data";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const scores = parsed.data.dimensionScores as ExaminerDimensionScores;
  if (!isScoresComplete(scores)) {
    return NextResponse.json(
      { error: "All 6 dimensions must be scored (0–5)." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("test_sessions")
    .select("id, examiner_id, candidate_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.examiner_id && session.examiner_id !== auth.userId) {
    return NextResponse.json({ error: "Not your session" }, { status: 403 });
  }

  if (!session.examiner_id) {
    const claim = await claimSession(sessionId, auth.userId);
    if (!claim.ok) {
      return NextResponse.json({ error: claim.error }, { status: 409 });
    }
  }

  const publishedAt = new Date().toISOString();

  const { error: resultError } = await supabase.from("session_results").upsert(
    {
      session_id: sessionId,
      examiner_id: auth.userId,
      overall_level: parsed.data.overallLevel,
      dimension_scores: parsed.data.dimensionScores,
      dimension_notes: parsed.data.dimensionNotes ?? {},
      summary: parsed.data.summary,
      published_at: publishedAt,
      updated_at: publishedAt,
    },
    { onConflict: "session_id" },
  );

  if (resultError) {
    return NextResponse.json({ error: resultError.message }, { status: 500 });
  }

  const { error: sessionError } = await supabase
    .from("test_sessions")
    .update({
      status: "completed",
      examiner_id: auth.userId,
      final_level: parsed.data.overallLevel,
    })
    .eq("id", sessionId);

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    publishedAt,
    candidateId: session.candidate_id,
  });
}
