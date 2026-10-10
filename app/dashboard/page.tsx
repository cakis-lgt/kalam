import type { Metadata } from "next";
import Link from "next/link";
import { TestHistoryTable } from "@/components/dashboard/TestHistoryTable";
import { ActiveSessionBanner } from "@/components/dashboard/ActiveSessionBanner";
import { SpeakingScoreCard } from "@/components/dashboard/SpeakingScoreCard";
import { loadCandidateDashboardBundle } from "@/lib/dashboard/load-overview";
import {
  countPendingReview,
  findPrioritySession,
  latestPublishedLevel,
} from "@/lib/dashboard/session-summary";

export const metadata: Metadata = {
  title: "Dashboard — ALIKHTIBAR",
  description: "Manage your Speaking tests and view your score history.",
};

function countCompleted(sessions: { status: string }[]): number {
  return sessions.filter((s) => s.status === "completed").length;
}

export default async function DashboardPage() {
  const { profile, sessions, speakingScores } =
    await loadCandidateDashboardBundle();

  const firstName = profile.fullName.split(/\s+/)[0] ?? profile.fullName;
  const completedCount = countCompleted(sessions);
  const pendingCount = countPendingReview(sessions);
  const publishedLevel = latestPublishedLevel(sessions, profile.currentLevel);
  const activeSession = findPrioritySession(sessions);
  const hasInProgress = sessions.some((s) => s.status === "in_progress");

  const statCards = [
    {
      label: "Completed sessions",
      value: String(completedCount),
      unit: "tests",
      color: "#16a34a",
    },
    {
      label: pendingCount > 0 ? "Awaiting examiner" : "Latest level",
      value: pendingCount > 0 ? String(pendingCount) : publishedLevel,
      unit: pendingCount > 0 ? "sessions" : "ALIKHTIBAR",
      color: pendingCount > 0 ? "#d97706" : "#156c84",
    },
    {
      label: "Total sessions",
      value: String(sessions.length),
      unit: "history",
      color: "#64748b",
    },
  ];

  return (
    <main className="mx-auto max-w-[980px] px-margin-mobile pb-16 pt-10 md:px-gutter">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[30px] font-semibold text-ink">
            Assalamu&apos;alaikum, {firstName}
          </h1>
          <p className="mt-1 text-[14.5px] text-ink-subtle">
            {pendingCount > 0
              ? "Your test recording is being or will soon be scored by an examiner."
              : "Continue your Speaking test or view your score history."}
          </p>
        </div>

        {!hasInProgress && (
          <Link
            href="/tes"
            className="inline-flex items-center gap-2 rounded-[11px] bg-primary px-[22px] py-[13px] text-[14.5px] font-semibold text-on-primary shadow-brand transition-colors hover:bg-kalam-600"
          >
            <span className="text-lg leading-none">+</span>
            Start New Test
          </Link>
        )}
      </div>

      {activeSession && <ActiveSessionBanner session={activeSession} />}

      <SpeakingScoreCard scores={speakingScores} />

      <div className="mb-[30px] grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[14px] border border-border bg-white px-5 py-[18px]"
          >
            <div className="mb-2 text-[12.5px] font-medium text-ink-faint">
              {card.label}
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="font-heading text-[28px] font-semibold"
                style={{ color: card.color }}
              >
                {card.value}
              </span>
              <span className="text-[13px] text-ink-subtle">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-ink-muted">Recent sessions</div>
        <Link
          href="/dashboard/tests"
          className="text-[13px] font-medium text-primary hover:underline"
        >
          View all tests
        </Link>
      </div>
      <TestHistoryTable sessions={sessions.slice(0, 3)} />

      <div className="mt-[22px] flex items-center gap-3 rounded-xl border border-dashed border-primary-fixed-dim bg-[#eef6f8] px-[18px] py-3.5">
        <span className="text-lg text-primary">🔒</span>
        <p className="text-[13px] leading-[1.5] text-ink-subtle">
          Video recordings are stored encrypted for up to{" "}
          <strong className="text-ink-muted">14 days</strong>, then deleted
          automatically. Scores and examiner notes are kept permanently after
          publication.
        </p>
      </div>
    </main>
  );
}
