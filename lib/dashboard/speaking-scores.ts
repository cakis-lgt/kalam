import type { ExaminerDimensionScores } from "@/lib/examiner/rubric";
import { averageScore } from "@/lib/examiner/rubric";
import { mapSessionResultToView } from "@/lib/results/published-result";
import { formatSessionDate } from "@/lib/sessions/map-session";
import type { TestSessionRow } from "@/lib/dashboard/mock-data";
import type { SessionResult, TestSession } from "@/types/database";
import type { CEFRLevel, TestLanguage } from "@/types";

export type SpeakingScoreStatus =
  | "published"
  | "pending"
  | "in_progress"
  | "none";

export type LanguageSpeakingScore = {
  language: TestLanguage;
  level: CEFRLevel;
  overallScore?: number;
  dimensionScores?: ExaminerDimensionScores;
  sessionUuid?: string;
  dateLabel?: string;
  status: SpeakingScoreStatus;
};

export type SpeakingScoresByLanguage = Record<TestLanguage, LanguageSpeakingScore>;

const LANGUAGES: TestLanguage[] = ["ar", "en"];

function emptyEntry(language: TestLanguage): LanguageSpeakingScore {
  return { language, level: "Pre-A1", status: "none" };
}

function emptyScores(): SpeakingScoresByLanguage {
  return { ar: emptyEntry("ar"), en: emptyEntry("en") };
}

function parseOverallFromLabel(label?: string): number | undefined {
  const match = label?.match(/([\d.]+)\/5/);
  return match ? Number.parseFloat(match[1]) : undefined;
}

function mockDimensions(avg: number): ExaminerDimensionScores {
  return {
    pronunciation: Math.min(5, avg + 0.05),
    fluency: Math.min(5, avg + 0.1),
    grammar: Math.max(0, avg - 0.1),
    vocabulary: avg,
    coherence: Math.min(5, avg + 0.02),
    interaction: Math.max(0, avg - 0.05),
  };
}

function rowLanguage(session: TestSessionRow): TestLanguage {
  return session.language ?? "ar";
}

function sessionLanguage(session: TestSession): TestLanguage {
  return (session.language ??
    session.progress_json?.testLanguage ??
    "ar") as TestLanguage;
}

function statusPriority(status: SpeakingScoreStatus): number {
  if (status === "published") return 4;
  if (status === "pending") return 3;
  if (status === "in_progress") return 2;
  return 1;
}

function pickBetter(
  current: LanguageSpeakingScore,
  next: LanguageSpeakingScore,
): LanguageSpeakingScore {
  return statusPriority(next.status) >= statusPriority(current.status)
    ? next
    : current;
}

export function buildSpeakingScoresFromRows(
  sessions: TestSessionRow[],
): SpeakingScoresByLanguage {
  const scores = emptyScores();

  for (const session of sessions) {
    const language = rowLanguage(session);
    let entry: LanguageSpeakingScore;

    if (session.status === "completed" && session.scoreLabel) {
      const overall =
        parseOverallFromLabel(session.scoreLabel) ??
        averageScore(mockDimensions(4));
      entry = {
        language,
        level: session.level,
        overallScore: overall,
        dimensionScores: mockDimensions(overall),
        sessionUuid: session.sessionUuid,
        dateLabel: session.dateLabel,
        status: "published",
      };
    } else if (
      session.status === "awaiting_review" ||
      session.status === "under_review"
    ) {
      entry = {
        language,
        level: session.level,
        sessionUuid: session.sessionUuid,
        dateLabel: session.dateLabel,
        status: "pending",
      };
    } else if (session.status === "in_progress") {
      entry = {
        language,
        level: session.level,
        sessionUuid: session.sessionUuid,
        dateLabel: session.dateLabel,
        status: "in_progress",
      };
    } else {
      continue;
    }

    scores[language] = pickBetter(scores[language], entry);
  }

  return scores;
}

export function buildSpeakingScoresFromDb(
  sessions: TestSession[],
  results: SessionResult[],
): SpeakingScoresByLanguage {
  const scores = emptyScores();
  const resultBySession = new Map(results.map((r) => [r.session_id, r]));

  for (const session of sessions) {
    const language = sessionLanguage(session);
    const dateLabel = formatSessionDate(session.started_at);
    let entry: LanguageSpeakingScore | null = null;

    if (session.status === "completed") {
      const result = resultBySession.get(session.id);
      const view = result ? mapSessionResultToView(session.id, result) : null;
      if (view) {
        entry = {
          language,
          level: view.overallLevel,
          overallScore: view.overallScore,
          dimensionScores: view.dimensionScores,
          sessionUuid: session.id,
          dateLabel,
          status: "published",
        };
      }
    } else if (
      session.status === "awaiting_review" ||
      session.status === "under_review"
    ) {
      entry = {
        language,
        level: (session.final_level ?? session.current_level) as CEFRLevel,
        sessionUuid: session.id,
        dateLabel,
        status: "pending",
      };
    } else if (session.status === "in_progress") {
      entry = {
        language,
        level: (session.final_level ?? session.current_level) as CEFRLevel,
        sessionUuid: session.id,
        dateLabel,
        status: "in_progress",
      };
    }

    if (entry) {
      scores[language] = pickBetter(scores[language], entry);
    }
  }

  return scores;
}

export async function fetchSpeakingScoresByLanguage(): Promise<SpeakingScoresByLanguage> {
  const { loadCandidateDashboardBundle } = await import(
    "@/lib/dashboard/candidate-bundle"
  );
  const bundle = await loadCandidateDashboardBundle();
  return bundle.speakingScores;
}

export { LANGUAGES as SPEAKING_SCORE_LANGUAGES };
