import { CandidateSidebar } from "@/components/dashboard/CandidateSidebar";
import { CandidateMobileNav } from "@/components/dashboard/CandidateMobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <CandidateSidebar />
      <div className="lg:ml-64">{children}</div>
      <CandidateMobileNav />
    </div>
  );
}
