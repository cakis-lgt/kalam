import type { TaskFormat } from "@/types";
import type { CEFRLevel } from "@/types";

export const FORMAT_LABEL_ID: Record<TaskFormat, string> = {
  muqaddimah: "Self introduction",
  wasf: "Picture description",
  hiwar: "Conversation roleplay",
  munaqasyah: "Opinion & argumentation",
  custom: "Free topic",
};

export const FORMAT_LABEL_AR: Record<TaskFormat, string> = {
  muqaddimah: "التعريف بالنفس",
  wasf: "وصف الصورة",
  hiwar: "حوار / Roleplay",
  munaqasyah: "مناقشة / الرأي",
  custom: "موضوع حر",
};

export const LEVEL_LABEL_AR: Partial<Record<CEFRLevel, string>> = {
  "Pre-A1": "ما قبل A1",
  A1: "A1 مبتدئ",
  A2: "A2 أساسي",
  B1: "B1 متوسط",
  B2: "B2 فوق المتوسط",
  C1: "C1 متقدم",
  C2: "C2 متمكن",
};

export const FORMAT_TIP_ID: Record<TaskFormat, string> = {
  muqaddimah:
    "Use short, clear sentences. Introduce yourself naturally with basic vocabulary.",
  wasf:
    "Focus on spatial and descriptive language to enrich your picture description.",
  hiwar:
    "Simulate natural dialogue — pay attention to turn-taking and context-appropriate responses.",
  munaqasyah:
    "Structure your argument: opinion → reason → example. Use clear linking words.",
  custom:
    "Organize your ideas before speaking. Use a clear opening, body, and closing.",
};

export function taskTitleId(format: TaskFormat, taskIndex: number): string {
  return `Task ${taskIndex}: ${FORMAT_LABEL_ID[format]}`;
}

export function taskTitleAr(format: TaskFormat, taskIndex: number): string {
  return `المهمة ${taskIndex}: ${FORMAT_LABEL_AR[format]}`;
}
