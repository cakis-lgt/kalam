import type { SessionResult } from "@/types/database";
import type { TestSessionRow } from "@/lib/dashboard/mock-data";
import type { SessionStatus } from "@/lib/dashboard/mock-data";
import { averageScore, type ExaminerDimensionScores } from "@/lib/examiner/rubric";
import { SCORE_SCALE } from "@/lib/cefr/rubric";

export function scoreLabelFromResult(row: SessionResult): string | undefined {
  if (!row.published_at) return undefined;
  const scores = row.dimension_scores as ExaminerDimensionScores;
  const avg = averageScore(scores);
  if (!Number.isFinite(avg)) return row.overall_level;
  return `${row.overall_level} · ${avg.toFixed(2)}/${SCORE_SCALE.max}`;
}

export function findPrioritySession(
  sessions: TestSessionRow[],
): TestSessionRow | null {
  const order: SessionStatus[] = [
    "in_progress",
    "under_review",
    "awaiting_review",
  ];
  for (const status of order) {
    const found = sessions.find((s) => s.status === status);
    if (found) return found;
  }
  return null;
}

export function countPendingReview(sessions: TestSessionRow[]): number {
  return sessions.filter(
    (s) => s.status === "awaiting_review" || s.status === "under_review",
  ).length;
}

export function latestPublishedLevel(
  sessions: TestSessionRow[],
  fallback: string,
): string {
  const completed = sessions.find((s) => s.status === "completed" && s.scoreLabel);
  if (completed?.scoreLabel) {
    return completed.scoreLabel.split(" · ")[0] ?? completed.level;
  }
  const anyCompleted = sessions.find((s) => s.status === "completed");
  return anyCompleted?.level ?? fallback;
}
