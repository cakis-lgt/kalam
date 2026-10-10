"use client";

import { usePathname, useRouter } from "next/navigation";
import { KalamLogo } from "@/components/ui/KalamLogo";
import {
  PortalSidebar,
  PortalSidebarHeader,
  PortalSidebarInfoCard,
  PortalSidebarLink,
  PortalSidebarLogout,
  PortalSidebarNav,
} from "@/components/layout/PortalSidebar";
import {
  LayoutDashboard,
  ClipboardList,
  Brain,
  User,
  Info,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tests", label: "My Tests", icon: ClipboardList },
  { href: "/dashboard/practice", label: "Practice", icon: Brain },
  { href: "/dashboard/profile", label: "Profile", icon: User },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CandidateSidebar() {
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
        <KalamLogo href="/" size="sm" variant="dark" showSubtitle={false} />
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

      <PortalSidebarLogout onLogout={handleLogout} />

      <PortalSidebarInfoCard title="Data Policy" icon={Info}>
        Test video recordings are stored securely for 14 days before permanent
        deletion.
      </PortalSidebarInfoCard>
    </PortalSidebar>
  );
}
