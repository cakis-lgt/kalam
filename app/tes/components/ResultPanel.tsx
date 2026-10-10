"use client";

import type { AssessmentResult } from "@/types";
import { DIMENSIONS, scoreBand, SCORE_SCALE } from "@/lib/cefr/rubric";
import { CheckCircle2, XCircle, ArrowRight, Clock } from "lucide-react";

type Props = {
  result: AssessmentResult;
  onContinue: () => void;
  continueLabel?: string;
};

export function ResultPanel({
  result,
  onContinue,
  continueLabel = "Continue",
}: Props) {
  if (result.pendingManualReview) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recording saved
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {result.feedback_id}
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <span className="font-medium">Awaiting examiner review.</span>{" "}
            Your score and feedback will appear after the examiner finishes
            reviewing your response manually.
          </div>
        </div>

        <button
          onClick={onContinue}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-kalam-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-kalam-700"
        >
          {continueLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const band = scoreBand(result.overall);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-sm text-slate-500">Level {result.level} score</div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-slate-900">
              {result.overall.toFixed(2)}
            </span>
            <span className="text-sm text-slate-500">/ {SCORE_SCALE.max.toFixed(2)}</span>
          </div>
          <span
            className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: band.color }}
          >
            {band.label}
          </span>
        </div>
        <div className="text-right">
          {result.passed ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
              <span className="font-semibold">Passed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              <span className="font-semibold">Not passed</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {DIMENSIONS.map((d) => {
          const score = result.scores[d.key];
          const b = scoreBand(score);
          return (
            <div
              key={d.key}
              className="rounded-lg border border-slate-200 p-3 text-center"
            >
              <div className="text-xs text-slate-500">{d.name_id}</div>
              <div
                className="my-1 text-xl font-bold"
                style={{ color: b.color }}
              >
                {score.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Notes
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          {result.feedback_id}
        </p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        {result.strengths_id.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Strengths
            </div>
            <ul className="space-y-1 text-sm text-slate-700">
              {result.strengths_id.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-emerald-500">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.weaknesses_id.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
              Areas to improve
            </div>
            <ul className="space-y-1 text-sm text-slate-700">
              {result.weaknesses_id.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-500">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {result.examples_correction.length > 0 && (
        <div className="mb-6 rounded-lg border border-slate-200 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Correction examples
          </div>
          <div className="space-y-3">
            {result.examples_correction.map((ex, i) => (
              <div key={i} className="text-sm">
                <div className="text-red-600 line-through" dir="rtl" lang="ar">
                  {ex.user_said}
                </div>
                <div className="text-emerald-700" dir="rtl" lang="ar">
                  {ex.should_be}
                </div>
                <div className="mt-1 text-xs text-slate-500">{ex.why}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-kalam-600 px-5 py-3 font-medium text-white shadow-sm hover:bg-kalam-700"
      >
        {continueLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
