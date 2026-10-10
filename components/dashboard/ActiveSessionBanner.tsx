import Link from "next/link";
import type { TestSessionRow } from "@/lib/dashboard/mock-data";

type Props = {
  session: TestSessionRow;
};

function bannerConfig(session: TestSessionRow): {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  accent: string;
  bg: string;
  border: string;
} {
  switch (session.status) {
    case "in_progress":
      return {
        title: "Test not finished",
        description:
          "You have a session still in progress. Continue answering before starting a new test.",
        ctaLabel: "Continue test",
        href: session.sessionUuid
          ? `/tes?session=${session.sessionUuid}`
          : "/tes",
        accent: "#156c84",
        bg: "#eef6f8",
        border: "#b8dce6",
      };
    case "under_review":
      return {
        title: "Examiner is scoring",
        description:
          "Your answer recording is being reviewed. Your score will appear automatically when the examiner finishes.",
        ctaLabel: "View scoring status",
        href: session.sessionUuid
          ? `/tes/${session.sessionUuid}/waiting`
          : "/dashboard",
        accent: "#156c84",
        bg: "#eef6f8",
        border: "#b8dce6",
      };
    case "awaiting_review":
    default:
      return {
        title: "Awaiting examiner scoring",
        description:
          "Your test recording has been saved and added to the examiner queue. Usually completed within 5–15 minutes.",
        ctaLabel: "View scoring status",
        href: session.sessionUuid
          ? `/tes/${session.sessionUuid}/waiting`
          : "/dashboard",
        accent: "#d97706",
        bg: "#fef9ec",
        border: "#fde68a",
      };
  }
}

export function ActiveSessionBanner({ session }: Props) {
  const cfg = bannerConfig(session);
  const meta: string[] = [session.dateLabel, session.id];
  if (session.recordingCount && session.recordingCount > 0) {
    meta.push(`${session.recordingCount} recording(s) saved`);
  } else if (session.taskCount && session.taskCount > 0) {
    meta.push(`${session.taskCount} task(s) submitted`);
  }

  return (
    <div
      className="mb-6 flex flex-col gap-4 rounded-[14px] border px-5 py-[18px] sm:flex-row sm:items-center sm:justify-between"
      style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      <div className="min-w-0">
        <div
          className="mb-1 text-[15px] font-semibold"
          style={{ color: cfg.accent }}
        >
          {cfg.title}
        </div>
        <p className="text-[13.5px] leading-relaxed text-ink-muted">
          {cfg.description}
        </p>
        <p className="mt-1.5 text-[12px] text-ink-faint">{meta.join(" · ")}</p>
      </div>
      <Link
        href={cfg.href}
        className="inline-flex shrink-0 items-center justify-center rounded-[10px] px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: cfg.accent }}
      >
        {cfg.ctaLabel}
      </Link>
    </div>
  );
}
