import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { isAuthConfigured } from "@/lib/auth/config";
import { fetchCandidateProfilePageData } from "@/lib/dashboard/queries";

export const metadata: Metadata = {
  title: "Profile — ALIKHTIBAR",
};

export default async function ProfilePage() {
  if (!isAuthConfigured()) {
    return (
      <main className="mx-auto max-w-[980px] px-margin-mobile pb-16 pt-10 md:px-gutter">
        <h1 className="font-heading text-[30px] font-semibold text-ink">Profile</h1>
        <p className="mt-4 text-sm text-ink-subtle">
          Sign in with Supabase configured to view your profile.
        </p>
      </main>
    );
  }

  const data = await fetchCandidateProfilePageData();
  if (!data) {
    redirect("/login?next=/dashboard/profile");
  }

  return (
    <main className="mx-auto max-w-[980px] px-margin-mobile pb-16 pt-10 md:px-gutter">
      <h1 className="font-heading text-[30px] font-semibold text-ink">Profile</h1>
      <p className="mt-1 text-[14.5px] text-ink-subtle">
        Manage your registered candidate information.
      </p>

      <ProfileEditor data={data} />
    </main>
  );
}
