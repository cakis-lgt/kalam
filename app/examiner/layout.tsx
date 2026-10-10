import { redirect } from "next/navigation";
import { ExaminerSidebar } from "@/components/examiner/ExaminerSidebar";
import { ExaminerMobileNav } from "@/components/examiner/ExaminerMobileNav";
import { getPortalUser } from "@/lib/auth/cached-auth";
import { isAuthConfigured } from "@/lib/auth/config";
import { initialsFromName } from "@/lib/examiner/avatar";

export default async function ExaminerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userName = "Demo Examiner";
  let userInitials = "PG";

  if (isAuthConfigured()) {
    const portalUser = await getPortalUser();
    if (!portalUser) {
      redirect("/login?next=/examiner");
    }
    if (portalUser.role !== "examiner") {
      redirect(portalUser.role === "admin" ? "/admin" : "/dashboard");
    }
    userName = portalUser.fullName;
    userInitials = initialsFromName(portalUser.fullName);
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <ExaminerSidebar userName={userName} userInitials={userInitials} />
      <ExaminerMobileNav />
      <main className="lg:ml-64">
        <div className="mx-auto max-w-[1180px] px-margin-mobile py-8 pb-20 md:px-gutter md:py-10 lg:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}
