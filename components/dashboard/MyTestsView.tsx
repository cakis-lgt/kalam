"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TestSessionRow } from "@/lib/dashboard/mock-data";
import { TestHistoryTable } from "@/components/dashboard/TestHistoryTable";
import { SessionStatusBadge } from "@/components/dashboard/SessionStatusBadge";

type Filter = "all" | "in_progress" | "pending" | "completed" | "expired";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in_progress", label: "In progress" },
  { key: "pending", label: "Awaiting score" },
  { key: "completed", label: "Completed" },
  { key: "expired", label: "Expired" },
];

function matchesFilter(session: TestSessionRow, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "in_progress") return session.status === "in_progress";
  if (filter === "pending") {
    return (
      session.status === "awaiting_review" || session.status === "under_review"
    );
  }
  if (filter === "completed") return session.status === "completed";
  return session.status === "expired";
}

type Props = {
  sessions: TestSessionRow[];
};

export function MyTestsView({ sessions }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () => sessions.filter((s) => matchesFilter(s, filter)),
    [sessions, filter],
  );

  const counts = useMemo(
    () => ({
      all: sessions.length,
      in_progress: sessions.filter((s) => s.status === "in_progress").length,
      pending: sessions.filter(
        (s) =>
          s.status === "awaiting_review" || s.status === "under_review",
      ).length,
      completed: sessions.filter((s) => s.status === "completed").length,
      expired: sessions.filter((s) => s.status === "expired").length,
    }),
    [sessions],
  );

  const activeSession = sessions.find((s) => s.status === "in_progress");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Total", counts.all, "#64748b"],
            ["In progress", counts.in_progress, "#156c84"],
            ["Awaiting score", counts.pending, "#d97706"],
            ["Completed", counts.completed, "#16a34a"],
          ] as const
        ).map(([label, value, color]) => (
          <div
            key={label}
            className="rounded-[14px] border border-border bg-white px-4 py-3.5"
          >
            <div className="text-[12px] font-medium text-ink-faint">{label}</div>
            <div
              className="mt-1 font-heading text-2xl font-semibold"
              style={{ color }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {activeSession && (
        <div className="flex flex-col gap-3 rounded-[14px] border border-[#b8dce6] bg-[#eef6f8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[14px] font-semibold text-[#156c84]">
              You have a test in progress
            </div>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              {activeSession.dateLabel} · ID {activeSession.id}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SessionStatusBadge status={activeSession.status} />
            <Link
              href={
                activeSession.sessionUuid
                  ? `/tes?session=${activeSession.sessionUuid}`
                  : "/tes"
              }
              className="rounded-[10px] bg-primary px-4 py-2 text-[13px] font-semibold text-on-primary hover:bg-kalam-600"
            >
              Continue
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => {
          const count = counts[key];
          if (key !== "all" && count === 0) return null;
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                active
                  ? "bg-primary text-on-primary"
                  : "border border-border-light bg-white text-ink-muted hover:bg-surface-container"
              }`}
            >
              {label}
              <span className="ml-1.5 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <TestHistoryTable sessions={filtered} />
    </div>
  );
}
