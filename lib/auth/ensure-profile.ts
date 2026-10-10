import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types/database";
import {
  DEMO_ACCOUNTS,
  getDemoAccountByEmail,
} from "@/lib/auth/demo-accounts";
import { GONTOR_INSTITUTION } from "@/lib/profile/candidate-fields";
import { createServiceClient } from "@/lib/supabase/service";

function profilePayload(user: User) {
  const demo = user.email ? getDemoAccountByEmail(user.email) : undefined;
  const metaRole = user.app_metadata?.role as UserRole | undefined;
  const role: UserRole =
    metaRole ??
    (demo?.role as UserRole | undefined) ??
    "candidate";
  const meta = user.user_metadata ?? {};
  const fullName =
    (meta.full_name as string | undefined) ??
    demo?.fullName ??
    user.email?.split("@")[0] ??
    "Peserta";
  const institution =
    demo?.institution ??
    (meta.institution as string | undefined) ??
    GONTOR_INSTITUTION;

  const payload: Record<string, unknown> = {
    id: user.id,
    role,
    full_name: fullName,
    institution,
  };

  const username = meta.username as string | undefined;
  if (username) payload.username = username.toLowerCase();
  if (meta.gender) payload.gender = meta.gender;
  if (meta.nim) payload.nim = meta.nim;
  if (meta.campus) payload.campus = meta.campus;
  if (meta.faculty) payload.faculty = meta.faculty;
  if (meta.study_program) payload.study_program = meta.study_program;
  if (typeof meta.semester === "number") payload.semester = meta.semester;
  if (meta.preferred_language) {
    payload.preferred_language = meta.preferred_language;
  }

  return payload;
}

/** Upsert profile row so FK test_sessions.candidate_id works after auth signup/seed. */
export async function ensureProfileForUser(user: User): Promise<string | null> {
  const service = createServiceClient();
  if (!service) {
    return "SUPABASE_SERVICE_ROLE_KEY is not available to create profile.";
  }

  const { error } = await service
    .from("profiles")
    .upsert(profilePayload(user), { onConflict: "id" });

  return error?.message ?? null;
}

export function demoProfileDefaults(email: string) {
  return DEMO_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.toLowerCase(),
  );
}
