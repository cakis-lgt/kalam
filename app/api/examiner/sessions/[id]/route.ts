import { NextRequest, NextResponse } from "next/server";
import { requireExaminer } from "@/lib/auth/roles";
import {
  claimSession,
  fetchExaminerReviewSession,
} from "@/lib/examiner/queries";
import { MOCK_REVIEW_SESSION } from "@/lib/examiner/mock-data";
import { isAuthConfigured } from "@/lib/auth/config";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!isAuthConfigured()) {
    return NextResponse.json({
      session: { ...MOCK_REVIEW_SESSION, id },
    });
  }

  const auth = await requireExaminer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const session = await fetchExaminerReviewSession(id, auth.userId);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

export async function POST(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!isAuthConfigured()) {
    return NextResponse.json({ ok: true, sessionId: id });
  }

  const auth = await requireExaminer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await claimSession(id, auth.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ ok: true, sessionId: id });
}
