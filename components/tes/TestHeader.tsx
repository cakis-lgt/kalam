"use client";

import { CefrHeaderProgress } from "./CefrHeaderProgress";
import type { CEFRLevel, TestLanguage } from "@/types";
import { LANGUAGE_LABELS } from "@/lib/tes/task-prompt";

type Props = {
  taskCounter: string;
  testLanguage: TestLanguage;
  currentLevel: CEFRLevel;
  passedLevels: CEFRLevel[];
  onEmergencyStop?: () => void;
};

export function TestHeader({
  taskCounter,
  testLanguage,
  currentLevel,
  passedLevels,
  onEmergencyStop,
}: Props) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border-dark px-7 py-4">
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-[30px] min-w-[30px] items-center justify-center rounded-lg bg-primary px-1.5 text-xs font-bold text-white ${
            testLanguage === "ar" ? "font-arabic text-lg" : "font-heading"
          }`}
        >
          {testLanguage === "ar" ? "ك" : "EN"}
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-ink-faint">{taskCounter}</span>
          <span className="text-[11px] text-ink-subtle">
            {LANGUAGE_LABELS[testLanguage]}
          </span>
        </div>
      </div>

      <CefrHeaderProgress
        currentLevel={currentLevel}
        passedLevels={passedLevels}
      />

      <button
        type="button"
        onClick={onEmergencyStop}
        className="rounded-[9px] border border-[#334155] bg-transparent px-[13px] py-[7px] text-[12.5px] font-medium text-ink-faint transition-colors hover:border-ink-faint hover:text-slate-300"
      >
        End task
      </button>
    </header>
  );
}
