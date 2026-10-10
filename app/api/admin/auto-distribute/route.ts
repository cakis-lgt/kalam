import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/roles";
import { isAuthConfigured } from "@/lib/auth/config";
import { autoDistributeSessions } from "@/lib/admin/queries";
import { mockAutoDistribute } from "@/lib/admin/mock-store";

export const runtime = "nodejs";

export async function POST() {
  if (!isAuthConfigured()) {
    const result = mockAutoDistribute();
    return NextResponse.json({
      ok: true,
      count: result.count,
      message: result.message,
    });
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await autoDistributeSessions();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    count: result.count,
    message: `${result.count} sesi terdistribusi otomatis`,
  });
}
