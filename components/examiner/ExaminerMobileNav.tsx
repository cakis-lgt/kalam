"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListOrdered, History } from "lucide-react";

const NAV = [
  { href: "/examiner", label: "Queue", icon: ListOrdered },
  { href: "/examiner/history", label: "History", icon: History },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/examiner") {
    return (
      pathname === "/examiner" || pathname.startsWith("/examiner/sessions/")
    );
  }
  return pathname.startsWith(href);
}

export function ExaminerMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t border-outline-variant bg-surface p-2 lg:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center p-2 ${
              active ? "font-bold text-primary" : "text-on-surface-variant"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="text-[10px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
