import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/auth/config";

export const runtime = "nodejs";

const proctoringEventSchema = z.object({
  timestampMs: z.number().int().min(0),
  eventType: z.enum(["good", "warning", "danger"]),
  gazeScore: z.number().min(0).max(1),
});

const schema = z.object({
  sessionId: z.string().uuid(),
  taskId: z.string().min(1),
  storagePath: z.string().min(1),
  durationSec: z.number().positive(),
  fileSizeBytes: z.number().int().positive(),
  mimeType: z.string().optional(),
  warningCount: z.number().int().min(0).optional(),
  eyeContactAvg: z.number().min(0).max(1).optional(),
  eyeContactEvents: z.array(proctoringEventSchema).max(500).optional(),
});

export async function POST(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recording data" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    sessionId,
    taskId,
    storagePath,
    durationSec,
    fileSizeBytes,
    warningCount,
    eyeContactAvg,
    eyeContactEvents,
  } = parsed.data;

  const { data: session, error: sessionError } = await supabase
    .from("test_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("candidate_id", user.id)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const uploadedAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("recordings")
    .upsert(
      {
        session_id: sessionId,
        task_id: taskId,
        storage_path: storagePath,
        duration_sec: Math.round(durationSec),
        file_size_bytes: fileSizeBytes,
        uploaded_at: uploadedAt,
        expires_at: expiresAt,
        warning_count: warningCount ?? null,
        eye_contact_avg: eyeContactAvg ?? null,
      },
      { onConflict: "session_id,task_id" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (eyeContactEvents?.length && data?.id) {
    await supabase.from("eye_contact_events").delete().eq("recording_id", data.id);
    await supabase.from("eye_contact_events").insert(
      eyeContactEvents.map((e) => ({
        recording_id: data.id,
        timestamp_ms: e.timestampMs,
        event_type: e.eventType,
        gaze_score: e.gazeScore,
        duration_ms: 3000,
      })),
    );
  }

  return NextResponse.json({ recording: data });
}
