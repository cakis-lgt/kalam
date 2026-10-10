import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { getPortalUser } from "@/lib/auth/cached-auth";
import { isAuthConfigured } from "@/lib/auth/config";
import { initialsFromName } from "@/lib/examiner/avatar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userName = "Demo Exam Coordinator";
  let userInitials = "KO";

  if (isAuthConfigured()) {
    const portalUser = await getPortalUser();
    if (!portalUser) {
      redirect("/login?next=/admin");
    }
    if (portalUser.role !== "admin") {
      redirect(
        portalUser.role === "examiner" ? "/examiner" : "/dashboard",
      );
    }
    userName = portalUser.fullName;
    userInitials = initialsFromName(portalUser.fullName);
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <AdminSidebar userName={userName} userInitials={userInitials} />
      <AdminMobileNav />
      <main className="lg:ml-64">
        <div className="mx-auto max-w-[1180px] px-margin-mobile py-8 pb-20 md:px-gutter md:py-10 lg:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}
