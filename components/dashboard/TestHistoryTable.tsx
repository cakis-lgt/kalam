import Link from "next/link";
import type { TestSessionRow } from "@/lib/dashboard/mock-data";
import { cefrSolidClass } from "@/lib/dashboard/cefr-badge";
import { SessionStatusBadge } from "./SessionStatusBadge";
import { LANGUAGE_SHORT } from "@/lib/tes/task-prompt";

type Props = {
  sessions: TestSessionRow[];
};

function sessionLangPart(session: TestSessionRow): string {
  return session.language ? ` · ${LANGUAGE_SHORT[session.language]}` : "";
}

function sessionTitle(session: TestSessionRow): string {
  const langPart = sessionLangPart(session);
  if (session.status === "in_progress") return "Test in progress";
  if (session.status === "awaiting_review") return "Awaiting examiner scoring";
  if (session.status === "under_review") return "Being scored by examiner";
  if (session.status === "expired") return "Recording deleted";
  if (session.status === "completed") {
    return session.scoreLabel
      ? `Examiner score published`
      : `Speaking Test${langPart} · ${session.level}`;
  }
  return `Speaking Test${langPart} · ${session.level}`;
}

function sessionMeta(session: TestSessionRow): string {
  const parts = [session.dateLabel, `ID ${session.id}`];
  if (session.recordingCount && session.recordingCount > 0) {
    parts.push(`${session.recordingCount} recording(s)`);
  } else if (session.taskCount && session.taskCount > 0) {
    parts.push(`${session.taskCount} task(s)`);
  }
  if (session.scoreLabel && session.status === "completed") {
    parts.push(session.scoreLabel);
  }
  if (
    session.status === "in_progress" &&
    session.progressPercent != null &&
    session.progressPercent > 0
  ) {
    parts.push(`~${session.progressPercent}% progress`);
  }
  return parts.join(" · ");
}

function sessionAction(session: TestSessionRow): {
  label: string;
  href?: string;
  variant: "primary" | "outline" | "muted";
} {
  if (session.status === "completed") {
    return {
      label: "View Results",
      href: session.sessionUuid
        ? `/hasil?session=${session.sessionUuid}`
        : "/hasil",
      variant: "outline",
    };
  }
  if (session.status === "in_progress") {
    return {
      label: "Continue",
      href: session.sessionUuid
        ? `/tes?session=${session.sessionUuid}`
        : "/tes",
      variant: "primary",
    };
  }
  if (session.status === "awaiting_review" || session.status === "under_review") {
    return {
      label: "View status",
      href: session.sessionUuid
        ? `/tes/${session.sessionUuid}/waiting`
        : undefined,
      variant: "outline",
    };
  }
  return { label: "Details", variant: "muted" };
}

export function TestHistoryTable({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-border-light bg-white px-6 py-14 text-center">
        <div className="mb-3 text-4xl">📝</div>
        <p className="font-semibold text-ink">No test sessions yet</p>
        <p className="mt-1 text-sm text-ink-subtle">
          Start your first test to see your history here.
        </p>
        <Link
          href="/tes"
          className="mt-5 inline-flex rounded-[10px] bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-on-primary hover:bg-kalam-600"
        >
          Start First Test
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {sessions.map((session) => {
        const action = sessionAction(session);
        const btnClass =
          action.variant === "primary"
            ? "border-none bg-primary text-white hover:bg-kalam-600"
            : action.variant === "muted"
              ? "border-border-light bg-surface-container text-ink-faint cursor-default"
              : "border-border-light bg-white text-ink-muted hover:bg-surface-container";

        return (
          <div
            key={session.id}
            className="flex flex-col gap-4 rounded-[14px] border border-border bg-white p-[18px] sm:flex-row sm:items-center sm:gap-5"
          >
            <div
              className={`flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl font-heading text-[17px] font-bold text-white ${cefrSolidClass(session.level)}`}
            >
              {session.level}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-ink">
                {sessionTitle(session)}
              </div>
              <div className="text-[12.5px] text-ink-faint">
                {sessionMeta(session)}
              </div>
            </div>

            <SessionStatusBadge status={session.status} />

            {action.href ? (
              <Link
                href={action.href}
                className={`shrink-0 rounded-[10px] border px-4 py-2 text-[13px] font-semibold transition-colors ${btnClass}`}
              >
                {action.label}
              </Link>
            ) : (
              <span
                className={`shrink-0 rounded-[10px] border px-4 py-2 text-[13px] font-semibold ${btnClass}`}
              >
                {action.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
