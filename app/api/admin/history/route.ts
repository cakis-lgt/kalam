import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/roles";
import { isAuthConfigured } from "@/lib/auth/config";
import {
  fetchDistributionHistory,
  fetchExaminerCards,
} from "@/lib/admin/queries";
import { getMockExaminers, getMockHistory } from "@/lib/admin/mock-store";

export const runtime = "nodejs";

export async function GET() {
  if (!isAuthConfigured()) {
    return NextResponse.json({
      items: getMockHistory(),
      examiners: getMockExaminers(),
    });
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [items, examiners] = await Promise.all([
    fetchDistributionHistory(),
    fetchExaminerCards(),
  ]);

  return NextResponse.json({ items, examiners });
}
