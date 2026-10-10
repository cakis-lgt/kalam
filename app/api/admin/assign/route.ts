import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/roles";
import { isAuthConfigured } from "@/lib/auth/config";
import { assignSessionToExaminer } from "@/lib/admin/queries";
import { mockAssignSession } from "@/lib/admin/mock-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    sessionId?: string;
    examinerId?: string;
  } | null;

  if (!body?.sessionId || !body?.examinerId) {
    return NextResponse.json(
      { error: "sessionId and examinerId are required" },
      { status: 400 },
    );
  }

  if (!isAuthConfigured()) {
    const result = mockAssignSession(body.sessionId, body.examinerId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ ok: true, message: result.message });
  }

  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await assignSessionToExaminer(
    body.sessionId,
    body.examinerId,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    message: `Session ${result.candidateName} assigned to ${result.examinerName}`,
  });
}
