import { cache } from "react";
import { isAuthConfigured } from "@/lib/auth/config";
import { getAuthUser, getCandidateProfile } from "@/lib/auth/cached-auth";
import {
  MOCK_CANDIDATE,
  MOCK_SESSIONS,
  type CandidateProfile,
  type TestSessionRow,
} from "@/lib/dashboard/mock-data";
import { profileToCandidate } from "@/lib/dashboard/queries";
import { scoreLabelFromResult } from "@/lib/dashboard/session-summary";
import {
  buildSpeakingScoresFromDb,
  buildSpeakingScoresFromRows,
  type SpeakingScoresByLanguage,
} from "@/lib/dashboard/speaking-scores";
import { mapSessionToRow } from "@/lib/sessions/map-session";
import { createClient } from "@/lib/supabase/server";
import type { SessionResult, TestSession } from "@/types/database";
import type { CEFRLevel } from "@/types";

export type CandidateDashboardBundle = {
  profile: CandidateProfile;
  sessions: TestSessionRow[];
  speakingScores: SpeakingScoresByLanguage;
};

export const loadCandidateDashboardBundle = cache(
  async (): Promise<CandidateDashboardBundle> => {
    if (!isAuthConfigured()) {
      return {
        profile: MOCK_CANDIDATE,
        sessions: MOCK_SESSIONS,
        speakingScores: buildSpeakingScoresFromRows(MOCK_SESSIONS),
      };
    }

    const user = await getAuthUser();
    if (!user) {
      return {
        profile: MOCK_CANDIDATE,
        sessions: [],
        speakingScores: buildSpeakingScoresFromRows([]),
      };
    }

    const supabase = await createClient();

    const [{ data: sessionsData }, profile] = await Promise.all([
      supabase
        .from("test_sessions")
        .select("*")
        .eq("candidate_id", user.id)
        .order("started_at", { ascending: false }),
      getCandidateProfile(),
    ]);

    const sessions = (sessionsData ?? []) as TestSession[];

    if (sessions.length === 0) {
      const level = "Pre-A1" as CEFRLevel;
      return {
        profile: profile
          ? profileToCandidate(profile, level)
          : MOCK_CANDIDATE,
        sessions: [],
        speakingScores: buildSpeakingScoresFromRows([]),
      };
    }

    const sessionIds = sessions.map((s) => s.id);

    const [{ data: results }, { data: recordings }] = await Promise.all([
      supabase.from("session_results").select("*").in("session_id", sessionIds),
      supabase.from("recordings").select("session_id").in("session_id", sessionIds),
    ]);

    const resultRows = (results ?? []) as SessionResult[];
    const scoreBySession = new Map<string, string>();
    for (const row of resultRows) {
      const label = scoreLabelFromResult(row);
      if (label) scoreBySession.set(row.session_id, label);
    }

    const recordingCountBySession = new Map<string, number>();
    for (const rec of recordings ?? []) {
      recordingCountBySession.set(
        rec.session_id,
        (recordingCountBySession.get(rec.session_id) ?? 0) + 1,
      );
    }

    const rows = sessions.map((session) => {
      const progressAttempts = session.progress_json?.attempts?.length ?? 0;
      const recordingCount = recordingCountBySession.get(session.id) ?? 0;
      return mapSessionToRow(session, {
        scoreLabel: scoreBySession.get(session.id),
        taskCount: Math.max(recordingCount, progressAttempts) || undefined,
        recordingCount: recordingCount || undefined,
      });
    });

    const level =
      (rows.find((s) => s.status === "completed")?.level as CEFRLevel) ??
      (rows[0]?.level as CEFRLevel) ??
      "Pre-A1";

    return {
      profile: profile ? profileToCandidate(profile, level) : MOCK_CANDIDATE,
      sessions: rows,
      speakingScores: buildSpeakingScoresFromDb(sessions, resultRows),
    };
  },
);
