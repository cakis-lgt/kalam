"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExaminerQueueItem, QueueFilter } from "@/lib/examiner/mock-data";
import { warningColor } from "@/lib/examiner/avatar";
import { LANGUAGE_SHORT } from "@/lib/tes/task-prompt";
import { CandidateMetaLine } from "@/components/shared/CandidateProfileDisplay";

type Stats = {
  pending: number;
  claimed: number;
  completed: number;
  totalToday: number;
};

const FILTERS: { key: QueueFilter; label: (n: number) => string }[] = [
  { key: "pending", label: (n) => `Pending (${n})` },
  { key: "claimed", label: (n) => `In review (${n})` },
  { key: "completed", label: (n) => `Complete (${n})` },
];

export function ExaminerQueueClient() {
  const router = useRouter();
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [items, setItems] = useState<ExaminerQueueItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    claimed: 0,
    completed: 0,
    totalToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = useCallback(async (f: QueueFilter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/examiner/queue?filter=${f}`);
      const data = (await res.json()) as {
        items: ExaminerQueueItem[];
        stats: Stats;
      };
      setItems(data.items ?? []);
      if (data.stats) setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  async function handleClaim(id: string) {
    setClaiming(id);
    try {
      const res = await fetch(`/api/examiner/sessions/${id}`, { method: "POST" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? "Failed to claim session");
        return;
      }
      router.push(`/examiner/sessions/${id}`);
    } finally {
      setClaiming(null);
    }
  }

  function handleAction(item: ExaminerQueueItem) {
    if (item.action === "claim") {
      void handleClaim(item.id);
    } else {
      router.push(`/examiner/sessions/${item.id}`);
    }
  }

  const statCards = [
    { label: "Awaiting claim", value: stats.pending, color: "#156c84" },
    { label: "Under review", value: stats.claimed, color: "#7c3aed" },
    { label: "Scoring complete", value: stats.completed, color: "#16a34a" },
    { label: "Total today", value: stats.totalToday, color: "#16202e" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-[29px] font-semibold text-ink">
          Scoring Queue
        </h1>
        <p className="mt-1 text-[14.5px] text-ink-subtle">
          Claim sessions to review recordings and score them using the ALIKHTIBAR
          rubric.
        </p>
      </div>

      <div className="mb-[26px] grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="rounded-[14px] border border-border bg-white px-[18px] py-4"
          >
            <div className="mb-1.5 text-[12.5px] font-medium text-ink-faint">
              {c.label}
            </div>
            <div
              className="font-heading text-[26px] font-semibold"
              style={{ color: c.color }}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex w-fit gap-1.5 rounded-[11px] bg-surface-dim p-1">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg px-[15px] py-[7px] text-[13px] font-semibold transition-colors ${
              filter === key
                ? "bg-white text-ink shadow-sm"
                : "text-ink-subtle hover:text-ink-muted"
            }`}
          >
            {label(
              key === "pending"
                ? stats.pending
                : key === "claimed"
                  ? stats.claimed
                  : stats.completed,
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-ink-subtle">Loading queue…</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-light bg-white px-6 py-14 text-center">
          <div className="mb-3 text-[40px]">🗂️</div>
          <p className="font-semibold text-ink">No sessions in this category</p>
          <p className="mt-1 text-[13.5px] text-ink-subtle">
            Check again later or choose another filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="hidden grid-cols-[2fr_1fr_0.8fr_1fr_1.1fr] gap-3 border-b border-border bg-page-alt px-5 py-3.5 text-[11.5px] font-semibold tracking-[0.03em] text-ink-faint md:grid">
            <div>CANDIDATE</div>
            <div>NIM / PROGRAM</div>
            <div>TEST DATE</div>
            <div>TASKS</div>
            <div className="text-right">ACTION</div>
          </div>

          {items.map((item) => {
            const warnClr = warningColor(item.warningCount);
            const actionLabel =
              item.action === "claim"
                ? "Claim"
                : item.action === "review"
                  ? "Continue review"
                  : "View";
            const isPrimary = item.action === "claim";

            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 border-b border-[#e6ecf3] px-5 py-3.5 last:border-b-0 md:grid md:grid-cols-[2fr_1fr_0.8fr_1fr_1.1fr] md:items-center md:gap-3"
              >
                <div className="flex items-center gap-[11px]">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold text-white"
                    style={{ backgroundColor: item.avatarBg }}
                  >
                    {item.candidateInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink">
                      {item.candidateName}
                    </div>
                    <div className="text-xs text-ink-faint">
                      Target {item.targetLevel} · {LANGUAGE_SHORT[item.testLanguage]}
                    </div>
                    <CandidateMetaLine candidate={item.candidate} />
                  </div>
                </div>
                <div className="text-[13px] text-ink-muted">
                  <div className="font-medium">{item.candidate.nim ?? "—"}</div>
                  <div className="text-xs text-ink-faint line-clamp-2">
                    {item.candidate.studyProgram ?? "—"}
                  </div>
                </div>
                <div className="text-[13px] text-ink-muted md:block">
                  {item.dateLabel}
                </div>
                <div className="text-[13px] text-ink-muted">
                  {item.taskCount} tasks
                  <span className="text-ink-faint">
                    {" "}
                    ·{" "}
                    <span style={{ color: warnClr }}>{item.warningCount} warn</span>
                  </span>
                </div>
                <div className="md:text-right">
                  <button
                    type="button"
                    disabled={claiming === item.id}
                    onClick={() => handleAction(item)}
                    className={`rounded-[10px] px-4 py-2 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                      isPrimary
                        ? "bg-primary text-on-primary hover:bg-kalam-600"
                        : "border border-border-light bg-white text-ink-muted hover:bg-surface-container"
                    }`}
                  >
                    {claiming === item.id ? "…" : actionLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
