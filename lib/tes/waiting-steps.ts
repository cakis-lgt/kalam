import type { SessionStatus } from "@/types/database";

export type WaitStepItem = {
  label: string;
  icon: string;
  bg: string;
  color: string;
  txtColor: string;
  spin: boolean;
};

const STEPS = [
  "Recording received & queued",
  "Examiner reviewing responses",
  "Compiling final score",
] as const;

/** Derive active step index (0–2) from session status. */
export function waitStepIndexFromStatus(status: SessionStatus): number {
  switch (status) {
    case "awaiting_review":
      return 1;
    case "under_review":
      return 2;
    case "completed":
      return 3;
    default:
      return 0;
  }
}

function stepState(
  index: number,
  activeThrough: number,
): Omit<WaitStepItem, "label"> {
  const done = activeThrough > index;
  const active = activeThrough === index;

  if (done) {
    return {
      icon: "✓",
      bg: "#dcf4ee",
      color: "#16a34a",
      txtColor: "#334155",
      spin: false,
    };
  }
  if (active) {
    return {
      icon: String(index + 1),
      bg: "#d6ebf0",
      color: "#156c84",
      txtColor: "#334155",
      spin: true,
    };
  }
  return {
    icon: String(index + 1),
    bg: "#e4eaf1",
    color: "#94a3b8",
    txtColor: "#94a3b8",
    spin: false,
  };
}

export function buildWaitSteps(activeThrough: number): WaitStepItem[] {
  return STEPS.map((label, i) => ({
    label,
    ...stepState(i, activeThrough),
  }));
}

export function isTerminalWaitingStatus(status: SessionStatus): boolean {
  return status === "completed";
}
