import type { AssessmentResult, CEFRLevel } from "@/types";
import type { TestTask } from "@/types";

/** Penilaian otomatis AI (transkrip + assess + finalize). Default: mati. */
export function isAiScoringEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_SCORING_ENABLED === "true";
}

export function pendingManualReviewResult(task: TestTask): AssessmentResult {
  return {
    level: task.level as CEFRLevel,
    scores: {
      pronunciation: 0,
      fluency: 0,
      grammar: 0,
      vocabulary: 0,
      coherence: 0,
    },
    overall: 0,
    passed: false,
    strengths_id: [],
    weaknesses_id: [],
    feedback_id:
      "Your recording has been saved. An examiner will score it manually.",
    examples_correction: [],
    pendingManualReview: true,
  };
}
