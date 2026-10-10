import { NextRequest, NextResponse } from "next/server";
import { isAiScoringEnabled } from "@/lib/ai/config";
import {
  isTranscribeDevMockEnabled,
  mockTranscript,
  transcribeWithOpenAI,
} from "@/lib/openai/transcribe-audio";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

function audioFileFromBlob(audio: Blob, mimeType: string): File {
  const ext = mimeType.includes("mp4")
    ? "mp4"
    : mimeType.includes("mpeg")
      ? "mp3"
      : mimeType.includes("wav")
        ? "wav"
        : "webm";
  return new File([audio], `recording.${ext}`, {
    type: mimeType || "audio/webm",
  });
}

export async function POST(req: NextRequest) {
  try {
    // Whisper transcription is billable — cap per client.
    const limited = enforceRateLimit(`transcribe:${clientIp(req)}`, {
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;

    if (!isAiScoringEnabled()) {
      return NextResponse.json(
        { error: "AI scoring is disabled. Use the manual scoring flow." },
        { status: 503 },
      );
    }

    const formData = await req.formData();
    const audio = formData.get("audio");
    const taskId = formData.get("taskId");

    if (!(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "Audio file not found in request" },
        { status: 400 },
      );
    }

    if (audio.size === 0) {
      return NextResponse.json(
        { error: "Audio file is empty" },
        { status: 400 },
      );
    }

    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file exceeds the 25MB Whisper API limit" },
        { status: 400 },
      );
    }

    if (isTranscribeDevMockEnabled()) {
      return NextResponse.json({
        transcript: mockTranscript(
          typeof taskId === "string" ? taskId : null,
        ),
        duration: null,
        mock: true,
      });
    }

    const file = audioFileFromBlob(audio, audio.type || "video/webm");
    const task =
      typeof taskId === "string" ? (await import("@/lib/cefr/tasks")).getTaskById(taskId) : null;
    const language = task?.language ?? "ar";
    const { transcript, duration } = await transcribeWithOpenAI(file, language);

    return NextResponse.json({ transcript, duration });
  } catch (err) {
    console.error("[transcribe] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Transcription failed: ${message}` },
      { status: 500 },
    );
  }
}
