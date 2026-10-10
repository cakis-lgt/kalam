import { createServiceClient } from "@/lib/supabase/service";

/** Resolve username to auth email, or pass through if already an email. */
export async function resolveLoginEmail(
  identifier: string,
): Promise<{ email: string | null; error?: string }> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { email: null, error: "Username or email is required" };
  }

  if (trimmed.includes("@")) {
    return { email: trimmed.toLowerCase() };
  }

  const service = createServiceClient();
  if (!service) {
    return {
      email: null,
      error: "Username login is unavailable (service role not configured).",
    };
  }

  const { data, error } = await service
    .from("profiles")
    .select("id")
    .eq("username", trimmed.toLowerCase())
    .maybeSingle();

  if (error) {
    return { email: null, error: error.message };
  }
  if (!data?.id) {
    return { email: null };
  }

  const { data: userData, error: userError } =
    await service.auth.admin.getUserById(data.id);

  if (userError || !userData.user?.email) {
    return { email: null };
  }

  return { email: userData.user.email.toLowerCase() };
}
