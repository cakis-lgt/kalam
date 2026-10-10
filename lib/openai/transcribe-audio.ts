import { getTaskById } from "@/lib/cefr/tasks";
import type { TestLanguage } from "@/types";
import { taskSpeakingPrompt } from "@/lib/tes/task-prompt";

const DEMO_TRANSCRIPT_AR =
  "السلام عليكم، اسمي أحمد، وأنا من جاكرتا.";

const DEMO_TRANSCRIPT_EN =
  "Hello, my name is Ahmad, and I am from Jakarta.";

export function isTranscribeDevMockEnabled(): boolean {
  return process.env.TRANSCRIBE_DEV_MOCK === "true";
}

export function mockTranscript(taskId?: string | null): string {
  const task = taskId ? getTaskById(taskId) : undefined;
  if (!task) return DEMO_TRANSCRIPT_AR;
  if (task.language === "en") {
    if (task.format === "muqaddimah") return DEMO_TRANSCRIPT_EN;
    return `${taskSpeakingPrompt(task)} — [demo transcript]`;
  }
  if (task.format === "muqaddimah") return DEMO_TRANSCRIPT_AR;
  return `${taskSpeakingPrompt(task)} — [demo transcript]`;
}

export async function transcribeWithOpenAI(
  file: File,
  language: TestLanguage = "ar",
): Promise<{ transcript: string; duration: number | null }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in .env.local");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("model", "whisper-1");
  form.append("language", language);
  form.append("response_format", "verbose_json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  const data = (await res.json().catch(() => ({}))) as {
    text?: string;
    duration?: number;
    error?: { message?: string; code?: string };
  };

  if (!res.ok) {
    const code = data.error?.code;
    const msg = data.error?.message ?? res.statusText;

    if (res.status === 429 || code === "insufficient_quota") {
      throw new Error(
        "OpenAI quota exceeded. Enable billing at platform.openai.com, or set TRANSCRIBE_DEV_MOCK=true for demo mode.",
      );
    }
    if (res.status === 401) {
      throw new Error("OPENAI_API_KEY is invalid.");
    }
    throw new Error(msg || `Whisper API error (${res.status})`);
  }

  return {
    transcript: data.text ?? "",
    duration: data.duration ?? null,
  };
}
