import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/roles";
import { isAuthConfigured } from "@/lib/auth/config";
import {
  fetchAdminStats,
  fetchDistributionHistory,
  fetchExaminerCards,
  fetchUnassignedSessions,
} from "@/lib/admin/queries";
import { getMockDistribution } from "@/lib/admin/mock-store";

export const runtime = "nodejs";

export async function GET() {
  if (!isAuthConfigured()) {
    const data = getMockDistribution();
    return NextResponse.json(data);
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const examiners = await fetchExaminerCards();
  const unassigned = await fetchUnassignedSessions(examiners);
  const stats = await fetchAdminStats(examiners, unassigned.length);

  return NextResponse.json({ stats, unassigned, examiners });
}
