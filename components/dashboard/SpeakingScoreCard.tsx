import Link from "next/link";
import { Clock, Mic } from "lucide-react";
import { EXAMINER_DIMENSIONS } from "@/lib/examiner/rubric";
import { SCORE_SCALE } from "@/lib/cefr/rubric";
import { cefrSolidClass } from "@/lib/dashboard/cefr-badge";
import {
  SPEAKING_SCORE_LANGUAGES,
  type LanguageSpeakingScore,
  type SpeakingScoresByLanguage,
} from "@/lib/dashboard/speaking-scores";
import { LANGUAGE_LABELS } from "@/lib/tes/task-prompt";

type Props = {
  scores: SpeakingScoresByLanguage;
};

function scoreBandColor(score: number): string {
  if (score >= 4.5) return "#0ea5e9";
  if (score >= 3.5) return "#22c55e";
  if (score >= 2.5) return "#84cc16";
  return "#eab308";
}

function LanguageScorePanel({ score }: { score: LanguageSpeakingScore }) {
  const label = LANGUAGE_LABELS[score.language];
  const isArabic = score.language === "ar";

  if (score.status === "none") {
    return (
      <div className="flex h-full flex-col rounded-[14px] border border-dashed border-border-light bg-white px-5 py-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
            {isArabic ? "AR" : "EN"}
          </span>
          <span className="text-[14px] font-semibold text-ink">{label}</span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <Mic className="mb-3 h-8 w-8 text-ink-faint" aria-hidden />
          <p className="text-[14px] font-medium text-ink-muted">Not assessed yet</p>
          <p className="mt-1 max-w-[220px] text-[12.5px] text-ink-faint">
            Take an official {label.toLowerCase()} speaking test to receive your
            ALIKHTIBAR score.
          </p>
        </div>
        <Link
          href={`/tes?lang=${score.language}`}
          className="mt-2 inline-flex justify-center rounded-[10px] border border-border-light bg-surface-container px-4 py-2.5 text-[13px] font-semibold text-ink-muted hover:bg-white"
        >
          Start {label} Test
        </Link>
      </div>
    );
  }

  if (score.status === "pending") {
    return (
      <div className="flex h-full flex-col rounded-[14px] border border-[#fde68a] bg-[#fef9ec] px-5 py-5">
        <PanelHeader score={score} label={label} isArabic={isArabic} />
        <div className="mt-4 flex flex-1 flex-col justify-center">
          <div className="flex items-end gap-3">
            <span
              className={`font-heading text-[42px] font-bold leading-none text-ink ${isArabic ? "font-arabic" : ""}`}
            >
              {score.level}
            </span>
            <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#fef3c7] px-2.5 py-1 text-[11.5px] font-semibold text-[#b45309]">
              <Clock className="h-3 w-3" aria-hidden />
              Awaiting examiner
            </span>
          </div>
          <p className="mt-3 text-[13px] text-ink-muted">
            Your recording is in the examiner queue. Scores usually appear within
            5–15 minutes.
          </p>
        </div>
        {score.sessionUuid && (
          <Link
            href={`/tes/${score.sessionUuid}/waiting`}
            className="mt-4 inline-flex justify-center rounded-[10px] border border-[#fcd34d] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#b45309] hover:bg-[#fffbeb]"
          >
            View scoring status
          </Link>
        )}
      </div>
    );
  }

  if (score.status === "in_progress") {
    return (
      <div className="flex h-full flex-col rounded-[14px] border border-[#b8dce6] bg-[#eef6f8] px-5 py-5">
        <PanelHeader score={score} label={label} isArabic={isArabic} />
        <div className="mt-4 flex flex-1 flex-col justify-center">
          <div className="font-heading text-[42px] font-bold leading-none text-[#156c84]">
            {score.level}
          </div>
          <p className="mt-3 text-[13px] text-ink-muted">
            Test in progress — finish all tasks before starting a new session.
          </p>
        </div>
        <Link
          href={
            score.sessionUuid
              ? `/tes?session=${score.sessionUuid}`
              : "/tes"
          }
          className="mt-4 inline-flex justify-center rounded-[10px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-on-primary hover:bg-kalam-600"
        >
          Continue test
        </Link>
      </div>
    );
  }

  const overall = score.overallScore ?? 0;
  const bandColor = scoreBandColor(overall);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-gradient-to-br from-[#0f1c24] via-[#122530] to-[#0c161d] px-5 py-5 text-white">
      <PanelHeader score={score} label={label} isArabic={isArabic} dark />
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex items-end gap-3">
          <span className="font-heading text-[46px] font-bold leading-none">
            {score.level}
          </span>
          <div className="mb-1">
            <span
              className="inline-block rounded-full px-2.5 py-1 text-[11.5px] font-bold text-white"
              style={{ backgroundColor: bandColor }}
            >
              {overall.toFixed(2)} / {SCORE_SCALE.max}
            </span>
            <div className="mt-1 text-[11px] text-slate-400">
              Published {score.dateLabel}
            </div>
          </div>
        </div>
      </div>

      {score.dimensionScores && (
        <div className="mt-5 grid gap-2">
          {EXAMINER_DIMENSIONS.map((dim) => {
            const value = score.dimensionScores![dim.key];
            const pct = Math.round((value / SCORE_SCALE.max) * 100);
            return (
              <div key={dim.key}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{dim.name_id}</span>
                  <span className="font-medium text-slate-400">
                    {value.toFixed(1)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-teal-400/80 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {score.sessionUuid && (
        <Link
          href={`/hasil?session=${score.sessionUuid}`}
          className="mt-5 inline-flex justify-center rounded-[10px] border border-white/15 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-white/15"
        >
          View full results
        </Link>
      )}
    </div>
  );
}

function PanelHeader({
  score,
  label,
  isArabic,
  dark = false,
}: {
  score: LanguageSpeakingScore;
  label: string;
  isArabic: boolean;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
            dark
              ? "bg-white/10 text-teal-200"
              : `${cefrSolidClass(score.level)} text-white`
          }`}
        >
          {isArabic ? "AR" : "EN"}
        </span>
        <span
          className={`text-[14px] font-semibold ${dark ? "text-slate-100" : "text-ink"}`}
        >
          {label} Speaking
        </span>
      </div>
      {score.dateLabel && score.status !== "published" && (
        <span className="text-[11px] text-ink-faint">{score.dateLabel}</span>
      )}
    </div>
  );
}

export function SpeakingScoreCard({ scores }: Props) {
  return (
    <section className="mb-[30px]">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-muted">Speaking Scores</h2>
        <span className="text-[12px] text-ink-faint">
          Arabic &amp; English · ALIKHTIBAR rubric
        </span>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        {SPEAKING_SCORE_LANGUAGES.map((lang) => (
          <LanguageScorePanel key={lang} score={scores[lang]} />
        ))}
      </div>
    </section>
  );
}
