import type { SessionStatus } from "@/types/database";

export function sessionStatusLabel(status: SessionStatus): string {
  switch (status) {
    case "awaiting_review":
      return "Awaiting claim";
    case "under_review":
      return "Under review";
    case "completed":
      return "Scoring complete";
    case "in_progress":
      return "In progress";
    default:
      return status;
  }
}

export function sessionStatusStyle(status: SessionStatus): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case "awaiting_review":
      return { bg: "#fef3c7", text: "#92400e", dot: "#ca8a04" };
    case "under_review":
      return { bg: "#eef6ee", text: "#16a34a", dot: "#16a34a" };
    case "completed":
      return { bg: "#e0f2fe", text: "#0369a1", dot: "#0ea5e9" };
    default:
      return { bg: "#f1f5f9", text: "#64748b", dot: "#94a3b8" };
  }
}
