import type { AssessmentResult, CEFRLevel } from "@/types";
import { SCORE_SCALE } from "@/lib/cefr/rubric";
import type { TestTask } from "@/types";

export function isAssessDevMockEnabled(): boolean {
  return process.env.ASSESS_DEV_MOCK === "true";
}

export function mockAssessment(task: TestTask): AssessmentResult {
  const scores = {
    pronunciation: 3.2,
    fluency: 3.0,
    grammar: 2.8,
    vocabulary: 3.1,
    coherence: 3.0,
  };
  const overall =
    Math.round(
      ((scores.pronunciation +
        scores.fluency +
        scores.grammar +
        scores.vocabulary +
        scores.coherence) /
        5) *
        100,
    ) / 100;

  return {
    level: task.level as CEFRLevel,
    scores,
    overall,
    passed: overall >= SCORE_SCALE.passingThreshold,
    strengths_id: [
      "Pelafalan huruf hijaiyah cukup jelas",
      "Percaya diri saat memperkenalkan diri",
    ],
    weaknesses_id: [
      "Perlu latihan harakat dan panjang vokal",
      "Kosa kata masih terbatas",
    ],
    feedback_id:
      "[Demo mode] Answer scored with sample values. Add ANTHROPIC_API_KEY for real AI scoring.",
    examples_correction: [
      {
        user_said: "اسمي",
        should_be: "اِسْمِي",
        why: "Perhatikan harakat kasrah pada mim.",
      },
    ],
  };
}
