import { SCORE_SCALE } from "@/lib/cefr/rubric";

export type ExaminerDimensionKey =
  | "pronunciation"
  | "fluency"
  | "grammar"
  | "vocabulary"
  | "coherence"
  | "interaction";

export type ExaminerDimensionScores = Record<ExaminerDimensionKey, number>;

export const EXAMINER_DIMENSIONS: {
  key: ExaminerDimensionKey;
  name_id: string;
  name_ar: string;
}[] = [
  { key: "pronunciation", name_id: "Pronunciation", name_ar: "النُطْق" },
  { key: "fluency", name_id: "Fluency", name_ar: "الطَلاقَة" },
  { key: "grammar", name_id: "Grammar", name_ar: "القَواعِد" },
  { key: "vocabulary", name_id: "Vocabulary", name_ar: "المُفْرَدات" },
  { key: "coherence", name_id: "Coherence", name_ar: "التَماسُك" },
  { key: "interaction", name_id: "Interaction", name_ar: "التَفاعُل" },
];

export const SCORE_BAND_DESCRIPTORS = [
  {
    n: 0,
    label: "Not assessed",
    d: "No output or not comprehensible.",
  },
  {
    n: 1,
    label: "Well below expectations",
    d: "Barely communicative; major errors across all aspects.",
  },
  {
    n: 2,
    label: "Below expectations",
    d: "Very limited message; significant errors hinder comprehension.",
  },
  {
    n: 3,
    label: "Meets expectations",
    d: "Basic message conveyed; noticeable errors but not fatal.",
  },
  {
    n: 4,
    label: "Above expectations",
    d: "Communicative and natural with minor errors.",
  },
  {
    n: 5,
    label: "Well above expectations",
    d: "Near-native / native-like; accurate and natural.",
  },
] as const;

export function emptyDimensionScores(): ExaminerDimensionScores {
  return {
    pronunciation: -1,
    fluency: -1,
    grammar: -1,
    vocabulary: -1,
    coherence: -1,
    interaction: -1,
  };
}

export function isScoresComplete(scores: ExaminerDimensionScores): boolean {
  return EXAMINER_DIMENSIONS.every(({ key }) => {
    const v = scores[key];
    return Number.isInteger(v) && v >= SCORE_SCALE.min && v <= SCORE_SCALE.max;
  });
}

export function averageScore(scores: ExaminerDimensionScores): number {
  const vals = EXAMINER_DIMENSIONS.map(({ key }) => scores[key]);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
