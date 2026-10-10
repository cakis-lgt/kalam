"use client";

import Link from "next/link";
import type { PublishedResultView } from "@/lib/results/published-result";
import { EXAMINER_DIMENSIONS } from "@/lib/examiner/rubric";
import { SCORE_SCALE } from "@/lib/cefr/rubric";
import { ExaminerRadarChartClient } from "./ExaminerRadarChartClient";

type Props = {
  result: PublishedResultView;
  sessionId: string;
  connected?: boolean;
};

function scoreBand(score: number) {
  if (score >= 4.5) return { label: "Excellent", color: "#0ea5e9" };
  if (score >= 3.5) return { label: "Good", color: "#22c55e" };
  if (score >= 2.5) return { label: "Adequate", color: "#84cc16" };
  return { label: "Needs improvement", color: "#eab308" };
}

export function HasilPublishedView({
  result,
  sessionId,
  connected = false,
}: Props) {
  const publishedDate = new Date(result.publishedAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

      {connected && (
        <div className="no-print mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#eef6ee] px-4 py-2.5 text-[13px] font-semibold text-[#16a34a]">
          <span className="h-2 w-2 animate-kpulse rounded-full bg-[#16a34a]" />
          Examiner score received · real-time
        </div>
      )}

      <section className="mb-[22px] flex animate-krise flex-wrap items-center justify-between gap-6 rounded-[20px] bg-gradient-to-br from-ink to-[#1f2a3a] px-9 py-8 text-white">
        <div>
          <div className="mb-2 text-[12.5px] font-medium text-[#a6cad6]">
            EXAMINER SCORE · {publishedDate}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="font-heading text-[58px] font-bold leading-none">
              {result.overallLevel}
            </div>
            <div>
              <span
                className="mb-1.5 inline-block rounded-full px-[13px] py-1 text-[13px] font-bold text-white"
                style={{ backgroundColor: result.bandColor }}
              >
                {result.bandLabel}
              </span>
              <div className="text-[13.5px] text-ink-faint">
                Average {result.overallScore.toFixed(2)} / {SCORE_SCALE.max} · 6
                ALIKHTIBAR dimensions
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1 text-xs text-ink-faint">Scoring mode</div>
          <div className="text-[15px] font-semibold">ALIKHTIBAR examiner</div>
          <div className="text-xs text-ink-faint">Session {sessionId.slice(0, 8)}…</div>
        </div>
      </section>

      <section className="mb-[22px] grid gap-[22px] md:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-[22px]">
          <div className="mb-1.5 self-start text-[13px] font-semibold text-ink-muted">
            Proficiency Profile
          </div>
          <ExaminerRadarChartClient scores={result.dimensionScores} />
        </div>

        <div className="rounded-2xl border border-border bg-white p-[22px]">
          <div className="mb-3.5 text-[13px] font-semibold text-ink-muted">
            Dimension breakdown
          </div>
          <div className="grid gap-3.5">
            {EXAMINER_DIMENSIONS.map((d) => {
              const score = result.dimensionScores[d.key];
              const b = scoreBand(score);
              const pct = `${Math.round((score / SCORE_SCALE.max) * 100)}%`;
              const note = result.dimensionNotes[d.key];
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
                  {note && (
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-subtle">
                      {note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mb-[18px] rounded-2xl border border-border bg-white p-6">
        <div className="mb-2.5 text-[13px] font-semibold text-ink-muted">
          Examiner feedback
        </div>
        <p className="text-[14.5px] leading-[1.65] text-ink-secondary">
          {result.summary || "—"}
        </p>
      </section>

      <div className="no-print flex items-center gap-2.5 rounded-xl border border-dashed border-primary-fixed-dim bg-[#eef6f8] px-[17px] py-3.5 text-[12.5px] text-ink-subtle">
        <span className="text-primary">🗓</span>
        Test video recordings are deleted automatically after{" "}
        <strong className="text-ink-muted">14 days</strong>. Examiner scores are
        stored permanently.
      </div>
    </main>
  );
}
