import type { TestLanguage, TestTask } from "@/types";

export const LANGUAGE_LABELS: Record<TestLanguage, string> = {
  ar: "Arabic",
  en: "English",
};

export const LANGUAGE_SHORT: Record<TestLanguage, string> = {
  ar: "AR",
  en: "EN",
};

/** Main speaking prompt in the test target language. */
export function taskSpeakingPrompt(task: TestTask): string {
  if (task.language === "en") {
    return task.prompt_en ?? task.prompt_id;
  }
  return task.prompt_ar;
}

export function taskPromptDir(task: TestTask): "rtl" | "ltr" {
  return task.language === "ar" ? "rtl" : "ltr";
}

export function taskPromptLang(task: TestTask): TestLanguage {
  return task.language;
}

export function taskUsesArabicFont(task: TestTask): boolean {
  return task.language === "ar";
}
