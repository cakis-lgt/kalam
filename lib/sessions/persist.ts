import type { CEFRLevel } from "@/types";
import type { SessionProgress } from "@/types/database";

export async function patchSession(
  sessionId: string,
  body: {
    status?: string;
    current_level?: string;
    final_level?: string;
    progress_json?: SessionProgress;
    completed_at?: string;
  },
) {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save session progress");
  }
}

export function buildProgressJson(state: {
  currentLevelIdx: number;
  currentLevel: CEFRLevel;
  testLanguage?: "ar" | "en";
  attempts: Array<{
    task: { id: string; level: CEFRLevel };
    result: { overall: number; passed: boolean };
  }>;
}): SessionProgress {
  return {
    currentLevelIdx: state.currentLevelIdx,
    testLanguage: state.testLanguage,
    attempts: state.attempts.map((a) => ({
      taskId: a.task.id,
      taskLevel: a.task.level,
      overall: a.result.overall,
      passed: a.result.passed,
    })),
  };
}
