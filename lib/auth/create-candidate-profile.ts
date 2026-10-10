import type { RegisterInput } from "@/lib/auth/validation";
import { GONTOR_INSTITUTION } from "@/lib/profile/candidate-fields";
import { createServiceClient } from "@/lib/supabase/service";

function isSchemaCacheColumnError(message: string): boolean {
  return (
    message.includes("schema cache") ||
    message.includes("PGRST204") ||
    message.includes("PGRST202")
  );
}

async function upsertViaRpc(
  service: NonNullable<ReturnType<typeof createServiceClient>>,
  userId: string,
  data: RegisterInput,
): Promise<string | null> {
  const { error } = await service.rpc("kalam_upsert_candidate_profile", {
    p_id: userId,
    p_full_name: data.fullName,
    p_username: data.username,
    p_nim: data.nim,
    p_faculty: data.faculty,
    p_study_program: data.studyProgram,
    p_semester: data.semester,
  });

  return error?.message ?? null;
}

export async function createCandidateProfile(
  userId: string,
  data: RegisterInput,
): Promise<string | null> {
  const service = createServiceClient();
  if (!service) {
    return "SUPABASE_SERVICE_ROLE_KEY is not available to create profile.";
  }

  const { error } = await service.from("profiles").upsert(
    {
      id: userId,
      role: "candidate",
      full_name: data.fullName,
      institution: GONTOR_INSTITUTION,
      username: data.username,
      nim: data.nim,
      faculty: data.faculty,
      study_program: data.studyProgram,
      semester: data.semester,
    },
    { onConflict: "id" },
  );

  if (!error) return null;

  if (isSchemaCacheColumnError(error.message)) {
    const rpcError = await upsertViaRpc(service, userId, data);
    if (!rpcError) return null;
    return rpcError;
  }

  if (error.message.includes("profiles_username_unique")) {
    return "Username is already taken.";
  }
  if (error.message.includes("profiles_nim_unique")) {
    return "NIM is already registered.";
  }

  return error.message;
}
