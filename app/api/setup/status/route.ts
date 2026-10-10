import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAuthConfigured } from "@/lib/auth/config";

export const runtime = "nodejs";

const REQUIRED_TABLES = ["profiles", "test_sessions", "recordings"] as const;

export async function GET() {
  if (!isAuthConfigured()) {
    return NextResponse.json({
      ready: false,
      reason: "auth_not_configured",
      message: "Supabase is not configured in .env.local.",
    });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({
      ready: false,
      reason: "missing_service_role",
      message:
        "SUPABASE_SERVICE_ROLE_KEY is missing. Add it from Dashboard → Settings → API.",
    });
  }

  const missing: string[] = [];

  for (const table of REQUIRED_TABLES) {
    const { error } = await service.from(table).select("id").limit(1);
    if (error && error.message.includes("Could not find the table")) {
      missing.push(table);
    }
  }

  if (missing.length > 0) {
    return NextResponse.json({
      ready: false,
      reason: "schema_missing",
      missingTables: missing,
      message:
        "ALIKHTIBAR schema has not been applied. Run scripts/kalam-bootstrap.sql in the Supabase SQL Editor, then npm run seed:demo.",
    });
  }

  return NextResponse.json({ ready: true });
}
