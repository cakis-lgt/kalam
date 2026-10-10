import type { SessionStatus } from "@/lib/dashboard/mock-data";

const CONFIG: Record<
  SessionStatus,
  { label: string; bg: string; color: string; animate?: boolean }
> = {
  completed: {
    label: "Completed",
    bg: "#eef6ee",
    color: "#16a34a",
  },
  awaiting_review: {
    label: "Awaiting examiner",
    bg: "#fef9ec",
    color: "#d97706",
    animate: true,
  },
  under_review: {
    label: "Under review",
    bg: "#eef6f8",
    color: "#156c84",
    animate: true,
  },
  in_progress: {
    label: "In progress",
    bg: "#eef6f8",
    color: "#156c84",
    animate: true,
  },
  expired: {
    label: "Recording expired",
    bg: "#f1f5f9",
    color: "#64748b",
  },
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const cfg = CONFIG[status];

  return (
    <div
      className="inline-flex shrink-0 items-center gap-[7px] rounded-full px-3 py-1.5 text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${cfg.animate ? "animate-kpulse" : ""}`}
        style={{ backgroundColor: cfg.color }}
      />
      {cfg.label}
    </div>
  );
}
