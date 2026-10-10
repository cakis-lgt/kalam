/**
 * Seed akun demo ke Supabase Auth + profiles.
 * Butuh SUPABASE_SERVICE_ROLE_KEY di .env.local
 *
 * Usage: npm run seed:demo
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DEMO_PASSWORD = "DemoKalam1!";

const ACCOUNTS = [
  {
    role: "candidate",
    email: "peserta@demo.kalam.app",
    fullName: "Ahmad Fauzan",
    institution: "Universitas Darussalam Gontor",
    username: "ahmad.fauzan",
    gender: "male",
    nim: "2021001001",
    campus: "A",
    faculty: "Fakultas Tarbiyah",
    studyProgram: "Pendidikan Bahasa Arab (PBA)",
    semester: 5,
    preferredLanguage: "ar",
  },
  {
    role: "examiner",
    email: "penguji@demo.kalam.app",
    fullName: "Ustadz Fadhil",
    institution: "Universitas Darussalam Gontor",
  },
  {
    role: "admin",
    email: "admin@demo.kalam.app",
    fullName: "Koord. Ujian",
    institution: "Universitas Darussalam Gontor",
  },
];

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

function profilePayload(account, userId) {
  const base = {
    id: userId,
    role: account.role,
    full_name: account.fullName,
    institution: account.institution,
  };

  if (account.role !== "candidate") return base;

  return {
    ...base,
    username: account.username,
    gender: account.gender,
    nim: account.nim,
    campus: account.campus,
    faculty: account.faculty,
    study_program: account.studyProgram,
    semester: account.semester,
    preferred_language: account.preferredLanguage,
  };
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    console.error(
      "Pastikan baris SUPABASE_SERVICE_ROLE_KEY tidak diawali # (bukan comment).",
    );
    process.exit(1);
  }

  const urlRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  let keyRef = "";
  try {
    keyRef = JSON.parse(
      Buffer.from(serviceKey.split(".")[1], "base64url").toString(),
    ).ref;
  } catch {
    /* ignore */
  }
  if (urlRef && keyRef && urlRef !== keyRef) {
    console.error(
      `Project mismatch: URL=${urlRef} but service role key is for ${keyRef}.`,
    );
    console.error("Gunakan kunci dari project yang sama di Dashboard → API.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const account of ACCOUNTS) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find(
      (u) => u.email?.toLowerCase() === account.email.toLowerCase(),
    );

    let userId = existing?.id;

    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        app_metadata: { role: account.role },
        user_metadata: {
          full_name: account.fullName,
          ...(account.username ? { username: account.username } : {}),
        },
      });
      if (error) {
        console.error(`Update ${account.email} failed:`, error.message);
        continue;
      }
      console.log(`Updated demo user: ${account.email}`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: account.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        app_metadata: { role: account.role },
        user_metadata: {
          full_name: account.fullName,
          ...(account.username ? { username: account.username } : {}),
        },
      });
      if (error || !data.user) {
        console.error(`Create ${account.email} failed:`, error?.message);
        continue;
      }
      userId = data.user.id;
      console.log(`Created demo user: ${account.email}`);
    }

    if (!userId) continue;

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload(account, userId), { onConflict: "id" });

    if (profileError) {
      console.error(`Profile ${account.email}:`, profileError.message);
    } else {
      console.log(`  → profile role=${account.role}`);
    }
  }

  console.log("\nDemo accounts ready:");
  console.log("  Password for all:", DEMO_PASSWORD);
  for (const a of ACCOUNTS) {
    const extra = a.username ? ` (username: ${a.username})` : "";
    console.log(`  ${a.role.padEnd(10)} ${a.email}${extra}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
