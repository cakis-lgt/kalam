import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/auth/config";
import { formatSessionDate } from "@/lib/sessions/map-session";
import {
  avatarColorFromName,
  initialsFromName,
} from "@/lib/examiner/avatar";
import type { QueueFilter, ExaminerQueueItem, ExaminerHistoryItem, ExaminerReviewSession, ExaminerRecordingView } from "@/lib/examiner/mock-data";
import type { CEFRLevel, TestLanguage } from "@/types";
import type { SessionStatus, SessionResult, TestSession } from "@/types/database";
import { FORMAT_LABEL_ID } from "@/lib/tes/format-labels";
import {
  CANDIDATE_PROFILE_COLUMNS,
  profileRowToCandidateView,
} from "@/lib/profile/candidate-fields";
import type { TaskFormat } from "@/types";

function queueAction(
  session: TestSession,
  examinerId: string,
): ExaminerQueueItem["action"] {
  if (session.status === "completed") return "view";
  if (
    session.status === "under_review" &&
    session.examiner_id === examinerId
  ) {
    return "review";
  }
  if (session.status === "awaiting_review") return "claim";
  if (
    session.status === "under_review" &&
    session.examiner_id === examinerId
  ) {
    return "review";
  }
  return "view";
}

function mapCandidateProfileRow(
  row: Record<string, unknown> | null | undefined,
  fallbackName: string,
) {
  if (!row) {
    return {
      fullName: fallbackName,
      username: null,
      gender: null,
      nim: null,
      campus: null,
      faculty: null,
      studyProgram: null,
      semester: null,
      preferredLanguage: null,
    };
  }
  return profileRowToCandidateView({
    full_name: (row.full_name as string) ?? fallbackName,
    username: row.username as string | null,
    gender: row.gender as string | null,
    nim: row.nim as string | null,
    campus: row.campus as string | null,
    faculty: row.faculty as string | null,
    study_program: row.study_program as string | null,
    semester: row.semester as number | null,
    preferred_language: row.preferred_language as string | null,
  });
}

function mapQueueRow(
  session: TestSession & {
    profiles?: Record<string, unknown> | null;
    recordings?: { count: number }[];
  },
  examinerId: string,
  warningTotal = 0,
  recordingCount = 0,
): ExaminerQueueItem {
  const profileRow = session.profiles;
  const name =
    (profileRow?.full_name as string | undefined) ?? "Peserta";
  const candidate = mapCandidateProfileRow(profileRow, name);
  const taskCount =
    recordingCount ||
    (session as TestSession & { recording_count?: number }).recording_count ||
    session.progress_json?.attempts?.length ||
    0;

  return {
    id: session.id,
    candidateName: name,
    candidateInitials: initialsFromName(name),
    avatarBg: avatarColorFromName(name),
    candidate,
    targetLevel: (session.final_level ??
      session.current_level) as CEFRLevel,
    testLanguage: (session.language ??
      session.progress_json?.testLanguage ??
      "ar") as TestLanguage,
    dateLabel: formatSessionDate(session.started_at),
    taskCount,
    warningCount: warningTotal,
    status: session.status,
    examinerId: session.examiner_id,
    action: queueAction(session, examinerId),
  };
}

export async function fetchExaminerQueue(
  examinerId: string,
  filter: QueueFilter,
): Promise<ExaminerQueueItem[]> {
  if (!isAuthConfigured()) return [];

  const supabase = await createClient();

  let query = supabase
    .from("test_sessions")
    .select("*")
    .order("started_at", { ascending: true });

  if (filter === "pending") {
    query = query.eq("status", "awaiting_review").is("examiner_id", null);
  } else if (filter === "claimed") {
    query = query
      .eq("status", "under_review")
      .eq("examiner_id", examinerId);
  } else {
    query = query.eq("status", "completed").eq("examiner_id", examinerId);
  }

  const { data: sessions, error } = await query;
  if (error || !sessions?.length) return [];

  const candidateIds = [...new Set(sessions.map((s) => s.candidate_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select(`id, ${CANDIDATE_PROFILE_COLUMNS}`)
    .in("id", candidateIds);

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, p as Record<string, unknown>]),
  );

  const sessionIds = sessions.map((s) => s.id);
  const { data: recordings } = await supabase
    .from("recordings")
    .select("session_id, warning_count")
    .in("session_id", sessionIds);

  const warningsBySession = new Map<string, number>();
  const recordingCountBySession = new Map<string, number>();
  for (const rec of recordings ?? []) {
    const prev = warningsBySession.get(rec.session_id) ?? 0;
    warningsBySession.set(rec.session_id, prev + (rec.warning_count ?? 0));
    recordingCountBySession.set(
      rec.session_id,
      (recordingCountBySession.get(rec.session_id) ?? 0) + 1,
    );
  }

  return sessions.map((session) => {
    const row = session as TestSession;
    const profileRow = profileById.get(row.candidate_id);
    return mapQueueRow(
      { ...row, profiles: profileRow ?? null },
      examinerId,
      warningsBySession.get(row.id) ?? 0,
      recordingCountBySession.get(row.id) ?? 0,
    );
  });
}

export async function fetchExaminerStats(examinerId: string) {
  const [pending, claimed, completed] = await Promise.all([
    fetchExaminerQueue(examinerId, "pending"),
    fetchExaminerQueue(examinerId, "claimed"),
    fetchExaminerQueue(examinerId, "completed"),
  ]);

  return {
    pending: pending.length,
    claimed: claimed.length,
    completed: completed.length,
    totalToday: pending.length + claimed.length + completed.length,
  };
}

export async function fetchExaminerHistory(
  examinerId: string,
): Promise<ExaminerHistoryItem[]> {
  if (!isAuthConfigured()) return [];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("session_results")
    .select("*")
    .eq("examiner_id", examinerId)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(50);

  if (!rows?.length) return [];

  const sessionIds = rows.map((r) => r.session_id);
  const { data: sessions } = await supabase
    .from("test_sessions")
    .select("*")
    .in("id", sessionIds);

  const sessionMap = new Map((sessions ?? []).map((s) => [s.id, s as TestSession]));
  const candidateIds = [
    ...new Set((sessions ?? []).map((s) => s.candidate_id)),
  ];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", candidateIds);
  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name as string]),
  );

  return rows.map((row) => {
    const result = row as SessionResult;
    const session = sessionMap.get(result.session_id);
    if (!session) {
      return null;
    }
    const scores = Object.values(result.dimension_scores ?? {}) as number[];
    const avg =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;
    const name = nameById.get(session.candidate_id) ?? "Peserta";
    const taskCount = session.progress_json?.attempts?.length ?? 0;

    let bandLabel = "Memadai";
    let bandColor = "#84cc16";
    if (avg >= 4.5) {
      bandLabel = "Sangat Baik";
      bandColor = "#0ea5e9";
    } else if (avg >= 3.5) {
      bandLabel = "Baik";
      bandColor = "#22c55e";
    }

    return {
      id: session.id,
      candidateName: name,
      level: (result.overall_level ?? session.final_level ?? "A1") as CEFRLevel,
      meta: `${formatSessionDate(session.started_at)} · ${taskCount} tasks`,
      bandLabel,
      bandColor,
      averageScore: Math.round(avg * 10) / 10,
    };
  }).filter(Boolean) as ExaminerHistoryItem[];
}

function parseFormatFromTaskId(taskId: string): string {
  const formatTokens: [string, TaskFormat][] = [
    ["muq", "muqaddimah"],
    ["wasf", "wasf"],
    ["hiwar", "hiwar"],
    ["mun", "munaqasyah"],
  ];
  for (const [token, format] of formatTokens) {
    if (taskId.includes(`-${token}-`) || taskId.endsWith(`-${token}`)) {
      return FORMAT_LABEL_ID[format];
    }
  }
  return "Task";
}

export async function fetchExaminerReviewSession(
  sessionId: string,
  examinerId: string,
): Promise<ExaminerReviewSession | null> {
  if (!isAuthConfigured()) return null;

  const supabase = await createClient();

  const { data: session } = await supabase
    .from("test_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return null;

  const s = session as TestSession;
  const { data: profile } = await supabase
    .from("profiles")
    .select(CANDIDATE_PROFILE_COLUMNS)
    .eq("id", s.candidate_id)
    .maybeSingle();
  const candidate = mapCandidateProfileRow(
    profile as Record<string, unknown> | null,
    "Peserta",
  );
  const candidateName = candidate.fullName;

  const { data: recordings } = await supabase
    .from("recordings")
    .select("*")
    .eq("session_id", sessionId)
    .order("uploaded_at", { ascending: true });

  const recordingIds = (recordings ?? []).map((r) => r.id);
  let eventsByRecording = new Map<string, { timestamp_ms: number; event_type: string; gaze_score: number }[]>();

  if (recordingIds.length > 0) {
    const { data: events } = await supabase
      .from("eye_contact_events")
      .select("recording_id, timestamp_ms, event_type, gaze_score")
      .in("recording_id", recordingIds)
      .order("timestamp_ms", { ascending: true });

    for (const ev of events ?? []) {
      const list = eventsByRecording.get(ev.recording_id) ?? [];
      list.push(ev);
      eventsByRecording.set(ev.recording_id, list);
    }
  }

  const { data: resultRow } = await supabase
    .from("session_results")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  const recs: ExaminerRecordingView[] = (recordings ?? []).map((rec, i) => {
    const ai = rec.ai_suggestion as { overall?: number } | null;
    const levelMatch = rec.task_id.match(/(pre-a1|a1|a2|b1|b2|c1|c2)/i);
    const level = (levelMatch?.[1]?.toUpperCase().replace("PRE-A1", "Pre-A1") ??
      s.current_level) as CEFRLevel;

    return {
      id: rec.id,
      taskId: rec.task_id,
      taskLabel: `Task ${i + 1}`,
      level,
      formatLabel: parseFormatFromTaskId(rec.task_id),
      durationSec: rec.duration_sec ?? 0,
      fileSizeBytes: rec.file_size_bytes ?? null,
      transcript: rec.transcript,
      eyeContactAvg: rec.eye_contact_avg ?? null,
      warningCount: rec.warning_count ?? 0,
      aiSuggestion:
        typeof ai?.overall === "number"
          ? ai.overall
          : typeof rec.ai_suggestion === "object" &&
              rec.ai_suggestion &&
              "pronunciation" in rec.ai_suggestion
            ? (() => {
                // Average across the dimensions actually present (the candidate
                // AI flow emits 5; a future 6-dim examiner pre-score would emit
                // more). Divide by the real count, not a hardcoded divisor.
                const nums = Object.values(
                  rec.ai_suggestion as Record<string, number>,
                ).filter((v) => typeof v === "number");
                return nums.length
                  ? Math.round(
                      (nums.reduce((a, b) => a + b, 0) / nums.length) * 10,
                    ) / 10
                  : null;
              })()
            : null,
      storagePath: rec.storage_path,
      eyeContactEvents: (eventsByRecording.get(rec.id) ?? []).map((e) => ({
        timestampMs: e.timestamp_ms,
        eventType: e.event_type as "good" | "warning" | "danger",
        gazeScore: Number(e.gaze_score),
      })),
    };
  });

  const result = resultRow as SessionResult | null;

  const testLanguage = (s.language ??
    s.progress_json?.testLanguage ??
    "ar") as TestLanguage;

  return {
    id: s.id,
    candidateName,
    candidate,
    dateLabel: formatSessionDate(s.started_at),
    testLanguage,
    targetLevel: (s.final_level ?? s.current_level) as CEFRLevel,
    taskCount: recs.length || (s.progress_json?.attempts?.length ?? 0),
    status: s.status,
    recordings: recs,
    draft: result
      ? {
          overallLevel: result.overall_level as CEFRLevel,
          dimensionScores: result.dimension_scores ?? {},
          dimensionNotes: (result.dimension_notes as Record<string, string>) ?? {},
          summary: result.summary ?? "",
          publishedAt: result.published_at,
        }
      : null,
  };
}

export async function claimSession(
  sessionId: string,
  examinerId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("test_sessions")
    .select("id, status, examiner_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return { ok: false, error: "Session not found" };
  if (session.status !== "awaiting_review") {
    return { ok: false, error: "Session is no longer awaiting claim" };
  }
  if (session.examiner_id && session.examiner_id !== examinerId) {
    return { ok: false, error: "Session already claimed by another examiner" };
  }

  const { error } = await supabase
    .from("test_sessions")
    .update({ status: "under_review" as SessionStatus, examiner_id: examinerId })
    .eq("id", sessionId)
    .eq("status", "awaiting_review");

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
