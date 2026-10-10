import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/auth/config";
import { getAuthUser, getCandidateProfile } from "@/lib/auth/cached-auth";
import { loadCandidateDashboardBundle } from "@/lib/dashboard/candidate-bundle";
import type { Profile, TestSession } from "@/types/database";
import type { CandidateProfile } from "@/lib/dashboard/mock-data";
import type { CEFRLevel } from "@/types";
import { latestPublishedLevel } from "@/lib/dashboard/session-summary";
import type { TestSessionRow } from "@/lib/dashboard/mock-data";

export type CandidateProfilePageData = {
  email: string;
  fullName: string;
  username: string | null;
  nim: string | null;
  institution: string | null;
  faculty: string | null;
  studyProgram: string | null;
  semester: number | null;
  currentLevel: CEFRLevel;
};

export async function fetchCandidateProfile(): Promise<Profile | null> {
  return getCandidateProfile();
}

export async function fetchCandidateSessions(): Promise<TestSession[]> {
  if (!isAuthConfigured()) return [];

  const user = await getAuthUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("test_sessions")
    .select("*")
    .eq("candidate_id", user.id)
    .order("started_at", { ascending: false });

  return (data ?? []) as TestSession[];
}

export async function fetchCandidateDashboardSessions(): Promise<TestSessionRow[]> {
  const bundle = await loadCandidateDashboardBundle();
  return bundle.sessions;
}

export function profileToCandidate(
  profile: Profile,
  currentLevel: CEFRLevel = "Pre-A1",
): CandidateProfile {
  return {
    fullName: profile.full_name,
    institution: profile.institution ?? "—",
    avatarUrl:
      profile.avatar_url ??
      "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(profile.full_name) +
        "&background=065f46&color=fff",
    currentLevel,
    levelLabel: currentLevel,
    tags: ["Verified Candidate"],
  };
}

export async function fetchCandidateProfilePageData(): Promise<CandidateProfilePageData | null> {
  if (!isAuthConfigured()) return null;

  const user = await getAuthUser();
  if (!user?.email) return null;

  const [profile, bundle] = await Promise.all([
    getCandidateProfile(),
    loadCandidateDashboardBundle(),
  ]);
  const currentLevel = latestPublishedLevel(
    bundle.sessions,
    (bundle.sessions[0]?.level as CEFRLevel) ?? "Pre-A1",
  ) as CEFRLevel;

  if (!profile) {
    return {
      email: user.email,
      fullName: user.user_metadata?.full_name ?? user.email.split("@")[0],
      username: (user.user_metadata?.username as string | undefined) ?? null,
      nim: null,
      institution: null,
      faculty: null,
      studyProgram: null,
      semester: null,
      currentLevel,
    };
  }

  return {
    email: user.email,
    fullName: profile.full_name,
    username: profile.username,
    nim: profile.nim,
    institution: profile.institution,
    faculty: profile.faculty,
    studyProgram: profile.study_program,
    semester: profile.semester,
    currentLevel,
  };
}
