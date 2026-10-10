import {
  loadCandidateDashboardBundle,
  type CandidateDashboardBundle,
} from "@/lib/dashboard/candidate-bundle";

export async function loadCandidateOverview(): Promise<
  Pick<CandidateDashboardBundle, "profile" | "sessions">
> {
  const bundle = await loadCandidateDashboardBundle();
  return { profile: bundle.profile, sessions: bundle.sessions };
}

export { loadCandidateDashboardBundle };
