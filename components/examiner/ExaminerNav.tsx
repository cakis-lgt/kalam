"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KalamLogo } from "@/components/ui/KalamLogo";

const NAV = [
  { href: "/examiner", label: "Queue" },
  { href: "/examiner/history", label: "History" },
] as const;

type Props = {
  userName?: string;
  userInitials?: string;
};

export function ExaminerNav({ userName = "Examiner", userInitials = "EX" }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[rgba(250,248,243,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex h-[62px] max-w-[1180px] items-center justify-between px-margin-mobile md:px-gutter">
        <KalamLogo href="/examiner" />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/examiner"
                ? pathname === "/examiner"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors ${
                  active
                    ? "bg-primary-container text-on-primary-container"
                    : "text-ink-muted hover:bg-surface-container hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3.5">
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7c3aed] text-xs font-semibold text-white">
              {userInitials}
            </div>
            <div className="flex flex-col leading-[1.2]">
              <span className="text-[13px] font-semibold text-ink">{userName}</span>
              <span className="text-[11px] text-ink-faint">ALIKHTIBAR Examiner</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-[9px] border border-border-light bg-white px-3.5 py-[7px] text-[12.5px] font-medium text-ink-muted hover:bg-surface-container"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
