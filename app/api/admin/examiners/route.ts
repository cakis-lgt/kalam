import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/roles";
import { isAuthConfigured } from "@/lib/auth/config";
import { fetchExaminerCards } from "@/lib/admin/queries";
import { getMockExaminers } from "@/lib/admin/mock-store";

export const runtime = "nodejs";

export async function GET() {
  if (!isAuthConfigured()) {
    return NextResponse.json({ examiners: getMockExaminers() });
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const examiners = await fetchExaminerCards();
  return NextResponse.json({ examiners });
}
