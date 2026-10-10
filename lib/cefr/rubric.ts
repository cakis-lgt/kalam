import type { CEFRLevel } from "@/types";

export type RubricDimension = {
  key: "pronunciation" | "fluency" | "grammar" | "vocabulary" | "coherence";
  name_id: string;
  name_ar: string;
  description_id: string;
};

export const DIMENSIONS: RubricDimension[] = [
  {
    key: "pronunciation",
    name_id: "Pronunciation",
    name_ar: "النُطْق",
    description_id:
      "Phoneme clarity, stress, rhythm, and natural intonation.",
  },
  {
    key: "fluency",
    name_id: "Fluency",
    name_ar: "الطَلاقَة",
    description_id:
      "Speaking flow, minimal excessive pauses, hesitation, and natural pace.",
  },
  {
    key: "grammar",
    name_id: "Grammar",
    name_ar: "القَواعِد",
    description_id:
      "Accuracy of morphology, syntax, sentence structures, and agreement.",
  },
  {
    key: "vocabulary",
    name_id: "Vocabulary",
    name_ar: "المُفْرَدات",
    description_id:
      "Word variety and accuracy, use of idioms, and register (formal vs informal).",
  },
  {
    key: "coherence",
    name_id: "Coherence",
    name_ar: "التَماسُك",
    description_id:
      "Logical flow, use of connectors and discourse markers, and relevance to the topic.",
  },
];

export const LEVEL_DESCRIPTORS: Record<
  CEFRLevel,
  { label_id: string; canDo_id: string[]; canDo_ar: string }
> = {
  "Pre-A1": {
    label_id: "Pre-Beginner (Qabla al-Mubtadi')",
    canDo_id: [
      "Pronounce very basic words (greetings, numbers, colors) with assistance.",
      "State own name and familiar single words.",
      "Understand very simple instructions with gestures or repetition.",
    ],
    canDo_ar:
      "يستطيع نطق كلمات أساسية جداً (تحية، أرقام) وذكر اسمه بمساعدة.",
  },
  A1: {
    label_id: "Beginner (Mubtadi')",
    canDo_id: [
      "Introduce self (name, origin, age, simple hobbies).",
      "Use short sentences with basic vocabulary.",
      "Answer personal questions with short words or phrases.",
    ],
    canDo_ar:
      "يستطيع التعريف بنفسه واستخدام جمل بسيطة جداً للتعبير عن المعلومات الشخصية.",
  },
  A2: {
    label_id: "Elementary (Asasi)",
    canDo_id: [
      "Describe daily routines, family, and surroundings.",
      "Communicate in simple situations (shopping, directions).",
      "Use past and present tenses with limited vocabulary.",
    ],
    canDo_ar:
      "يستطيع وصف الأنشطة اليومية والتواصل في المواقف البسيطة المعتادة.",
  },
  B1: {
    label_id: "Intermediate (Mutawassith)",
    canDo_id: [
      "Narrate experiences, dreams, and plans with brief explanations.",
      "Give reasons and opinions on familiar topics.",
      "Handle most situations when speaking with native or fluent speakers of the target language.",
    ],
    canDo_ar:
      "يستطيع سرد الخبرات وإبداء الرأي بأسلوب متماسك حول الموضوعات المألوفة.",
  },
  B2: {
    label_id: "Upper Intermediate (Mutaqaddim)",
    canDo_id: [
      "Interact spontaneously and naturally with native speakers.",
      "Explain viewpoints on current topics with arguments.",
      "Give detailed descriptions on a wide range of topics.",
    ],
    canDo_ar:
      "يستطيع التفاعل بطلاقة وعفوية مع الناطقين الأصليين وعرض وجهات النظر بأدلة.",
  },
  C1: {
    label_id: "Advanced (Mutqin)",
    canDo_id: [
      "Express complex ideas flexibly and effectively.",
      "Use language for social, academic, and professional purposes.",
      "Construct long, structured, and coherent arguments.",
    ],
    canDo_ar:
      "يستطيع التعبير عن الأفكار المعقدة بمرونة وفعالية في السياقات الأكاديمية والمهنية.",
  },
  C2: {
    label_id: "Proficient (Mutamakkin)",
    canDo_id: [
      "Speak like a native speaker, with subtle nuances of meaning.",
      "Manage extended discourse with full control of idioms and register.",
      "Deliver complex speeches with near-perfect semantic and phonetic control.",
    ],
    canDo_ar:
      "يستطيع التحدث بطلاقة تامة كأنه ناطق أصلي مع تحكم دقيق في الفروق الدلالية.",
  },
};

export const SCORE_SCALE = {
  min: 0,
  max: 5,
  passingThreshold: 3.5,
};

export const SCORE_BANDS = [
  { min: 0, max: 1.5, label: "Insufficient", color: "#dc2626" },
  { min: 1.5, max: 2.5, label: "Developing", color: "#f97316" },
  { min: 2.5, max: 3.0, label: "Approaching Adequate", color: "#eab308" },
  { min: 3.0, max: 3.5, label: "Adequate", color: "#84cc16" },
  { min: 3.5, max: 4.5, label: "Good", color: "#22c55e" },
  { min: 4.5, max: 5.01, label: "Excellent", color: "#0ea5e9" },
];

export function scoreBand(score: number) {
  return (
    SCORE_BANDS.find((b) => score >= b.min && score < b.max) ?? SCORE_BANDS[0]
  );
}

/** Short label for stepper progress (Pre-A1 → "Pre"). */
export function levelShortLabel(level: CEFRLevel): string {
  return level === "Pre-A1" ? "Pre" : level;
}
