import { NextRequest, NextResponse } from "next/server";
import { requireExaminer } from "@/lib/auth/roles";
import {
  fetchExaminerQueue,
  fetchExaminerStats,
} from "@/lib/examiner/queries";
import {
  MOCK_EXAMINER_QUEUE,
  type QueueFilter,
} from "@/lib/examiner/mock-data";
import { isAuthConfigured } from "@/lib/auth/config";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const filter = (req.nextUrl.searchParams.get("filter") ??
    "pending") as QueueFilter;

  if (!isAuthConfigured()) {
    const filtered = MOCK_EXAMINER_QUEUE.filter((q) => {
      if (filter === "pending") return q.status === "awaiting_review";
      if (filter === "claimed") return q.status === "under_review";
      return q.status === "completed";
    });
    const stats = {
      pending: MOCK_EXAMINER_QUEUE.filter((q) => q.status === "awaiting_review")
        .length,
      claimed: MOCK_EXAMINER_QUEUE.filter((q) => q.status === "under_review")
        .length,
      completed: MOCK_EXAMINER_QUEUE.filter((q) => q.status === "completed")
        .length,
      totalToday: MOCK_EXAMINER_QUEUE.length,
    };
    return NextResponse.json({ items: filtered, stats });
  }

  const auth = await requireExaminer();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [items, stats] = await Promise.all([
    fetchExaminerQueue(auth.userId, filter),
    fetchExaminerStats(auth.userId),
  ]);

  return NextResponse.json({ items, stats });
}
