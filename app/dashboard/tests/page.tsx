import type { Metadata } from "next";
import Link from "next/link";
import { MyTestsView } from "@/components/dashboard/MyTestsView";
import { loadCandidateDashboardBundle } from "@/lib/dashboard/load-overview";

export const metadata: Metadata = {
  title: "My Tests — ALIKHTIBAR",
  description: "View and manage your speaking test sessions.",
};

export default async function MyTestsPage() {
  const { sessions } = await loadCandidateDashboardBundle();

  return (
    <main className="mx-auto max-w-[980px] px-margin-mobile pb-16 pt-10 md:px-gutter">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-[30px] font-semibold text-ink">
            My Tests
          </h1>
          <p className="mt-1 text-[14.5px] text-ink-subtle">
            Track in-progress sessions, examiner scoring status, and published
            results.
          </p>
        </div>

        <Link
          href="/tes"
          className="inline-flex items-center gap-2 rounded-[11px] bg-primary px-[22px] py-[13px] text-[14.5px] font-semibold text-on-primary shadow-brand transition-colors hover:bg-kalam-600"
        >
          <span className="text-lg leading-none">+</span>
          New Test
        </Link>
      </div>

      <MyTestsView sessions={sessions} />
    </main>
  );
}
