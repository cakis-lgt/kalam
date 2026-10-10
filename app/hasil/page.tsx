"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useTestStore } from "@/store/testStore";
import { usePublishedResults } from "@/hooks/usePublishedResults";
import {
  DIMENSIONS,
  scoreBand,
  SCORE_SCALE,
} from "@/lib/cefr/rubric";
import { RadarChartClient } from "./components/RadarChartClient";
import { HasilPublishedView } from "./components/PublishedResultView";
import {
  taskPromptDir,
  taskPromptLang,
  taskSpeakingPrompt,
  taskUsesArabicFont,
} from "@/lib/tes/task-prompt";

const FORMAT_LABEL: Record<string, string> = {
  muqaddimah: "Self introduction",
  wasf: "Picture description",
  hiwar: "Roleplay/dialog",
  munaqasyah: "Opinion/argumentation",
  custom: "Free topic",
};

export default function HasilPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <HasilPageContent />
    </Suspense>
  );
}

function HasilPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const { finalResult, reset } = useTestStore();
  const published = usePublishedResults(sessionId);

  useEffect(() => {
    if (!finalResult && !sessionId) {
      router.push("/tes");
    }
  }, [finalResult, sessionId, router]);

  if (sessionId && published.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionId && published.published && published.result) {
    return (
      <HasilPublishedView
        result={published.result}
        sessionId={sessionId}
        connected={published.connected}
      />
    );
  }

  if (!finalResult) {
    if (sessionId) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-page px-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-2xl">
              🧑‍🏫
            </div>
            <h1 className="font-heading text-2xl font-semibold text-ink">
              Examiner score not available yet
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-subtle">
              Final examiner results will appear automatically once scored and
              published. You can wait in the waiting room — this page also
              updates scores in real time.
            </p>
            {published.connected && (
              <p className="mt-3 text-xs font-medium text-[#16a34a]">
                ● Connected · awaiting score publish
              </p>
            )}
            {published.error && (
              <p className="mt-2 text-xs text-red-600">{published.error}</p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href={`/tes/${sessionId}/waiting`}
                className="rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-kalam-600"
              >
                Go to waiting room
              </Link>
              <Link
                href="/dashboard"
                className="rounded-[10px] border border-border-light bg-white px-5 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-container"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </main>
      );
    }
    return null;
  }

  const overallBand = scoreBand(finalResult.overallScore);
  const resultDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handlePrint() {
    window.print();
  }

  return (
    <main className="mx-auto max-w-[1000px] px-margin-mobile py-[34px] md:px-gutter md:pb-16">
      <div className="no-print mb-[22px] flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-[13.5px] font-medium text-ink-subtle hover:text-ink"
        >
          ← Dashboard
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-[10px] border border-border-light bg-white px-4 py-2 text-[13px] font-semibold text-ink-secondary hover:bg-surface-container"
        >
          🖨 Print / PDF
        </button>
      </div>

      <section className="mb-[22px] flex animate-krise flex-wrap items-center justify-between gap-6 rounded-[20px] bg-gradient-to-br from-ink to-[#1f2a3a] px-9 py-8 text-white">
        <div>
          <div className="mb-2 text-[12.5px] font-medium text-[#a6cad6]">
            SPEAKING TEST RESULT · {resultDate}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="font-heading text-[58px] font-bold leading-none">
              {finalResult.finalLevel}
            </div>
            <div>
              <span
                className="mb-1.5 inline-block rounded-full px-[13px] py-1 text-[13px] font-bold text-white"
                style={{ backgroundColor: overallBand.color }}
              >
                {overallBand.label}
              </span>
              <div className="text-[13.5px] text-ink-faint">
                Average {finalResult.overallScore.toFixed(2)} / {SCORE_SCALE.max} · 5
                dimensions (AI estimate)
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1 text-xs text-ink-faint">Scoring mode</div>
          <div className="text-[15px] font-semibold">AI estimate (MVP)</div>
          <div className="text-xs text-ink-faint">{resultDate}</div>
        </div>
      </section>

      <section className="mb-[22px] grid gap-[22px] md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-[22px]">
          <div className="mb-1.5 self-start text-[13px] font-semibold text-ink-muted">
            Proficiency Profile
          </div>
          <RadarChartClient scores={finalResult.averageScores} />
        </div>

        <div className="rounded-2xl border border-border bg-white p-[22px]">
          <div className="mb-3.5 text-[13px] font-semibold text-ink-muted">
            Dimension breakdown
          </div>
          <div className="grid gap-3.5">
            {DIMENSIONS.map((d) => {
              const score = finalResult.averageScores[d.key];
              const b = scoreBand(score);
              const pct = `${Math.round((score / SCORE_SCALE.max) * 100)}%`;
              return (
                <div key={d.key}>
                  <div className="mb-[5px] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">
                        {d.name_id}
                      </span>
                      <span
                        dir="rtl"
                        lang="ar"
                        className="font-arabic text-[15px] text-ink-faint"
                      >
                        {d.name_ar}
                      </span>
                    </div>
                    <span
                      className="text-[13px] font-bold"
                      style={{ color: b.color }}
                    >
                      {score.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="h-[7px] overflow-hidden rounded-full bg-surface-dim">
                    <div
                      className="h-full rounded-full"
                      style={{ width: pct, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mb-[18px] rounded-2xl border border-border bg-white p-6">
        <div className="mb-2.5 text-[13px] font-semibold text-ink-muted">
          Notes &amp; Recommendations
        </div>
        <p className="text-[14.5px] leading-[1.65] text-ink-secondary">
          {finalResult.summary_id}
        </p>
        {finalResult.recommendations_id.length > 0 && (
          <div className="mt-4 grid gap-2.5">
            {finalResult.recommendations_id.map((text, i) => (
              <div
                key={i}
                className="flex gap-[11px] rounded-[10px] bg-page-alt px-3.5 py-3"
              >
                <span className="w-[74px] shrink-0 text-xs font-bold text-primary">
                  Recommendation {i + 1}
                </span>
                <span className="text-[13.5px] leading-[1.5] text-ink-muted">
                  {text}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-[18px] rounded-2xl border border-border bg-white p-6">
        <div className="mb-4 text-[13px] font-semibold text-ink-muted">
          Per-task details
        </div>
        <div className="grid gap-3">
          {finalResult.attempts.map((a, i) => {
            const b = scoreBand(a.result.overall);
            return (
              <div
                key={i}
                className="rounded-[10px] border border-border-light p-4 text-sm"
              >
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="rounded-md bg-primary-container px-2 py-0.5 text-xs font-semibold text-on-primary-container">
                      {a.task.level}
                    </span>{" "}
                    <span className="text-ink-subtle">
                      {FORMAT_LABEL[a.task.format] ?? a.task.format}
                    </span>
                  </div>
                  <span
                    className="text-base font-bold tabular-nums"
                    style={{ color: b.color }}
                  >
                    {a.result.overall.toFixed(2)} / {SCORE_SCALE.max}
                  </span>
                </div>
                <p
                  dir={taskPromptDir(a.task)}
                  lang={taskPromptLang(a.task)}
                  className={`mb-2 text-base text-ink ${
                    taskUsesArabicFont(a.task) ? "font-arabic" : ""
                  }`}
                >
                  {taskSpeakingPrompt(a.task)}
                </p>
                <p className="text-xs italic text-ink-subtle">
                  {a.result.feedback_id}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="no-print flex items-center gap-2.5 rounded-xl border border-dashed border-primary-fixed-dim bg-[#eef6f8] px-[17px] py-3.5 text-[12.5px] text-ink-subtle">
        <span className="text-primary">🗓</span>
        Test video recordings are deleted automatically after{" "}
        <strong className="text-ink-muted">14 days</strong>. This score remains
        stored permanently.
      </div>

      <div className="no-print mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            reset();
            router.push("/tes");
          }}
          className="text-sm font-medium text-primary hover:underline"
        >
          Retake test
        </button>
      </div>
    </main>
  );
}
