"use client";

import { usePathname, useRouter } from "next/navigation";
import { KalamLogo } from "@/components/ui/KalamLogo";
import {
  PortalSidebar,
  PortalSidebarHeader,
  PortalSidebarLink,
  PortalSidebarLogout,
  PortalSidebarNav,
  PortalSidebarUser,
} from "@/components/layout/PortalSidebar";
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

type Props = {
  userName?: string;
  userInitials?: string;
};

export function ExaminerSidebar({
  userName = "Examiner",
  userInitials = "EX",
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <PortalSidebar>
      <PortalSidebarHeader>
        <KalamLogo href="/examiner" size="sm" variant="dark" showSubtitle={false} />
      </PortalSidebarHeader>

      <PortalSidebarNav>
        {NAV.map(({ href, label, icon }) => (
          <PortalSidebarLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={isActive(pathname, href)}
          />
        ))}
      </PortalSidebarNav>

      <div className="mt-auto">
        <PortalSidebarUser
          name={userName}
          initials={userInitials}
          role="ALIKHTIBAR Examiner"
          accentClass="bg-violet-700/80 ring-violet-400/20"
        />
        <PortalSidebarLogout onLogout={handleLogout} />
      </div>
    </PortalSidebar>
  );
}
