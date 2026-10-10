import { TASK_BANK } from "@/lib/cefr/tasks";
import { DIMENSIONS } from "@/lib/cefr/rubric";
import type { CEFRLevel, TaskFormat, TestLanguage, TestTask } from "@/types";
import { CEFR_LEVELS } from "@/types";

export const FORMAT_LABELS: Record<TaskFormat, string> = {
  muqaddimah: "Introduction",
  wasf: "Description",
  hiwar: "Dialogue",
  munaqasyah: "Discussion",
  custom: "Custom",
};

export function practicePromptsForLevel(
  level: CEFRLevel,
  language: TestLanguage,
  limit = 4,
): TestTask[] {
  return TASK_BANK.filter((t) => t.level === level && t.language === language).slice(
    0,
    limit,
  );
}

export function shufflePracticePromptsForLevel(
  level: CEFRLevel,
  language: TestLanguage,
  limit = 4,
): TestTask[] {
  const all = TASK_BANK.filter(
    (t) => t.level === level && t.language === language,
  );
  return [...all].sort(() => Math.random() - 0.5).slice(0, limit);
}

export function practiceTaskCount(
  level: CEFRLevel,
  language: TestLanguage,
): number {
  return TASK_BANK.filter((t) => t.level === level && t.language === language)
    .length;
}

export function levelsWithPractice(language: TestLanguage): CEFRLevel[] {
  return CEFR_LEVELS.filter((level) => practiceTaskCount(level, language) > 0);
}

export function primaryPromptText(task: TestTask): string {
  if (task.language === "en") {
    return task.prompt_en?.trim() || task.prompt_id;
  }
  return task.prompt_ar?.trim() || task.prompt_id;
}

export { DIMENSIONS as PRACTICE_DIMENSIONS };
