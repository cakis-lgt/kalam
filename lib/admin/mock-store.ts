import {
  MOCK_ADMIN_EXAMINERS,
  MOCK_DISTRIBUTION_HISTORY,
  MOCK_UNASSIGNED,
  type DistributionHistoryItem,
  type ExaminerCard,
  type UnassignedSession,
} from "@/lib/admin/mock-data";
import { focusCovers } from "@/lib/admin/focus";
import type { CEFRLevel } from "@/types";

function cloneExaminers(): ExaminerCard[] {
  return MOCK_ADMIN_EXAMINERS.map((e) => ({ ...e }));
}

function cloneUnassigned(): UnassignedSession[] {
  return MOCK_UNASSIGNED.map((s) => ({ ...s }));
}

function cloneHistory(): DistributionHistoryItem[] {
  return MOCK_DISTRIBUTION_HISTORY.map((h) => ({ ...h }));
}

let examiners = cloneExaminers();
let unassigned = cloneUnassigned();
let history = cloneHistory();

function recomputeExaminerCard(e: ExaminerCard): ExaminerCard {
  const full = e.activeLoad >= e.cap;
  const pct = Math.min(100, Math.round((e.activeLoad / e.cap) * 100));
  return {
    ...e,
    loadPct: pct,
    barColor: full ? "#dc2626" : pct >= 75 ? "#ca8a04" : "#16a34a",
    statusLabel: full ? "At capacity" : "Available",
    statusBg: full ? "#fdecec" : "#eef6ee",
    statusColor: full ? "#dc2626" : "#16a34a",
  };
}

function recommendFor(target: CEFRLevel): {
  id: string | null;
  name: string | null;
} {
  const rec = examiners.find(
    (e) => focusCovers(e.focus, target) && e.activeLoad < e.cap,
  );
  return rec
    ? { id: rec.id, name: rec.name }
    : { id: null, name: null };
}

function refreshUnassignedRecommendations() {
  unassigned = unassigned.map((s) => {
    const rec = recommendFor(s.targetLevel);
    return {
      ...s,
      recommendedExaminerId: rec.id,
      recommendedExaminerName: rec.name,
    };
  });
}

export function getMockDistribution() {
  refreshUnassignedRecommendations();
  return {
    stats: {
      unassigned: unassigned.length,
      underReview: history.filter((h) => h.status === "under_review").length,
      completed: history.filter((h) => h.status === "completed").length,
      activeExaminers: examiners.length,
    },
    unassigned,
    examiners,
  };
}

export function mockAssignSession(
  sessionId: string,
  examinerId: string,
): { ok: boolean; error?: string; message?: string } {
  const session = unassigned.find((s) => s.id === sessionId);
  const examiner = examiners.find((e) => e.id === examinerId);
  if (!session) return { ok: false, error: "Session not found" };
  if (!examiner) return { ok: false, error: "Examiner not found" };
  if (examiner.activeLoad >= examiner.cap) {
    return { ok: false, error: "Examiner at full capacity" };
  }

  unassigned = unassigned.filter((s) => s.id !== sessionId);
  examiners = examiners.map((e) =>
    e.id === examinerId
      ? recomputeExaminerCard({ ...e, activeLoad: e.activeLoad + 1 })
      : e,
  );

  history = [
    {
      id: session.id,
      candidateName: session.candidateName,
      candidateInitials: session.candidateInitials,
      avatarBg: session.avatarBg,
      candidate: session.candidate,
      targetLevel: session.targetLevel,
      dateLabel: session.dateLabel,
      examinerName: examiner.name,
      examinerInitials: examiner.initials,
      examinerColor: examiner.color,
      status: "under_review",
      statusLabel: "Under review",
      statusBg: "#f3e8ff",
      statusColor: "#7c3aed",
    },
    ...history,
  ];

  return {
    ok: true,
    message: `Session ${session.candidateName} assigned to ${examiner.name}`,
  };
}

export function mockAutoDistribute(): {
  ok: boolean;
  count: number;
  message: string;
} {
  const pending = [...unassigned];
  if (pending.length === 0) {
    return { ok: true, count: 0, message: "No sessions to distribute" };
  }

  const loads: Record<string, number> = {};
  examiners.forEach((e) => {
    loads[e.id] = e.activeLoad;
  });

  let count = 0;
  for (const session of pending) {
    let bestId = examiners[0]?.id;
    let minRatio = Infinity;
    for (const e of examiners) {
      if (loads[e.id] >= e.cap) continue;
      const ratio = loads[e.id] / e.cap;
      if (ratio < minRatio) {
        minRatio = ratio;
        bestId = e.id;
      }
    }
    if (!bestId) break;
    const result = mockAssignSession(session.id, bestId);
    if (result.ok) {
      loads[bestId] = (loads[bestId] ?? 0) + 1;
      count++;
    }
  }

  return {
    ok: true,
    count,
    message: `${count} session(s) auto-distributed`,
  };
}

export function getMockHistory() {
  return history;
}

export function getMockExaminers() {
  return examiners;
}

/** Reset demo state (optional, for tests). */
export function resetMockAdminStore() {
  examiners = cloneExaminers();
  unassigned = cloneUnassigned();
  history = cloneHistory();
}
