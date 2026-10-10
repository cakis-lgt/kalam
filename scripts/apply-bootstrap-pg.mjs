/**
 * Apply scripts/kalam-bootstrap.sql via direct Postgres connection.
 * Requires SUPABASE_DB_URL in .env.local (Settings → Database → Connection string → URI)
 *
 * Usage: node scripts/apply-bootstrap-pg.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

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
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl || !dbUrl.startsWith("postgres")) {
    console.error(
      "SUPABASE_DB_URL (postgresql://...) wajib di .env.local untuk apply bootstrap otomatis.",
    );
    console.error(
      "Alternatif: paste scripts/kalam-bootstrap.sql di Supabase SQL Editor lalu npm run seed:demo",
    );
    process.exit(1);
  }

  const sql = readFileSync(
    resolve(process.cwd(), "scripts/kalam-bootstrap.sql"),
    "utf8",
  );
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log("✓ Schema Kalam applied");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
