import type { Metadata } from "next";
import { PracticeHub } from "@/components/dashboard/PracticeHub";
import { loadCandidateDashboardBundle } from "@/lib/dashboard/load-overview";
import { latestPublishedLevel } from "@/lib/dashboard/session-summary";

export const metadata: Metadata = {
  title: "Practice — ALIKHTIBAR",
  description: "Rehearse ALIKHTIBAR speaking prompts before your official test.",
};

export default async function PracticePage() {
  const { profile, sessions } = await loadCandidateDashboardBundle();
  const suggestedLevel = latestPublishedLevel(
    sessions,
    profile.currentLevel,
  ) as typeof profile.currentLevel;

  return (
    <main className="mx-auto max-w-[980px] px-margin-mobile pb-16 pt-10 md:px-gutter">
      <div className="mb-7">
        <h1 className="font-heading text-[30px] font-semibold text-ink">
          Practice
        </h1>
        <p className="mt-1 text-[14.5px] text-ink-subtle">
          Rehearse sample prompts by language and level. Nothing here is sent to
          an examiner.
        </p>
      </div>

      <PracticeHub suggestedLevel={suggestedLevel} />
    </main>
  );
}
