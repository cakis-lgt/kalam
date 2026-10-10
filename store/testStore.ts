import { create } from "zustand";
import type {
  CEFRLevel,
  TestTask,
  TaskAttempt,
  FinalResult,
  AssessmentResult,
  TestLanguage,
} from "@/types";
import { CEFR_LEVELS } from "@/types";
import { SCORE_SCALE } from "@/lib/cefr/rubric";
import { buildProgressJson, patchSession } from "@/lib/sessions/persist";
import { isAuthConfigured } from "@/lib/auth/config";
import type { ProctoringSummary } from "@/lib/proctoring/types";
import {
  isAiScoringEnabled,
  pendingManualReviewResult,
} from "@/lib/ai/config";

const TASKS_PER_LEVEL = 2;
const PASS_THRESHOLD = SCORE_SCALE.passingThreshold;

type Phase =
  | "intro"
  | "loading-task"
  | "task-active"
  | "task-result"
  | "finalizing"
  | "finished";

type TestState = {
  phase: Phase;
  sessionId: string | null;
  testLanguage: TestLanguage;
  currentLevel: CEFRLevel;
  currentLevelIdx: number;
  currentTask: TestTask | null;
  attempts: TaskAttempt[];
  lastResult: AssessmentResult | null;
  finalResult: FinalResult | null;
  error: string | null;
  uploading: boolean;

  start: (language: TestLanguage) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  loadNextTask: () => Promise<void>;
  submitAttempt: (
    blob: Blob,
    durationSec: number,
    proctoring?: ProctoringSummary,
  ) => Promise<void>;
  continueAfterResult: () => Promise<void>;
  reset: () => void;
  setError: (msg: string | null) => void;
};

function attemptsAtLevel(attempts: TaskAttempt[], level: CEFRLevel) {
  return attempts.filter((a) => a.task.level === level);
}

function passesLevel(attempts: TaskAttempt[], level: CEFRLevel): boolean {
  const lvlAttempts = attemptsAtLevel(attempts, level);
  if (lvlAttempts.length < TASKS_PER_LEVEL) return false;
  const avg =
    lvlAttempts.reduce((s, a) => s + a.result.overall, 0) / lvlAttempts.length;
  return avg >= PASS_THRESHOLD;
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function persistIfConfigured(get: () => TestState) {
  const { sessionId, currentLevelIdx, currentLevel, attempts, testLanguage } =
    get();
  if (!sessionId || !isAuthConfigured()) return;
  await patchSession(sessionId, {
    current_level: currentLevel,
    progress_json: buildProgressJson({
      currentLevelIdx,
      currentLevel,
      testLanguage,
      attempts,
    }),
  });
}

export const useTestStore = create<TestState>((set, get) => ({
  phase: "intro",
  sessionId: null,
  testLanguage: "ar",
  currentLevel: "Pre-A1",
  currentLevelIdx: 0,
  currentTask: null,
  attempts: [],
  lastResult: null,
  finalResult: null,
  error: null,
  uploading: false,

  setError: (msg) => set({ error: msg }),

  reset: () =>
    set({
      phase: "intro",
      sessionId: null,
      testLanguage: "ar",
      currentLevel: "Pre-A1",
      currentLevelIdx: 0,
      currentTask: null,
      attempts: [],
      lastResult: null,
      finalResult: null,
      error: null,
      uploading: false,
    }),

  start: async (language: TestLanguage) => {
    set({ phase: "loading-task", error: null, testLanguage: language });
    try {
      if (isAuthConfigured()) {
        const { session } = await postJSON<{ session: { id: string } }>(
          "/api/sessions",
          { language },
        );
        set({ sessionId: session.id });
      }
      await get().loadNextTask();
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to start session",
        phase: "intro",
      });
    }
  },

  resumeSession: async (sessionId: string) => {
    set({ phase: "loading-task", error: null, sessionId });
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) {
        throw new Error("Session not found");
      }
      const { session } = (await res.json()) as {
        session: {
          language?: TestLanguage;
          current_level: CEFRLevel;
          progress_json?: {
            currentLevelIdx?: number;
            testLanguage?: TestLanguage;
            attempts?: Array<{ taskId: string }>;
          };
        };
      };

      const testLanguage =
        session.language ??
        session.progress_json?.testLanguage ??
        "ar";

      const levelIdx =
        session.progress_json?.currentLevelIdx ??
        Math.max(0, CEFR_LEVELS.indexOf(session.current_level));

      set({
        testLanguage,
        currentLevel: session.current_level,
        currentLevelIdx: levelIdx,
      });
      await get().loadNextTask();
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to resume session",
        phase: "intro",
        sessionId: null,
      });
    }
  },

  loadNextTask: async () => {
    const { currentLevel, attempts, testLanguage } = get();
    try {
      const excludeIds = attempts.map((a) => a.task.id);
      const data = await postJSON<{ task: TestTask }>("/api/next-task", {
        level: currentLevel,
        language: testLanguage,
        excludeIds,
      });
      set({
        currentTask: data.task,
        phase: "task-active",
        lastResult: null,
        error: null,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load task",
        phase: "task-active",
      });
    }
  },

  submitAttempt: async (blob, durationSec, proctoring) => {
    const { currentTask, sessionId } = get();
    if (!currentTask) return;
    set({ error: null, uploading: true });

    try {
      const mimeType = blob.type || "video/webm";

      if (sessionId && isAuthConfigured()) {
        const uploadForm = new FormData();
        uploadForm.append(
          "file",
          blob,
          `recording.${mimeType.includes("mp4") ? "mp4" : "webm"}`,
        );
        uploadForm.append("sessionId", sessionId);
        uploadForm.append("taskId", currentTask.id);
        uploadForm.append("durationSec", String(durationSec));
        if (proctoring) {
          uploadForm.append("proctoring", JSON.stringify(proctoring));
        }

        const uploadRes = await fetch("/api/recordings/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}));
          throw new Error(data.error || "Failed to upload recording");
        }
      }

      let transcript = "";
      let result: AssessmentResult;

      if (isAiScoringEnabled()) {
        const formData = new FormData();
        formData.append(
          "audio",
          blob,
          `recording.${mimeType.includes("mp4") ? "mp4" : "webm"}`,
        );
        formData.append("taskId", currentTask.id);
        const transRes = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        if (!transRes.ok) {
          const data = await transRes.json().catch(() => ({}));
          throw new Error(data.error || "Transcription failed");
        }
        ({ transcript } = (await transRes.json()) as { transcript: string });

        result = await postJSON<AssessmentResult>("/api/assess", {
          taskId: currentTask.id,
          transcript,
          audioDurationSec: durationSec,
        });
      } else {
        result = pendingManualReviewResult(currentTask);
      }

      const newAttempt: TaskAttempt = {
        task: currentTask,
        transcript,
        result,
        audioDurationSec: durationSec,
      };

      set({
        attempts: [...get().attempts, newAttempt],
        lastResult: result,
        phase: "task-result",
        uploading: false,
      });

      await persistIfConfigured(get);
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to save response",
        uploading: false,
      });
    }
  },

  continueAfterResult: async () => {
    const { attempts, currentLevel, currentLevelIdx } = get();
    const lvlAttempts = attemptsAtLevel(attempts, currentLevel);

    if (lvlAttempts.length < TASKS_PER_LEVEL) {
      set({ phase: "loading-task" });
      await get().loadNextTask();
      return;
    }

    if (!isAiScoringEnabled()) {
      if (currentLevelIdx >= CEFR_LEVELS.length - 1) {
        await finalize(set, get);
        return;
      }
      const nextIdx = currentLevelIdx + 1;
      set({
        currentLevelIdx: nextIdx,
        currentLevel: CEFR_LEVELS[nextIdx],
        phase: "loading-task",
      });
      await persistIfConfigured(get);
      await get().loadNextTask();
      return;
    }

    const passed = passesLevel(attempts, currentLevel);
    if (!passed) {
      await finalize(set, get);
      return;
    }

    if (currentLevelIdx >= CEFR_LEVELS.length - 1) {
      await finalize(set, get);
      return;
    }

    const nextIdx = currentLevelIdx + 1;
    set({
      currentLevelIdx: nextIdx,
      currentLevel: CEFR_LEVELS[nextIdx],
      phase: "loading-task",
    });
    await persistIfConfigured(get);
    await get().loadNextTask();
  },
}));

async function finalize(
  set: (
    partial:
      | Partial<TestState>
      | ((state: TestState) => Partial<TestState>),
  ) => void,
  get: () => TestState,
) {
  set({ phase: "finalizing" });
  const { attempts, currentLevelIdx, currentLevel, sessionId } = get();

  const manualReview = !isAiScoringEnabled();

  let finalLevel: CEFRLevel = manualReview ? currentLevel : "Pre-A1";
  if (!manualReview) {
    for (let i = currentLevelIdx; i >= 0; i--) {
      if (passesLevel(attempts, CEFR_LEVELS[i])) {
        finalLevel = CEFR_LEVELS[i];
        break;
      }
    }
  }

  const emptyScores: FinalResult["averageScores"] = {
    pronunciation: 0,
    fluency: 0,
    grammar: 0,
    vocabulary: 0,
    coherence: 0,
  };

  try {
    let finalizePayload: {
      finalLevel: CEFRLevel;
      averageScores: FinalResult["averageScores"];
      overallScore: number;
      summary_id: string;
      recommendations_id: string[];
    };

    if (manualReview) {
      finalizePayload = {
        finalLevel,
        averageScores: emptyScores,
        overallScore: 0,
        summary_id:
          "Your response has been submitted to the examiner for manual scoring. Your score will appear after the examiner finishes reviewing.",
        recommendations_id: [],
      };
    } else {
      finalizePayload = await postJSON<typeof finalizePayload>(
        "/api/finalize",
        {
          finalLevel,
          attempts: attempts.map((a) => ({
            taskLevel: a.task.level,
            taskFormat: a.task.format,
            overall: a.result.overall,
            passed: a.result.passed,
            scores: a.result.scores,
            feedback_id: a.result.feedback_id,
          })),
        },
      );
    }

    if (sessionId && isAuthConfigured()) {
      await patchSession(sessionId, {
        status: "awaiting_review",
        final_level: finalLevel,
        current_level: finalLevel,
        completed_at: new Date().toISOString(),
        progress_json: buildProgressJson({
          currentLevelIdx: get().currentLevelIdx,
          currentLevel: get().currentLevel,
          testLanguage: get().testLanguage,
          attempts: get().attempts,
        }),
      });
    }

    const finalResult: FinalResult = {
      finalLevel: finalizePayload.finalLevel,
      attempts,
      averageScores: finalizePayload.averageScores,
      overallScore: finalizePayload.overallScore,
      summary_id: finalizePayload.summary_id,
      recommendations_id: finalizePayload.recommendations_id,
    };

    set({ finalResult, phase: "finished" });
  } catch (e) {
    set({
      error: e instanceof Error ? e.message : "Failed to finalize results",
      phase: "task-result",
    });
  }
}
