import { EXAMINER_DIMENSIONS } from "@/lib/examiner/rubric";
import { averageScore } from "@/lib/examiner/rubric";
import type { ExaminerDimensionScores } from "@/lib/examiner/rubric";
import type { SessionResult } from "@/types/database";
import type { CEFRLevel } from "@/types";

export type PublishedResultView = {
  sessionId: string;
  overallLevel: CEFRLevel;
  dimensionScores: ExaminerDimensionScores;
  dimensionNotes: Record<string, string>;
  summary: string;
  publishedAt: string;
  overallScore: number;
  bandLabel: string;
  bandColor: string;
  source: "examiner";
};

function scoreBand(avg: number): { label: string; color: string } {
  if (avg >= 4.5) return { label: "Sangat Baik", color: "#0ea5e9" };
  if (avg >= 3.5) return { label: "Baik", color: "#22c55e" };
  if (avg >= 2.5) return { label: "Memadai", color: "#84cc16" };
  return { label: "Perlu Peningkatan", color: "#eab308" };
}

export function mapSessionResultToView(
  sessionId: string,
  row: SessionResult,
): PublishedResultView | null {
  if (!row.published_at) return null;

  const dimensionScores = row.dimension_scores as ExaminerDimensionScores;
  const complete = EXAMINER_DIMENSIONS.every(({ key }) => {
    const v = dimensionScores[key];
    return typeof v === "number" && v >= 0;
  });
  if (!complete) return null;

  const overallScore = averageScore(dimensionScores);
  const band = scoreBand(overallScore);

  return {
    sessionId,
    overallLevel: row.overall_level as CEFRLevel,
    dimensionScores,
    dimensionNotes: (row.dimension_notes as Record<string, string>) ?? {},
    summary: row.summary ?? "",
    publishedAt: row.published_at,
    overallScore: Math.round(overallScore * 100) / 100,
    bandLabel: band.label,
    bandColor: band.color,
    source: "examiner",
  };
}
