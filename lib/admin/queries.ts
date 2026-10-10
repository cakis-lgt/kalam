import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/auth/config";
import { formatSessionDate } from "@/lib/sessions/map-session";
import {
  avatarColorFromName,
  initialsFromName,
} from "@/lib/examiner/avatar";
import { defaultExaminerMeta } from "@/lib/admin/examiner-meta";
import { focusCovers } from "@/lib/admin/focus";
import {
  CANDIDATE_PROFILE_COLUMNS,
  profileRowToCandidateView,
} from "@/lib/profile/candidate-fields";
import type {
  AdminStats,
  DistributionHistoryItem,
  ExaminerCard,
  UnassignedSession,
} from "@/lib/admin/mock-data";
import type { CEFRLevel } from "@/types";
import type { SessionStatus, TestSession } from "@/types/database";

function statusBadge(status: SessionStatus): {
  statusLabel: string;
  statusBg: string;
  statusColor: string;
} {
  if (status === "under_review") {
    return {
      statusLabel: "Under review",
      statusBg: "#f3e8ff",
      statusColor: "#7c3aed",
    };
  }
  if (status === "completed") {
    return {
      statusLabel: "Complete",
      statusBg: "#eef6ee",
      statusColor: "#16a34a",
    };
  }
  return {
    statusLabel: status,
    statusBg: "#eef2f7",
    statusColor: "#64748b",
  };
}

function buildExaminerCard(
  profile: { id: string; full_name: string; institution: string | null },
  index: number,
  activeLoad: number,
  completedCount: number,
): ExaminerCard {
  const meta = defaultExaminerMeta(index);
  const full = activeLoad >= meta.cap;
  const pct = Math.min(100, Math.round((activeLoad / meta.cap) * 100));

  return {
    id: profile.id,
    name: profile.full_name,
    initials: initialsFromName(profile.full_name),
    color: avatarColorFromName(profile.full_name),
    focus: meta.focus,
    cap: meta.cap,
    activeLoad,
    completedCount,
    loadPct: pct,
    barColor: full ? "#dc2626" : pct >= 75 ? "#ca8a04" : "#16a34a",
    statusLabel: full ? "At capacity" : "Available",
    statusBg: full ? "#fdecec" : "#eef6ee",
    statusColor: full ? "#dc2626" : "#16a34a",
  };
}

async function fetchExaminerProfiles() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, institution")
    .eq("role", "examiner")
    .order("full_name", { ascending: true });
  return data ?? [];
}

async function countSessionsByExaminer(
  examinerId: string,
  status: SessionStatus,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("test_sessions")
    .select("id", { count: "exact", head: true })
    .eq("examiner_id", examinerId)
    .eq("status", status);
  return count ?? 0;
}

export async function fetchExaminerCards(): Promise<ExaminerCard[]> {
  if (!isAuthConfigured()) return [];

  const profiles = await fetchExaminerProfiles();
  const cards = await Promise.all(
    profiles.map(async (p, i) => {
      const [activeLoad, completedCount] = await Promise.all([
        countSessionsByExaminer(p.id, "under_review"),
        countSessionsByExaminer(p.id, "completed"),
      ]);
      return buildExaminerCard(p, i, activeLoad, completedCount);
    }),
  );
  return cards;
}

async function warningCountForSession(sessionId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recordings")
    .select("warning_count")
    .eq("session_id", sessionId);
  return (data ?? []).reduce(
    (sum, r) => sum + (r.warning_count ?? 0),
    0,
  );
}

export async function fetchUnassignedSessions(
  examiners: ExaminerCard[],
): Promise<UnassignedSession[]> {
  if (!isAuthConfigured()) return [];

  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("test_sessions")
    .select("*")
    .eq("status", "awaiting_review")
    .is("examiner_id", null)
    .order("started_at", { ascending: true });

  if (!sessions?.length) return [];

  const candidateIds = [...new Set(sessions.map((s) => s.candidate_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select(`id, ${CANDIDATE_PROFILE_COLUMNS}`)
    .in("id", candidateIds);
  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      profileRowToCandidateView({
        full_name: p.full_name as string,
        username: p.username as string | null,
        gender: p.gender as string | null,
        nim: p.nim as string | null,
        campus: p.campus as string | null,
        faculty: p.faculty as string | null,
        study_program: p.study_program as string | null,
        semester: p.semester as number | null,
        preferred_language: p.preferred_language as string | null,
      }),
    ]),
  );

  return Promise.all(
    sessions.map(async (row) => {
      const session = row as TestSession;
      const candidate = profileById.get(session.candidate_id);
      const name = candidate?.fullName ?? "Peserta";
      const target = (session.final_level ??
        session.current_level) as CEFRLevel;
      const rec = examiners.find(
        (e) => focusCovers(e.focus, target) && e.activeLoad < e.cap,
      );
      const warnings = await warningCountForSession(session.id);

      return {
        id: session.id,
        candidateName: name,
        candidateInitials: initialsFromName(name),
        avatarBg: avatarColorFromName(name),
        candidate: candidate ?? { fullName: name, username: null, gender: null, nim: null, campus: null, faculty: null, studyProgram: null, semester: null, preferredLanguage: null },
        targetLevel: target,
        dateLabel: formatSessionDate(session.started_at),
        taskCount: session.progress_json?.attempts?.length ?? 0,
        warningCount: warnings,
        recommendedExaminerId: rec?.id ?? null,
        recommendedExaminerName: rec?.name ?? null,
      };
    }),
  );
}

export async function fetchAdminStats(
  examiners: ExaminerCard[],
  unassignedCount: number,
): Promise<AdminStats> {
  if (!isAuthConfigured()) {
    return {
      unassigned: 0,
      underReview: 0,
      completed: 0,
      activeExaminers: 0,
    };
  }

  const supabase = await createClient();
  const [underReview, completed] = await Promise.all([
    supabase
      .from("test_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "under_review"),
    supabase
      .from("test_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
  ]);

  return {
    unassigned: unassignedCount,
    underReview: underReview.count ?? 0,
    completed: completed.count ?? 0,
    activeExaminers: examiners.length,
  };
}

export async function fetchDistributionHistory(): Promise<
  DistributionHistoryItem[]
> {
  if (!isAuthConfigured()) return [];

  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("test_sessions")
    .select("*")
    .not("examiner_id", "is", null)
    .in("status", ["under_review", "completed"])
    .order("started_at", { ascending: false })
    .limit(50);

  if (!sessions?.length) return [];

  const candidateIds = [...new Set(sessions.map((s) => s.candidate_id))];
  const examinerIds = [
    ...new Set(
      sessions.map((s) => s.examiner_id).filter(Boolean) as string[],
    ),
  ];

  const [{ data: candidateProfiles }, { data: examinerProfiles }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(`id, ${CANDIDATE_PROFILE_COLUMNS}`)
        .in("id", candidateIds),
      supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", examinerIds),
    ]);

  const candidateProfile = new Map(
    (candidateProfiles ?? []).map((p) => [
      p.id,
      profileRowToCandidateView({
        full_name: p.full_name as string,
        username: p.username as string | null,
        gender: p.gender as string | null,
        nim: p.nim as string | null,
        campus: p.campus as string | null,
        faculty: p.faculty as string | null,
        study_program: p.study_program as string | null,
        semester: p.semester as number | null,
        preferred_language: p.preferred_language as string | null,
      }),
    ]),
  );
  const examinerName = new Map(
    (examinerProfiles ?? []).map((p) => [p.id, p.full_name as string]),
  );

  return sessions.map((row) => {
    const session = row as TestSession;
    const candidate = candidateProfile.get(session.candidate_id);
    const cName = candidate?.fullName ?? "Peserta";
    const eName = session.examiner_id
      ? (examinerName.get(session.examiner_id) ?? "Examiner")
      : "Examiner";
    const badge = statusBadge(session.status);

    return {
      id: session.id,
      candidateName: cName,
      candidateInitials: initialsFromName(cName),
      avatarBg: avatarColorFromName(cName),
      candidate: candidate ?? { fullName: cName, username: null, gender: null, nim: null, campus: null, faculty: null, studyProgram: null, semester: null, preferredLanguage: null },
      targetLevel: (session.final_level ??
        session.current_level) as CEFRLevel,
      dateLabel: formatSessionDate(session.started_at),
      examinerName: eName,
      examinerInitials: initialsFromName(eName),
      examinerColor: avatarColorFromName(eName),
      status: session.status,
      ...badge,
    };
  });
}

export async function assignSessionToExaminer(
  sessionId: string,
  examinerId: string,
): Promise<{ ok: boolean; error?: string; candidateName?: string; examinerName?: string }> {
  const supabase = await createClient();

  const { data: examiner } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", examinerId)
    .maybeSingle();

  if (!examiner || examiner.role !== "examiner") {
    return { ok: false, error: "Invalid examiner" };
  }

  const { data: session } = await supabase
    .from("test_sessions")
    .select("id, status, examiner_id, candidate_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return { ok: false, error: "Session not found" };
  if (session.status !== "awaiting_review") {
    return { ok: false, error: "Session is no longer awaiting distribution" };
  }
  if (session.examiner_id) {
    return { ok: false, error: "Session already assigned" };
  }

  const cards = await fetchExaminerCards();
  const card = cards.find((c) => c.id === examinerId);
  if (card && card.activeLoad >= card.cap) {
    return { ok: false, error: "Examiner at full capacity" };
  }

  const { error } = await supabase
    .from("test_sessions")
    .update({
      examiner_id: examinerId,
      status: "under_review" as SessionStatus,
    })
    .eq("id", sessionId)
    .eq("status", "awaiting_review")
    .is("examiner_id", null);

  if (error) return { ok: false, error: error.message };

  const { data: candidate } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.candidate_id)
    .maybeSingle();

  return {
    ok: true,
    candidateName: (candidate?.full_name as string) ?? "Peserta",
    examinerName: examiner.full_name as string,
  };
}

export async function autoDistributeSessions(): Promise<{
  ok: boolean;
  count: number;
  error?: string;
}> {
  const examiners = await fetchExaminerCards();
  const unassigned = await fetchUnassignedSessions(examiners);
  if (unassigned.length === 0) return { ok: true, count: 0 };

  const loads: Record<string, number> = {};
  examiners.forEach((e) => {
    loads[e.id] = e.activeLoad;
  });

  let count = 0;
  for (const session of unassigned) {
    let bestId: string | null = null;
    let minRatio = Infinity;

    for (const e of examiners) {
      if ((loads[e.id] ?? 0) >= e.cap) continue;
      const ratio = (loads[e.id] ?? 0) / e.cap;
      const preferred = focusCovers(e.focus, session.targetLevel)
        ? ratio - 0.01
        : ratio;
      if (preferred < minRatio) {
        minRatio = preferred;
        bestId = e.id;
      }
    }

    if (!bestId) break;

    const result = await assignSessionToExaminer(session.id, bestId);
    if (result.ok) {
      loads[bestId] = (loads[bestId] ?? 0) + 1;
      count++;
    }
  }

  return { ok: true, count };
}
