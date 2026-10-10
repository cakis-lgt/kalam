"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AdminStats,
  ExaminerCard,
  UnassignedSession,
} from "@/lib/admin/mock-data";
import { focusCovers } from "@/lib/admin/focus";
import { warningColor } from "@/lib/examiner/avatar";
import { ExaminerWorkloadCard } from "./ExaminerWorkloadCard";
import { CandidateMetaLine } from "@/components/shared/CandidateProfileDisplay";

export function AdminDistributionClient() {
  const [stats, setStats] = useState<AdminStats>({
    unassigned: 0,
    underReview: 0,
    completed: 0,
    activeExaminers: 0,
  });
  const [unassigned, setUnassigned] = useState<UnassignedSession[]>([]);
  const [examiners, setExaminers] = useState<ExaminerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [distributing, setDistributing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/distribution");
      const data = (await res.json()) as {
        stats: AdminStats;
        unassigned: UnassignedSession[];
        examiners: ExaminerCard[];
      };
      setStats(data.stats);
      setUnassigned(data.unassigned ?? []);
      setExaminers(data.examiners ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function handleAssign(sessionId: string) {
    const examinerId = selections[sessionId];
    if (!examinerId) return;

    setAssigning(sessionId);
    try {
      const res = await fetch("/api/admin/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, examinerId }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setToast(data.error ?? "Failed to assign session");
        return;
      }
      setToast(data.message ?? "Session assigned");
      await load();
    } finally {
      setAssigning(null);
    }
  }

  async function handleAutoDistribute() {
    setDistributing(true);
    try {
      const res = await fetch("/api/admin/auto-distribute", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setToast(data.error ?? "Auto-distribution failed");
        return;
      }
      setToast(data.message ?? "Distribution complete");
      await load();
    } finally {
      setDistributing(false);
    }
  }

  const statCards = [
    {
      label: "Unassigned",
      value: stats.unassigned,
      color: stats.unassigned ? "#156c84" : "#16a34a",
    },
    {
      label: "Under review",
      value: stats.underReview,
      color: "#7c3aed",
    },
    {
      label: "Complete",
      value: stats.completed,
      color: "#16a34a",
    },
    {
      label: "Active examiners",
      value: stats.activeExaminers,
      color: "#0d4f63",
    },
  ];

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-ink-subtle">
        Loading distribution…
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-heading text-[29px] font-semibold text-ink">
            Score Distribution
          </h1>
          <p className="mt-1 text-[14.5px] text-ink-subtle">
            Assign incoming test sessions to the right examiner, or distribute
            automatically by workload &amp; specialization.
          </p>
        </div>
        <button
          type="button"
          disabled={distributing || stats.unassigned === 0}
          onClick={() => void handleAutoDistribute()}
          className="flex items-center gap-2 rounded-[11px] bg-primary px-5 py-3 text-[13.5px] font-semibold text-on-primary shadow-[0_8px_20px_-10px_rgba(21,108,132,0.6)] hover:bg-kalam-600 disabled:opacity-60"
        >
          ⚡ {distributing ? "Distributing…" : "Auto-distribute"}
        </button>
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

      <div className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-[13px] text-sm font-semibold text-ink-secondary">
            Unassigned sessions
          </div>

          {unassigned.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-light bg-white px-12 py-12 text-center">
              <div className="mb-3 text-[38px]">✅</div>
              <p className="text-[15.5px] font-semibold text-ink">
                All sessions are assigned
              </p>
              <p className="mt-1 text-[13.5px] text-ink-subtle">
                No queue waiting for distribution.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {unassigned.map((session) => {
                const warnClr = warningColor(session.warningCount);
                const options = examiners.map((e) => ({
                  id: e.id,
                  label: `${e.name} · ${e.activeLoad}/${e.cap}${
                    focusCovers(e.focus, session.targetLevel) ? " ★" : ""
                  }`,
                  focusMatch: focusCovers(e.focus, session.targetLevel),
                }));

                return (
                  <div
                    key={session.id}
                    className="rounded-[14px] border border-border bg-white px-[18px] py-4"
                  >
                    <div className="mb-[13px] flex flex-wrap items-center gap-[13px]">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                        style={{ backgroundColor: session.avatarBg }}
                      >
                        {session.candidateInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14.5px] font-semibold text-ink">
                          {session.candidateName}
                        </div>
                        <div className="text-[12.5px] text-ink-faint">
                          Target {session.targetLevel} · {session.dateLabel} ·{" "}
                          {session.taskCount} tasks
                        </div>
                        <CandidateMetaLine candidate={session.candidate} />
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf3] bg-page-alt px-2.5 py-[5px] text-xs font-semibold"
                        style={{ color: warnClr }}
                      >
                        ⚠ {session.warningCount} warnings
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-[11px]">
                      <select
                        value={selections[session.id] ?? ""}
                        onChange={(e) =>
                          setSelections((prev) => ({
                            ...prev,
                            [session.id]: e.target.value,
                          }))
                        }
                        className="min-w-[200px] flex-1 cursor-pointer rounded-[9px] border border-border-light bg-white px-3 py-2.5 text-[13.5px] text-ink-muted"
                      >
                        <option value="">Assign to examiner…</option>
                        {options.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={
                          !selections[session.id] || assigning === session.id
                        }
                        onClick={() => void handleAssign(session.id)}
                        className="rounded-[9px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-on-primary hover:bg-kalam-600 disabled:opacity-60"
                      >
                        {assigning === session.id ? "…" : "Assign"}
                      </button>
                      {session.recommendedExaminerName && (
                        <span className="whitespace-nowrap text-xs font-medium text-primary">
                          Recommended: {session.recommendedExaminerName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="mb-[13px] text-sm font-semibold text-ink-secondary">
            Examiner workload
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-white px-1 py-2">
            {examiners.map((e) => (
              <ExaminerWorkloadCard key={e.id} examiner={e} compact />
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-[26px] left-1/2 z-50 flex -translate-x-1/2 animate-kfade items-center gap-2.5 rounded-xl bg-primary px-[22px] py-[13px] text-sm font-semibold text-white shadow-[0_16px_30px_-12px_rgba(0,0,0,0.4)]">
          ✓ {toast}
        </div>
      )}
    </>
  );
}
