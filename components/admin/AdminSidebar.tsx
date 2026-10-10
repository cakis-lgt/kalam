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
import { Share2, UserCog, History } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Distribution", icon: Share2 },
  { href: "/admin/examiners", label: "Examiners", icon: UserCog },
  { href: "/admin/history", label: "History", icon: History },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

type Props = {
  userName?: string;
  userInitials?: string;
};

export function AdminSidebar({
  userName = "Coordinator",
  userInitials = "KO",
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
        <KalamLogo href="/admin" size="sm" variant="dark" showSubtitle={false} />
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
          role="Exam Coordinator"
          accentClass="bg-[#0d4f63] ring-[#0d4f63]/40"
        />
        <PortalSidebarLogout onLogout={handleLogout} />
      </div>
    </PortalSidebar>
  );
}
