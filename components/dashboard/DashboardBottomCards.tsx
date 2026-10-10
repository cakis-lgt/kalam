import Link from "next/link";

export function PracticeCard() {
  return (
    <div
      id="practice"
      className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-tertiary-container p-8 text-on-tertiary-container"
    >
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-on-tertiary-container/10 blur-3xl" />
      <div className="relative z-10">
        <h3 className="mb-2 text-headline-lg text-white">Practice for B2</h3>
        <p className="mb-6 text-body-md opacity-90">
          Master the &quot;Environmental Ethics&quot; topic to meet the
          requirements for the next proficiency tier.
        </p>
        <button
          type="button"
          className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-label-sm text-white transition-all hover:bg-white hover:text-tertiary-container"
        >
          Go to Practice Lab
        </button>
      </div>
    </div>
  );
}

export function SecurityRetentionCard() {
  return (
    <div className="flex items-start gap-6 rounded-2xl border border-outline-variant bg-surface-container-high p-8">
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <svg
          className="h-8 w-8 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <div>
        <h3 className="mb-2 text-label-sm font-bold uppercase tracking-widest text-primary">
          Security &amp; Retention
        </h3>
        <p className="text-body-md text-on-surface-variant">
          Test sessions are recorded to uphold academic integrity. All video data
          is deleted 14 days after submission per the candidate privacy
          agreement.
        </p>
        <Link
          href="#"
          className="mt-4 inline-block text-label-sm text-primary underline"
        >
          Review Privacy Policy
        </Link>
      </div>
    </div>
  );
}

export function DashboardFooter() {
  return (
    <footer className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-outline-variant py-8 text-label-sm text-on-surface-variant md:flex-row">
      <p>
        © {new Date().getFullYear()} ALIKHTIBAR Speaking Assessment. All rights
        reserved.
      </p>
      <div className="flex gap-6">
        <Link href="#" className="transition-colors hover:text-primary">
          Privacy Policy
        </Link>
        <Link href="#" className="transition-colors hover:text-primary">
          Terms of Service
        </Link>
        <Link href="#" className="transition-colors hover:text-primary">
          Contact Support
        </Link>
      </div>
    </footer>
  );
}
