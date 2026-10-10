"use client";

import type { TestTask } from "@/types";
import { Clock, Globe } from "lucide-react";
import {
  taskPromptDir,
  taskPromptLang,
  taskSpeakingPrompt,
  taskUsesArabicFont,
} from "@/lib/tes/task-prompt";

const FORMAT_LABEL: Record<string, string> = {
  muqaddimah: "Self introduction",
  wasf: "Picture description",
  hiwar: "Conversation roleplay",
  munaqasyah: "Opinion & argumentation",
  custom: "Free topic",
};

export function TaskCard({ task }: { task: TestTask }) {
  const speakingPrompt = taskSpeakingPrompt(task);
  const useArabicFont = taskUsesArabicFont(task);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-kalam-100 px-3 py-1 font-semibold text-kalam-700">
          Level {task.level}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
          {FORMAT_LABEL[task.format] ?? task.format}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
          {task.language === "en" ? "English" : "Arabic"}
        </span>
        <span className="ml-auto flex items-center gap-1 text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          Max {task.durationSec}s
        </span>
      </div>

      {task.language === "ar" && (
        <div className="mb-5 flex items-start gap-2 rounded-lg bg-slate-50 px-4 py-3">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p className="text-sm leading-relaxed text-slate-700">{task.prompt_id}</p>
        </div>
      )}

      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
        Speaking prompt:
      </div>
      <p
        dir={taskPromptDir(task)}
        lang={taskPromptLang(task)}
        className={`text-2xl leading-loose text-slate-900 ${
          useArabicFont ? "font-arabic" : "font-heading"
        }`}
      >
        {speakingPrompt}
      </p>

      {task.image && (
        <div className="mt-4">
          <img
            src={task.image}
            alt="Task image"
            className="w-full rounded-lg border border-slate-200"
          />
        </div>
      )}
    </div>
  );
}
