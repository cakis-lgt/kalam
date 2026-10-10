import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/auth/config";
import type { Profile } from "@/types/database";
import type { UserRole } from "@/types/database";

export const getAuthUser = cache(async () => {
  if (!isAuthConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCandidateProfile = cache(async (): Promise<Profile | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data as Profile | null;
});

export type PortalUser = {
  userId: string;
  fullName: string;
  role: UserRole;
};

export const getPortalUser = cache(async (): Promise<PortalUser | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const metaRole = user.app_metadata?.role as UserRole | undefined;
  if (metaRole) {
    return {
      userId: user.id,
      fullName:
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "User",
      role: metaRole,
    };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    fullName: profile?.full_name ?? user.email?.split("@")[0] ?? "User",
    role: (profile?.role as UserRole) ?? "candidate",
  };
});
