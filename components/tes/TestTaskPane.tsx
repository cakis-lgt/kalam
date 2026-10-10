"use client";

import type { TestTask } from "@/types";
import {
  taskPromptDir,
  taskPromptLang,
  taskSpeakingPrompt,
  taskUsesArabicFont,
} from "@/lib/tes/task-prompt";
import {
  FORMAT_LABEL_ID,
} from "@/lib/tes/format-labels";

type Props = {
  task: TestTask;
  taskIndex: number;
};

export function TestTaskPane({ task, taskIndex }: Props) {
  const formatLabel = FORMAT_LABEL_ID[task.format] ?? task.format;
  const speakingPrompt = taskSpeakingPrompt(task);
  const useArabicFont = taskUsesArabicFont(task);

  return (
    <section className="flex flex-col justify-center px-7 py-12 md:px-14 lg:px-14">
      <div className="inline-flex w-fit items-center gap-2 rounded-full bg-test-surface px-[13px] py-1.5 text-xs font-semibold text-primary-fixed-dim">
        {formatLabel} · {task.level} · {task.language === "en" ? "English" : "Arabic"}
      </div>

      <h1
        dir={taskPromptDir(task)}
        lang={taskPromptLang(task)}
        className={`mt-[26px] text-arabic-display text-slate-50 ${
          useArabicFont ? "font-arabic" : "font-heading text-[2rem] leading-snug"
        }`}
      >
        {speakingPrompt}
      </h1>

      {task.prompt_id && task.language === "ar" && (
        <p className="mt-6 max-w-[520px] text-[17px] leading-[1.6] text-ink-faint">
          {task.prompt_id}
        </p>
      )}

      {task.image && (
        <div className="mt-7 max-w-[520px] overflow-hidden rounded-[14px] border border-[#2e3a4a] bg-test-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={task.image}
            alt="Task image"
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      {!task.image && task.format === "wasf" && (
        <div className="mt-7 flex h-[200px] max-w-[520px] items-center justify-center gap-2.5 rounded-[14px] border border-[#2e3a4a] bg-test-surface text-[13px] text-ink-subtle">
          <span className="text-[30px]">🖼️</span>
          Image to describe
        </div>
      )}
    </section>
  );
}
