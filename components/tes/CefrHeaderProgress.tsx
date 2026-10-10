import type { CEFRLevel } from "@/types";
import { CEFR_LEVELS } from "@/types";

type Props = {
  currentLevel: CEFRLevel;
  passedLevels: CEFRLevel[];
};

function pipStyle(level: CEFRLevel, current: CEFRLevel, passed: CEFRLevel[]) {
  const idx = CEFR_LEVELS.indexOf(level);
  const currentIdx = CEFR_LEVELS.indexOf(current);
  const isPassed = passed.includes(level) || idx < currentIdx;
  const isCurrent = level === current;

  if (isCurrent) {
    return {
      fill: "#156c84",
      ring: "#9fd2de",
      txt: "#9fd2de",
      line: "#475569",
    };
  }
  if (isPassed) {
    return {
      fill: "#22c55e",
      ring: "#22c55e",
      txt: "#64748b",
      line: "#334155",
    };
  }
  return {
    fill: "#334155",
    ring: "#475569",
    txt: "#475569",
    line: "#25303f",
  };
}

export function CefrHeaderProgress({ currentLevel, passedLevels }: Props) {
  const visibleLevels = CEFR_LEVELS.filter((l) => l !== "Pre-A1");

  return (
    <div className="hidden items-center gap-[7px] md:flex">
      {visibleLevels.map((level, i) => {
        const style = pipStyle(level, currentLevel, passedLevels);
        const isLast = i === visibleLevels.length - 1;
        return (
          <div key={level} className="flex items-center gap-[7px]">
            <div className="flex flex-col items-center gap-1">
              <div
                className="h-[11px] w-[11px] rounded-full border-2"
                style={{ backgroundColor: style.fill, borderColor: style.ring }}
              />
              <span
                className="text-[10.5px] font-semibold"
                style={{ color: style.txt }}
              >
                {level}
              </span>
            </div>
            {!isLast && (
              <div
                className="mb-3.5 h-0.5 w-[18px]"
                style={{ backgroundColor: style.line }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
