"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KalamLogo } from "@/components/ui/KalamLogo";

type NavLink = {
  href: string;
  label: string;
};

type Props = {
  userName?: string;
  roleLabel?: string;
  userInitials?: string;
  avatarBg?: string;
  navLinks?: NavLink[];
};

const DEFAULT_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/profile", label: "Profile" },
];

function initialsFromName(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppNav({
  userName = "Candidate",
  roleLabel = "Test Candidate",
  userInitials,
  avatarBg = "#156c84",
  navLinks = DEFAULT_LINKS,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = userInitials ?? initialsFromName(userName);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[rgba(250,248,243,0.86)] backdrop-blur-xl">
      <div className="mx-auto flex h-[62px] max-w-container-max items-center justify-between px-margin-mobile md:px-gutter">
        <KalamLogo href="/dashboard" />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors ${
                  active
                    ? "bg-primary-container text-on-primary-container"
                    : "text-ink-muted hover:bg-surface-container hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3.5">
          <div className="hidden items-center gap-2.5 sm:flex">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: avatarBg }}
            >
              {initials}
            </div>
            <div className="flex flex-col leading-[1.2]">
              <span className="text-[13px] font-semibold text-ink">{userName}</span>
              <span className="text-[11px] text-ink-faint">{roleLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-[9px] border border-border-light bg-white px-3.5 py-[7px] text-[12.5px] font-medium text-ink-muted transition-colors hover:bg-surface-container"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
