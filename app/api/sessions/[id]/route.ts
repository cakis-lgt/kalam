import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/auth/config";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z
    .enum([
      "in_progress",
      "awaiting_review",
      "under_review",
      "completed",
      "expired",
    ])
    .optional(),
  current_level: z.string().optional(),
  final_level: z.string().optional(),
  progress_json: z.record(z.unknown()).optional(),
  completed_at: z.string().datetime().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("test_sessions")
    .select("*")
    .eq("id", id)
    .eq("candidate_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session: data });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!isAuthConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("test_sessions")
    .update(parsed.data)
    .eq("id", id)
    .eq("candidate_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}
