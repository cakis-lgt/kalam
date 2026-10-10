import { CEFR_LEVELS, type CEFRLevel } from "@/types";

function levelIndex(level: string): number {
  const idx = CEFR_LEVELS.indexOf(level as CEFRLevel);
  return idx >= 0 ? idx : 0;
}

/** Whether examiner focus range (e.g. "A1 – B1") covers target level. */
export function focusCovers(focus: string, target: CEFRLevel): boolean {
  const parts = focus.replace(/\s/g, "").split(/[–-]/);
  if (parts.length < 2) return true;
  const a = levelIndex(parts[0]);
  const b = levelIndex(parts[1]);
  const t = levelIndex(target);
  return t >= Math.min(a, b) && t <= Math.max(a, b);
}
