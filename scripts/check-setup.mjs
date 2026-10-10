/**
 * Check whether Kalam schema exists on the configured Supabase project.
 * Usage: node scripts/check-setup.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  console.log(`Project: ${ref ?? url}\n`);

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tables = ["profiles", "test_sessions", "recordings", "session_results"];
  let ok = true;

  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error?.message.includes("Could not find the table")) {
      console.log(`✗ ${table} — missing`);
      ok = false;
    } else if (error) {
      console.log(`? ${table} — ${error.message}`);
    } else {
      console.log(`✓ ${table}`);
    }
  }

  if (!ok) {
    console.log("\nSchema belum siap. Langkah:");
    console.log("  1. Supabase Dashboard → SQL Editor");
    console.log("  2. Paste scripts/kalam-bootstrap.sql → Run");
    console.log("  3. npm run seed:demo");
    process.exit(1);
  }

  console.log("\n✓ Schema Kalam siap");
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
