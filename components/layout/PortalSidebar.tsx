"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";

export function PortalSidebar({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={`fixed left-0 hidden h-screen w-64 flex-col border-r border-white/[0.06] bg-gradient-to-b from-[#101820] via-[#0c1218] to-[#090e13] p-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.03)] lg:flex ${className}`}
    >
      {children}
    </aside>
  );
}

export function PortalSidebarHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center border-b border-white/[0.06] px-2 pb-5 pt-1">
      {children}
    </div>
  );
}

export function PortalSidebarNav({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <nav className={`flex flex-grow flex-col gap-0.5 ${className}`}>{children}</nav>
  );
}

export function PortalSidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-transparent text-teal-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
      }`}
    >
      <SidebarLinkPending />
      {active && (
        <span
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-teal-400/90"
          aria-hidden
        />
      )}
      <Icon
        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
          active ? "text-teal-300" : "text-slate-500 group-hover:text-slate-300"
        }`}
        aria-hidden
      />
      <span>{label}</span>
    </Link>
  );
}

function SidebarLinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 animate-pulse rounded-full bg-teal-300"
      aria-hidden
    />
  );
}

export function PortalSidebarUser({
  name,
  initials,
  role,
  accentClass = "bg-teal-700/80 ring-teal-400/20",
}: {
  name: string;
  initials: string;
  role: string;
  accentClass?: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.03] px-3.5 py-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ring-1 ${accentClass}`}
      >
        {initials}
      </div>
      <div className="min-w-0 flex flex-col leading-tight">
        <span className="truncate text-[13px] font-medium text-slate-200">{name}</span>
        <span className="text-[11px] text-slate-500">{role}</span>
      </div>
    </div>
  );
}

export function PortalSidebarLogout({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      type="button"
      onClick={onLogout}
      className="mb-3 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium text-slate-500 transition-all hover:bg-rose-500/[0.08] hover:text-rose-200/90"
    >
      <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
      <span>Logout</span>
    </button>
  );
}

export function PortalSidebarInfoCard({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="mt-auto flex flex-col gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-teal-400/80" aria-hidden />
        <span className="text-[12px] font-semibold tracking-wide text-slate-300">
          {title}
        </span>
      </div>
      <p className="text-[11.5px] leading-relaxed text-slate-500">{children}</p>
    </div>
  );
}
