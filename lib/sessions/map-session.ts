import type { SessionStatus, TestSession } from "@/types/database";
import type { TestSessionRow } from "@/lib/dashboard/mock-data";
import type { CEFRLevel, TestLanguage } from "@/types";

export function formatSessionDisplayId(id: string): string {
  return `KAL-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function formatSessionDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function mapSessionToRow(
  session: TestSession,
  extras?: {
    scoreLabel?: string;
    taskCount?: number;
    recordingCount?: number;
  },
): TestSessionRow {
  const progress = session.progress_json?.attempts?.length ?? 0;
  const totalEstimate = 2;

  return {
    id: formatSessionDisplayId(session.id),
    sessionUuid: session.id,
    dateLabel: formatSessionDate(session.started_at),
    language: (session.language ??
      session.progress_json?.testLanguage ??
      "ar") as TestLanguage,
    level: (session.final_level ?? session.current_level) as CEFRLevel,
    status: session.status as SessionStatus,
    scoreLabel: extras?.scoreLabel,
    taskCount: extras?.taskCount,
    recordingCount: extras?.recordingCount,
    progressPercent:
      session.status === "in_progress"
        ? Math.min(99, Math.round((progress / totalEstimate) * 100))
        : undefined,
  };
}
