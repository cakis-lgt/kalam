import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthConfigured } from "@/lib/auth/config";
import { uploadRecordingServerSide } from "@/lib/storage/upload-recording-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MIN_RECORDING_BYTES = 2048;

const proctoringEventSchema = z.object({
  timestampMs: z.number().int().min(0),
  eventType: z.enum(["good", "warning", "danger"]),
  gazeScore: z.number().min(0).max(1),
});

const proctoringSchema = z
  .object({
    events: z.array(proctoringEventSchema).max(500).optional(),
    warningCount: z.number().int().min(0).optional(),
    eyeContactAvg: z.number().min(0).max(1).optional(),
  })
  .optional();

export async function POST(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const sessionId = formData.get("sessionId");
  const taskId = formData.get("taskId");
  const durationRaw = formData.get("durationSec");
  const proctoringRaw = formData.get("proctoring");

  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Recording file is empty" }, { status: 400 });
  }

  if (file.size < MIN_RECORDING_BYTES) {
    return NextResponse.json(
      {
        error:
          "Video recording is too small or failed to record. Retry the task and keep the camera active throughout recording.",
      },
      { status: 400 },
    );
  }

  if (typeof sessionId !== "string" || typeof taskId !== "string") {
    return NextResponse.json({ error: "Invalid session or task" }, { status: 400 });
  }

  const durationSec = Number(durationRaw);
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return NextResponse.json({ error: "Invalid recording duration" }, { status: 400 });
  }

  let proctoring: z.infer<typeof proctoringSchema> = undefined;
  if (typeof proctoringRaw === "string" && proctoringRaw.length > 0) {
    try {
      proctoring = proctoringSchema.parse(JSON.parse(proctoringRaw));
    } catch {
      return NextResponse.json({ error: "Invalid proctoring data" }, { status: 400 });
    }
  }

  const { data: session, error: sessionError } = await supabase
    .from("test_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("candidate_id", user.id)
    .maybeSingle();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const mimeType = file.type || "video/webm";

  let storagePath: string;
  try {
    storagePath = await uploadRecordingServerSide(
      sessionId,
      taskId,
      file,
      mimeType,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const uploadedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const storedDuration = Math.max(1, Math.round(durationSec));

  const service = createServiceClient();
  const db = service ?? supabase;

  const { data, error } = await db
    .from("recordings")
    .upsert(
      {
        session_id: sessionId,
        task_id: taskId,
        storage_path: storagePath,
        duration_sec: storedDuration,
        file_size_bytes: file.size,
        uploaded_at: uploadedAt,
        expires_at: expiresAt,
        warning_count: proctoring?.warningCount ?? null,
        eye_contact_avg: proctoring?.eyeContactAvg ?? null,
      },
      { onConflict: "session_id,task_id" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = proctoring?.events ?? [];
  if (events.length > 0 && data?.id) {
    await db.from("eye_contact_events").delete().eq("recording_id", data.id);
    const { error: eventsError } = await db.from("eye_contact_events").insert(
      events.map((e) => ({
        recording_id: data.id,
        timestamp_ms: e.timestampMs,
        event_type: e.eventType,
        gaze_score: e.gazeScore,
        duration_ms: 3000,
      })),
    );
    if (eventsError) {
      console.error("[recordings/upload] eye_contact_events:", eventsError.message);
    }
  }

  return NextResponse.json({ recording: data });
}
