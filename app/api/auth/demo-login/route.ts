import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isAuthConfigured } from "@/lib/auth/config";
import {
  DEMO_PASSWORD,
  getDemoAccountByRole,
  type DemoRole,
} from "@/lib/auth/demo-accounts";

export const runtime = "nodejs";

const schema = z.object({
  role: z.enum(["candidate", "examiner", "admin"]),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid demo role" }, { status: 400 });
  }

  const account = getDemoAccountByRole(parsed.data.role as DemoRole);
  if (!account) {
    return NextResponse.json({ error: "Demo account not found" }, { status: 404 });
  }

  if (!isAuthConfigured()) {
    return NextResponse.json({ redirect: account.redirect });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: DEMO_PASSWORD,
  });

  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? `Akun demo belum dibuat. Jalankan: npm run seed:demo`
        : error.message;
    return NextResponse.json({ error: message }, { status: 401 });
  }

  return NextResponse.json({ redirect: account.redirect });
}
