import { NextResponse } from "next/server";
import { requireExaminer } from "@/lib/auth/roles";
import { fetchExaminerHistory } from "@/lib/examiner/queries";
import { MOCK_EXAMINER_HISTORY } from "@/lib/examiner/mock-data";
import { isAuthConfigured } from "@/lib/auth/config";

export const runtime = "nodejs";

export async function GET() {
  if (!isAuthConfigured()) {
    return NextResponse.json({ items: MOCK_EXAMINER_HISTORY });
  }

  const auth = await requireExaminer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const items = await fetchExaminerHistory(auth.userId);
  return NextResponse.json({ items });
}
