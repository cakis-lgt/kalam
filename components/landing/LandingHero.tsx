import Link from "next/link";

const HERO_BARS = [
  { label: "Pronunciation", score: 4, pct: "80%", color: "#22c55e" },
  { label: "Fluency", score: 3, pct: "60%", color: "#84cc16" },
  { label: "Grammar", score: 4, pct: "80%", color: "#22c55e" },
  { label: "Vocabulary", score: 3, pct: "60%", color: "#eab308" },
];

export function LandingHero() {
  return (
    <section className="bg-page">
      <div className="mx-auto grid max-w-container-max grid-cols-1 items-center gap-14 px-margin-mobile py-16 md:px-gutter lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-[72px]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-container px-[13px] py-1.5 text-[12.5px] font-semibold text-on-primary-container">
            <span className="h-[7px] w-[7px] rounded-full bg-primary" />
            ALIKHTIBAR · Arabic & English
          </div>

          <h1 className="font-heading text-display-lg text-ink">
            <span className="block">Speaking test,</span>
            <span className="block">from anywhere —</span>
            <span className="block text-primary">scored by real examiners.</span>
          </h1>

          <p className="mt-6 max-w-[480px] text-body-lg text-ink-muted">
            Self-paced Arabic or English speaking exam via video. Recorded with gaze
            monitoring, then scored directly by experienced examiners using the
            six-dimension ALIKHTIBAR rubric.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="rounded-[11px] bg-primary px-[26px] py-3.5 text-[15px] font-semibold text-on-primary shadow-brand transition-all hover:bg-kalam-600 active:scale-[0.98]"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-[11px] border border-border-light bg-white px-6 py-3.5 text-[15px] font-semibold text-ink-secondary transition-colors hover:bg-surface-container"
            >
              Already have an account
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[20px] border border-border bg-white p-7 shadow-card">
            <div className="mb-[18px] flex items-center justify-between">
              <span className="text-xs font-semibold tracking-[0.04em] text-ink-faint">
                SAMPLE RESULT
              </span>
              <span className="rounded-full bg-cefr-b2 px-[11px] py-[3px] text-xs font-bold text-white">
                B1 · Good
              </span>
            </div>

            <div
              dir="rtl"
              lang="ar"
              className="mb-1.5 font-arabic text-[25px] leading-[1.7] text-ink"
            >
              صِفْ مَدِينَتَكَ المُفَضَّلَة
            </div>
            <p className="mb-[22px] text-[13px] text-ink-subtle">
              Describe your favorite city
            </p>

            <div className="grid gap-[11px]">
              {HERO_BARS.map((bar) => (
                <div key={bar.label}>
                  <div className="mb-[5px] flex justify-between text-[12.5px]">
                    <span className="font-medium text-ink-secondary">{bar.label}</span>
                    <span className="font-semibold text-ink-subtle">
                      {bar.score}/5
                    </span>
                  </div>
                  <div className="h-[7px] overflow-hidden rounded-full bg-surface-dim">
                    <div
                      className="h-full rounded-full"
                      style={{ width: bar.pct, backgroundColor: bar.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-[18px] -right-3.5 flex items-center gap-2.5 rounded-[13px] bg-ink px-4 py-3 text-white shadow-[0_16px_30px_-12px_rgba(0,0,0,0.4)]">
            <span className="h-[9px] w-[9px] animate-kpulse rounded-full bg-cefr-b2" />
            <span className="text-[12.5px] font-medium">Score received · real-time</span>
          </div>
        </div>
      </div>
    </section>
  );
}
