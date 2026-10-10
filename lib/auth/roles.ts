import { getAuthUser, getPortalUser } from "@/lib/auth/cached-auth";
import { isAuthConfigured } from "@/lib/auth/config";
import type { UserRole } from "@/types/database";

export async function getCurrentUserRole(): Promise<UserRole | null> {
  if (!isAuthConfigured()) return null;
  const portalUser = await getPortalUser();
  return portalUser?.role ?? null;
}

export async function requireExaminer(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  if (!isAuthConfigured()) {
    return { ok: false, status: 503, error: "Authentication is not configured." };
  }

  const user = await getAuthUser();

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const role = await getCurrentUserRole();
  if (role !== "examiner" && role !== "admin") {
    return { ok: false, status: 403, error: "Examiner access only." };
  }

  return { ok: true, userId: user.id };
}

export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; status: number; error: string }
> {
  if (!isAuthConfigured()) {
    return { ok: false, status: 503, error: "Authentication is not configured." };
  }

  const user = await getAuthUser();

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const role = await getCurrentUserRole();
  if (role !== "admin") {
    return { ok: false, status: 403, error: "Coordinator access only." };
  }

  return { ok: true, userId: user.id };
}
