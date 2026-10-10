"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Mic, RefreshCw } from "lucide-react";
import type { CEFRLevel, TestLanguage } from "@/types";
import { CEFR_LEVELS } from "@/types";
import { cefrSolidClass } from "@/lib/dashboard/cefr-badge";
import {
  FORMAT_LABELS,
  levelsWithPractice,
  practiceTaskCount,
  primaryPromptText,
  PRACTICE_DIMENSIONS,
  shufflePracticePromptsForLevel,
} from "@/lib/dashboard/practice-prompts";
import { LANGUAGE_SHORT } from "@/lib/tes/task-prompt";

type Props = {
  suggestedLevel: CEFRLevel;
};

export function PracticeHub({ suggestedLevel }: Props) {
  const [language, setLanguage] = useState<TestLanguage>("ar");
  const [level, setLevel] = useState<CEFRLevel>(suggestedLevel);
  const [promptSeed, setPromptSeed] = useState(0);

  const availableLevels = useMemo(
    () => levelsWithPractice(language),
    [language],
  );

  const activeLevel = availableLevels.includes(level)
    ? level
    : (availableLevels[0] ?? "Pre-A1");

  const prompts = useMemo(
    () => shufflePracticePromptsForLevel(activeLevel, language, 4),
    [activeLevel, language, promptSeed],
  );

  function switchLanguage(next: TestLanguage) {
    setLanguage(next);
    const levels = levelsWithPractice(next);
    if (!levels.includes(level)) {
      setLevel(levels.includes(suggestedLevel) ? suggestedLevel : levels[0]);
    }
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[16px] border border-[#1e3a47] bg-gradient-to-br from-[#0f1c24] via-[#122530] to-[#0c161d] px-6 py-7 text-slate-100">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-teal-200/90">
            <Mic className="h-3.5 w-3.5" aria-hidden />
            Self-paced rehearsal
          </div>
          <h2 className="font-heading text-[22px] font-semibold">
            Practice speaking before your official test
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-400">
            Rehearse sample ALIKHTIBAR prompts aloud. Practice sessions are not
            recorded or scored — use them to build confidence with timing and
            structure.
          </p>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink-muted">Language</h3>
        <div className="flex flex-wrap gap-2">
          {(["ar", "en"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => switchLanguage(lang)}
              className={`rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                language === lang
                  ? "bg-primary text-on-primary"
                  : "border border-border-light bg-white text-ink-muted hover:bg-surface-container"
              }`}
            >
              {LANGUAGE_SHORT[lang]}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink-muted">
          Target level
        </h3>
        <div className="flex flex-wrap gap-2">
          {CEFR_LEVELS.map((lvl) => {
            const count = practiceTaskCount(lvl, language);
            if (count === 0) return null;
            const active = activeLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-all ${
                  active
                    ? `${cefrSolidClass(lvl)} text-white shadow-sm`
                    : "border border-border-light bg-white text-ink-muted hover:bg-surface-container"
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12.5px] text-ink-faint">
          {practiceTaskCount(activeLevel, language)} sample prompts available at{" "}
          {activeLevel} · {LANGUAGE_SHORT[language]}
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink-muted">Sample prompts</h3>
          <button
            type="button"
            onClick={() => setPromptSeed((n) => n + 1)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Shuffle view
          </button>
        </div>

        <div className="grid gap-3">
          {prompts.map((task, index) => (
            <article
              key={task.id}
              className="rounded-[14px] border border-border bg-white p-5"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold text-white ${cefrSolidClass(task.level)}`}
                >
                  {task.level}
                </span>
                <span className="rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                  {FORMAT_LABELS[task.format]}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
                  <Clock className="h-3 w-3" aria-hidden />
                  {task.preparationSec}s prep · {task.durationSec}s speak
                </span>
              </div>

              <p
                className={`text-[15px] font-medium leading-relaxed text-ink ${
                  task.language === "ar" ? "font-arabic text-right" : ""
                }`}
                dir={task.language === "ar" ? "rtl" : "ltr"}
                lang={task.language === "ar" ? "ar" : "en"}
              >
                {primaryPromptText(task)}
              </p>
              {task.prompt_id && task.language === "ar" && (
                <p className="mt-2 text-[13px] leading-relaxed text-ink-subtle">
                  {task.prompt_id}
                </p>
              )}

              <div className="mt-4 rounded-lg border border-dashed border-border-light bg-[#f8fafb] px-3.5 py-2.5 text-[12.5px] text-ink-muted">
                <strong className="text-ink-muted">Tip:</strong> Prepare for{" "}
                {task.preparationSec} seconds, then speak for up to{" "}
                {task.durationSec} seconds. Practice {index + 1} of{" "}
                {prompts.length} at this level.
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-ink-muted">
          ALIKHTIBAR dimensions to focus on
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {PRACTICE_DIMENSIONS.map((dim) => (
            <div
              key={dim.key}
              className="rounded-[14px] border border-border bg-white px-4 py-3.5"
            >
              <div className="text-[13.5px] font-semibold text-ink">
                {dim.name_id}
                <span className="ml-2 font-arabic text-[12px] font-normal text-ink-faint">
                  {dim.name_ar}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-subtle">
                {dim.description_id}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col items-start justify-between gap-4 rounded-[14px] border border-primary/20 bg-[#eef6f8] px-5 py-4 sm:flex-row sm:items-center">
        <div>
          <div className="text-[14px] font-semibold text-primary">
            Ready for an official scored test?
          </div>
          <p className="mt-0.5 text-[13px] text-ink-subtle">
            Official sessions are recorded and reviewed by a certified examiner.
          </p>
        </div>
        <Link
          href={`/tes?lang=${language}`}
          className="shrink-0 rounded-[10px] bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-on-primary hover:bg-kalam-600"
        >
          Start Official Test
        </Link>
      </div>
    </div>
  );
}
