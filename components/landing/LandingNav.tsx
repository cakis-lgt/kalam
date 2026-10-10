import Link from "next/link";
import { KalamLogo } from "@/components/ui/KalamLogo";

export function LandingNav() {
  return (
    <nav className="border-b border-border bg-page-alt">
      <div className="mx-auto flex h-[62px] max-w-container-max items-center justify-between px-margin-mobile md:px-gutter">
        <KalamLogo href="/" />

        <div className="flex gap-2.5">
          <Link
            href="/login"
            className="rounded-[10px] border border-border-light bg-white px-[18px] py-[9px] text-[13.5px] font-medium text-ink-secondary transition-colors hover:bg-surface-container"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-[10px] bg-primary px-[18px] py-[9px] text-[13.5px] font-semibold text-on-primary transition-colors hover:bg-kalam-600"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
