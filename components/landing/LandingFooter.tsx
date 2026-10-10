import Link from "next/link";
import { KalamLogo } from "@/components/ui/KalamLogo";

const FOOTER_COLS = [
  {
    title: "Product",
    links: ["Features", "ALIKHTIBAR Rubric", "Pricing", "FAQ"],
  },
  {
    title: "Institutions",
    links: ["UNIDA Gontor", "Partnerships", "Examiner Demo", "Contact"],
  },
  {
    title: "Support",
    links: ["Help Center", "Privacy", "Terms", "Status"],
  },
] as const;

export function LandingFooter() {
  return (
    <footer className="mt-6 bg-ink text-ink-faint">
      <div className="mx-auto grid max-w-container-max grid-cols-1 gap-10 px-margin-mobile py-[52px] md:grid-cols-[1.5fr_1fr_1fr_1fr] md:px-gutter">
        <div>
          <KalamLogo href="/" variant="dark" size="lg" className="mb-4" />
          <p className="mb-[18px] max-w-[300px] text-[13.5px] leading-[1.6]">
            ALIKHTIBAR-standard Arabic & English speaking test platform — self-paced
            video recording, scored directly by experienced examiners.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-border-dark bg-test-surface px-[11px] py-[5px] text-[11.5px] font-semibold text-primary-fixed-dim">
              Arabic & English
            </span>
            <span className="rounded-full border border-border-dark bg-test-surface px-[11px] py-[5px] text-[11.5px] font-semibold text-primary-fixed-dim">
              Pre-A1 – C2
            </span>
          </div>
        </div>

        {FOOTER_COLS.map((col) => (
          <div key={col.title}>
            <div className="mb-3.5 text-xs font-bold tracking-[0.04em] text-slate-200">
              {col.title}
            </div>
            <div className="flex flex-col gap-[11px]">
              {col.links.map((link) => (
                <Link
                  key={link}
                  href="#"
                  className="text-[13.5px] transition-colors hover:text-primary-fixed-dim"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-3 border-t border-border-dark px-margin-mobile py-7 md:flex-row md:px-gutter">
        <span className="text-[12.5px] text-ink-subtle">
          © {new Date().getFullYear()} ALIKHTIBAR · Universitas Darussalam Gontor
        </span>
        <div className="flex items-center gap-5">
          <Link href="#" className="text-[12.5px] transition-colors hover:text-primary-fixed-dim">
            Privacy Policy
          </Link>
          <Link href="#" className="text-[12.5px] transition-colors hover:text-primary-fixed-dim">
            Terms of Service
          </Link>
          <span className="text-[12.5px] text-ink-subtle">🌐 English</span>
        </div>
      </div>
    </footer>
  );
}
