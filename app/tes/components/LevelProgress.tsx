"use client";

import { Check } from "lucide-react";
import { CEFR_LEVELS } from "@/types";
import type { CEFRLevel } from "@/types";
import { levelShortLabel } from "@/lib/cefr/rubric";

type Props = {
  currentLevel: CEFRLevel;
  passedLevels: CEFRLevel[];
};

export function LevelProgress({ currentLevel, passedLevels }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
        Progress Tes
      </div>
      <div className="flex items-center gap-2">
        {CEFR_LEVELS.map((lvl, i) => {
          const passed = passedLevels.includes(lvl);
          const current = lvl === currentLevel;
          return (
            <div key={lvl} className="flex items-center gap-2">
              <div
                className={`flex h-9 min-w-9 items-center justify-center rounded-full px-1 text-xs font-semibold ring-2 ring-offset-2 ${
                  passed
                    ? "bg-emerald-500 text-white ring-emerald-200"
                    : current
                      ? "bg-kalam-600 text-white ring-kalam-200"
                      : "bg-slate-100 text-slate-500 ring-transparent"
                }`}
                title={lvl}
              >
                {passed ? <Check className="h-4 w-4" /> : levelShortLabel(lvl)}
              </div>
              {i < CEFR_LEVELS.length - 1 && (
                <div
                  className={`h-1 w-6 rounded ${
                    passed ? "bg-emerald-300" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
