"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTestStore } from "@/store/testStore";
import { ResultPanel } from "@/app/tes/components/ResultPanel";
import { TestHeader } from "@/components/tes/TestHeader";
import { TestTaskPane } from "@/components/tes/TestTaskPane";
import { ProctorPanel } from "@/components/tes/ProctorPanel";
import type { ProctoringSummary } from "@/lib/proctoring/types";
import { TestIntroScreen } from "@/components/tes/TestIntroScreen";
import { MOCK_CANDIDATE } from "@/lib/dashboard/mock-data";
import { formatSessionDisplayId } from "@/lib/sessions/map-session";
import { CEFR_LEVELS } from "@/types";
import type { CEFRLevel } from "@/types";
import { SCORE_SCALE } from "@/lib/cefr/rubric";
import { isAuthConfigured } from "@/lib/auth/config";
import { isAiScoringEnabled } from "@/lib/ai/config";
import type { TestLanguage } from "@/types";

function TesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeSessionId = searchParams.get("session");
  const langParam = searchParams.get("lang");
  const initialLanguage: TestLanguage | null =
    langParam === "ar" || langParam === "en" ? langParam : null;

  const {
    phase,
    sessionId,
    currentTask,
    currentLevel,
    attempts,
    lastResult,
    finalResult,
    error,
    uploading,
    testLanguage,
    start,
    submitAttempt,
    continueAfterResult,
    setError,
    reset,
    resumeSession,
  } = useTestStore();

  const [submitting, setSubmitting] = useState(false);
  const [candidateName, setCandidateName] = useState(MOCK_CANDIDATE.fullName);
  const resumeHandledRef = useRef(false);

  const passedLevels: CEFRLevel[] = CEFR_LEVELS.filter((lvl) => {
    const lvlAttempts = attempts.filter((a) => a.task.level === lvl);
    if (lvlAttempts.length < 2) return false;
    const avg =
      lvlAttempts.reduce((s, a) => s + a.result.overall, 0) /
      lvlAttempts.length;
    return avg >= SCORE_SCALE.passingThreshold;
  });

  const taskIndex = attempts.length + 1;
  const taskCounter = currentTask
    ? `Task ${taskIndex} · ${currentTask.level}`
    : `Task ${taskIndex}`;

  const manualReview = !isAiScoringEnabled();
  const attemptsAtCurrentLevel = attempts.filter(
    (a) => a.task.level === currentLevel,
  ).length;
  const currentLevelIdx = CEFR_LEVELS.indexOf(currentLevel);
  const isFinalLevel = currentLevelIdx >= CEFR_LEVELS.length - 1;
  const resultContinueLabel =
    manualReview && isFinalLevel && attemptsAtCurrentLevel >= 2
      ? "Finish & Submit to Examiner"
      : attemptsAtCurrentLevel >= 2
        ? "Continue to Next Level"
        : "Continue to Next Task";

  const inEnvironment =
    phase === "loading-task" ||
    phase === "task-active" ||
    phase === "task-result" ||
    phase === "finalizing";

  useEffect(() => {
    if (!isAuthConfigured()) return;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile?: { full_name: string } } | null) => {
        if (data?.profile?.full_name) {
          setCandidateName(data.profile.full_name);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (resumeSessionId && !resumeHandledRef.current && phase === "intro") {
      resumeHandledRef.current = true;
      void resumeSession(resumeSessionId);
    }
  }, [resumeSessionId, phase, resumeSession]);

  useEffect(() => {
    if (phase === "finished" && finalResult) {
      if (sessionId && isAuthConfigured()) {
        router.push(`/tes/${sessionId}/waiting`);
      } else {
        router.push("/hasil");
      }
    }
  }, [phase, finalResult, sessionId, router]);

  const handleSubmitStable = useCallback(
    async (blob: Blob, duration: number, proctoring: ProctoringSummary) => {
      setSubmitting(true);
      try {
        await submitAttempt(blob, duration, proctoring);
      } finally {
        setSubmitting(false);
      }
    },
    [submitAttempt],
  );

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-page">
        <TestIntroScreen
          onStart={start}
          candidateName={candidateName}
          error={error}
          onClearError={() => setError(null)}
          initialLanguage={initialLanguage}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-test-bg text-slate-100">
      <TestHeader
        taskCounter={taskCounter}
        testLanguage={testLanguage}
        currentLevel={currentLevel}
        passedLevels={passedLevels}
        onEmergencyStop={() => {
          if (confirm("End the current task?")) reset();
        }}
      />

      {error && (
        <div className="mx-7 mt-4 flex items-start gap-3 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Something went wrong</div>
            <div>{error}</div>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {inEnvironment && (
        <main className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_0.82fr]">
          {phase === "loading-task" && (
            <div className="col-span-full flex flex-1 items-center justify-center p-12 text-ink-faint">
              <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary-fixed-dim" />
              Preparing task…
            </div>
          )}

          {phase === "task-active" && currentTask && (
            <>
              <TestTaskPane task={currentTask} taskIndex={taskIndex} />
              <ProctorPanel
                key={currentTask.id}
                preparationSec={currentTask.preparationSec}
                durationSec={currentTask.durationSec}
                submitting={submitting}
                uploading={uploading}
                onSubmit={handleSubmitStable}
                onError={setError}
              />
            </>
          )}

          {(phase === "task-result" || phase === "finalizing") && (
            <>
              {currentTask && phase === "task-result" && (
                <TestTaskPane task={currentTask} taskIndex={taskIndex} />
              )}
              <div className="flex items-start justify-center overflow-y-auto bg-test-panel p-6">
                {phase === "task-result" && lastResult ? (
                  <div className="w-full max-w-lg">
                    <ResultPanel
                      result={lastResult}
                      onContinue={continueAfterResult}
                      continueLabel={resultContinueLabel}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-ink-faint">
                    <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary-fixed-dim" />
                    {manualReview ? "Saving results…" : "Compiling final results…"}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}

export default function TesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-test-bg">
          <Loader2 className="h-8 w-8 animate-spin text-primary-fixed-dim" />
        </div>
      }
    >
      <TesPageContent />
    </Suspense>
  );
}
