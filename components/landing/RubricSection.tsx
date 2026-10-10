import Link from "next/link";
import { CheckCircle2, ClipboardCheck } from "lucide-react";

const CHECKLIST = [
  "Interactive performance report in radar chart format.",
  "Targeted examiner feedback for areas to improve.",
  "Verifiable digital certificate available online.",
] as const;

const LEVEL_GROUPS = [
  {
    levels: "Pre-A1–A1",
    label: "Pre-beginner & Beginner",
    description: "Basic words, greetings, and simple phrases.",
    colorClass: "text-cefr-pre-a1",
  },
  {
    levels: "A2–B1",
    label: "Lower Intermediate",
    description: "Routine communication and familiar topics.",
    colorClass: "text-cefr-a2",
  },
  {
    levels: "B2–C2",
    label: "Upper Intermediate & Proficient",
    description: "Complex arguments, nuance, and academic fluency.",
    colorClass: "text-cefr-b2",
  },
] as const;

export function RubricSection() {
  return (
    <section id="rubrik" className="bg-primary py-24">
      <div className="mx-auto grid max-w-container-max grid-cols-1 items-center gap-16 px-margin-mobile md:px-margin-desktop lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-display-lg text-on-primary">
            Get Detailed Analysis Based on the Rubric
          </h2>
          <p className="text-body-lg text-on-primary-container">
            More than a number score. We provide qualitative feedback on Fluency,
            Vocabulary, Grammar, and Pronunciation — rated 0–5 per dimension.
          </p>
          <ul className="space-y-4 pt-4">
            {CHECKLIST.map((item) => (
              <li
                key={item}
                className="flex items-center gap-4 text-on-primary"
              >
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-cefr-b2"
                  aria-hidden
                />
                <span className="text-body-md">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-surface-container-lowest/10 p-8 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-4">
            {LEVEL_GROUPS.map(({ levels, label, description, colorClass }) => (
              <div
                key={levels}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
              >
                <div className={`mb-1 text-xl font-bold ${colorClass}`}>
                  {levels}
                </div>
                <div className="font-medium text-white">{label}</div>
                <div className="mt-2 text-sm text-white/60">{description}</div>
              </div>
            ))}
            <Link
              href="/register"
              className="flex flex-col items-center justify-center rounded-2xl border border-primary-fixed/30 bg-primary-container p-6 text-center transition-opacity hover:opacity-90"
            >
              <ClipboardCheck
                className="mb-2 h-10 w-10 text-on-primary-container"
                aria-hidden
              />
              <span className="font-bold text-on-primary-container">
                Get Started
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
