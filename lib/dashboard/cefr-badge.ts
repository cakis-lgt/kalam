import type { CEFRLevel } from "@/types";

const CEFR_BADGE: Record<CEFRLevel, string> = {
  "Pre-A1": "bg-cefr-pre-a1/10 text-cefr-pre-a1",
  A1: "bg-cefr-a1/10 text-cefr-a1",
  A2: "bg-cefr-a2/10 text-cefr-a2",
  B1: "bg-cefr-b1/10 text-cefr-b1",
  B2: "bg-cefr-b2/10 text-cefr-b2",
  C1: "bg-cefr-c1/10 text-cefr-c1",
  C2: "bg-cefr-c2/10 text-cefr-c2",
};

const CEFR_SOLID: Record<CEFRLevel, string> = {
  "Pre-A1": "bg-cefr-pre-a1",
  A1: "bg-cefr-a1",
  A2: "bg-cefr-a2",
  B1: "bg-cefr-b1",
  B2: "bg-cefr-b2",
  C1: "bg-cefr-c1",
  C2: "bg-cefr-c2",
};

export function cefrBadgeClass(level: CEFRLevel): string {
  return CEFR_BADGE[level];
}

export function cefrSolidClass(level: CEFRLevel): string {
  return CEFR_SOLID[level];
}
