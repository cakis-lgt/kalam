/**
 * Apply Kalam SQL migrations to a remote Supabase project.
 *
 * Option A — SQL Editor (no extra env):
 *   Open Dashboard → SQL → paste scripts/kalam-bootstrap.sql → Run
 *
 * Option B — CLI with database URI:
 *   Add SUPABASE_DB_URL to .env.local (Settings → Database → Connection string → URI)
 *   npm run bootstrap:supabase
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
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

function buildBootstrapSql() {
  const dir = resolve(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  return files.map((f) => readFileSync(join(dir, f), "utf8")).join("\n\n");
}

function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.SUPABASE_DB_URL;

  console.log("Kalam Supabase bootstrap\n");

  if (!url) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
    process.exit(1);
  }

  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "?";
  console.log(`Project: ${ref}`);

  const sql = buildBootstrapSql();
  const outPath = resolve(process.cwd(), "scripts/kalam-bootstrap.sql");
  if (!existsSync(outPath) || readFileSync(outPath, "utf8") !== sql) {
    writeFileSync(outPath, sql);
  }

  if (!serviceKey) {
    console.log("\n⚠  SUPABASE_SERVICE_ROLE_KEY belum ada di .env.local");
    console.log("   Dashboard → Project Settings → API → service_role\n");
  }

  if (!dbUrl) {
    console.log("Schema belum bisa di-apply otomatis tanpa SUPABASE_DB_URL.");
    console.log("\nLangkah manual (paling mudah):");
    console.log("  1. Buka Supabase Dashboard → SQL Editor");
    console.log(`  2. Paste isi file: scripts/kalam-bootstrap.sql`);
    console.log("  3. Klik Run");
    console.log("  4. Tambahkan SUPABASE_SERVICE_ROLE_KEY ke .env.local");
    console.log("  5. npm run seed:demo && npm run dev\n");
    process.exit(serviceKey ? 0 : 1);
  }

  const psql = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", outPath], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (psql.error?.code === "ENOENT") {
    console.error("psql tidak ditemukan. Install PostgreSQL client atau gunakan SQL Editor.");
    process.exit(1);
  }

  if (psql.status !== 0) {
    console.error(psql.stderr || psql.stdout);
    process.exit(psql.status ?? 1);
  }

  console.log("✓ Schema applied via psql");
  if (serviceKey) {
    console.log("\nSelanjutnya: npm run seed:demo");
  }
}

main();
