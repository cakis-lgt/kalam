import Link from "next/link";

export function CtaSection() {
  return (
    <section id="pricing" className="px-margin-mobile py-24 text-center md:px-margin-desktop">
      <div className="mx-auto max-w-3xl space-y-8">
        <h2 className="text-display-lg text-primary">
          Ready to measure your Arabic or English speaking ability?
        </h2>
        <p className="text-body-lg text-on-surface-variant">
          Join thousands of learners who have validated their skills against the
          international ALIKHTIBAR standard (Pre-A1–C2).
        </p>
        <div className="pt-6">
          <Link
            href="/register"
            className="inline-block rounded-2xl bg-secondary px-12 py-5 text-headline-lg font-semibold text-on-secondary transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95"
          >
            Register for the Test
          </Link>
          <p className="mt-4 text-label-sm italic text-on-surface-variant">
            Scores are released within 48 business hours after examiner review.
          </p>
        </div>
      </div>
    </section>
  );
}
