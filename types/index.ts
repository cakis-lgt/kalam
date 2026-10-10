export const CEFR_LEVELS = [
  "Pre-A1",
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
] as const;

export type CEFRLevel = (typeof CEFR_LEVELS)[number];

export type TestLanguage = "ar" | "en";

export const TEST_LANGUAGES = ["ar", "en"] as const;

export type TaskFormat =
  | "muqaddimah"
  | "wasf"
  | "hiwar"
  | "munaqasyah"
  | "custom";

export type TestTask = {
  id: string;
  language: TestLanguage;
  level: CEFRLevel;
  format: TaskFormat;
  prompt_ar: string;
  /** English prompt text when language is `en`. */
  prompt_en?: string;
  prompt_id: string;
  image?: string;
  durationSec: number;
  preparationSec: number;
};

export type ScoreDimensions = {
  pronunciation: number;
  fluency: number;
  grammar: number;
  vocabulary: number;
  coherence: number;
};

export type AssessmentResult = {
  level: CEFRLevel;
  scores: ScoreDimensions;
  overall: number;
  passed: boolean;
  strengths_id: string[];
  weaknesses_id: string[];
  feedback_id: string;
  examples_correction: {
    user_said: string;
    should_be: string;
    why: string;
  }[];
  /** Score not yet available — awaiting examiner review. */
  pendingManualReview?: boolean;
};

export type TaskAttempt = {
  task: TestTask;
  transcript: string;
  result: AssessmentResult;
  audioDurationSec: number;
};

export type FinalResult = {
  finalLevel: CEFRLevel;
  attempts: TaskAttempt[];
  averageScores: ScoreDimensions;
  overallScore: number;
  summary_id: string;
  recommendations_id: string[];
};

/** Tuple type helper for Zod enum validation. */
export type CEFRLevelEnum = [CEFRLevel, ...CEFRLevel[]];
