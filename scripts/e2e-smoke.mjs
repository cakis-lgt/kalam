/**
 * End-to-end smoke test (RLS + auth clients): peserta → sesi → penguji publish → hasil
 * Usage: node scripts/e2e-smoke.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DEMO_PASSWORD = "DemoKalam1!";

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function signIn(supabase, email) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });
  if (error) throw new Error(`Login ${email}: ${error.message}`);
  return data.session;
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  assert(url && anon, "Missing Supabase env in .env.local");

  const candidateClient = createClient(url, anon);
  const examinerClient = createClient(url, anon);
  const adminClient = createClient(url, anon);

  console.log("1. Login demo accounts…");
  await signIn(candidateClient, "peserta@demo.kalam.app");
  await signIn(examinerClient, "penguji@demo.kalam.app");
  await signIn(adminClient, "admin@demo.kalam.app");

  const {
    data: { user: candidateUser },
  } = await candidateClient.auth.getUser();
  const {
    data: { user: examinerUser },
  } = await examinerClient.auth.getUser();
  assert(candidateUser && examinerUser, "Missing auth users");

  console.log("2. Cek schema profiles…");
  const { error: profileErr } = await candidateClient
    .from("profiles")
    .select("id")
    .limit(1);
  if (profileErr?.code === "PGRST205") {
    throw new Error(
      "Tabel profiles belum ada. Jalankan scripts/kalam-bootstrap.sql di SQL Editor, lalu npm run seed:demo",
    );
  }
  assert(!profileErr, `Schema: ${profileErr?.message}`);

  console.log("3. Peserta buat sesi…");
  const { data: sessionRow, error: sessionErr } = await candidateClient
    .from("test_sessions")
    .insert({
      candidate_id: candidateUser.id,
      status: "awaiting_review",
      current_level: "Pre-A1",
      final_level: "Pre-A1",
      progress_json: {
        currentLevelIdx: 0,
        attempts: [
          { taskId: "pre-a1-muq-1", taskLevel: "Pre-A1", overall: 0, passed: false },
          { taskId: "pre-a1-muq-2", taskLevel: "Pre-A1", overall: 0, passed: false },
        ],
      },
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  assert(!sessionErr, `Create session: ${sessionErr?.message}`);
  const sessionId = sessionRow.id;

  console.log("4. Peserta upload metadata rekaman (2 tugas, mode manual)…");
  for (const taskId of ["pre-a1-muq-1", "pre-a1-muq-2"]) {
    const { error: recErr } = await candidateClient.from("recordings").upsert(
      {
        session_id: sessionId,
        task_id: taskId,
        storage_path: `${sessionId}/${taskId}.webm`,
        duration_sec: 32,
        file_size_bytes: 850000,
        warning_count: 0,
        eye_contact_avg: 0.68,
        transcript: null,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: "session_id,task_id" },
    );
    assert(!recErr, `Recording ${taskId}: ${recErr?.message}`);
  }

  const { count: recCount } = await candidateClient
    .from("recordings")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);
  assert(recCount === 2, `Expected 2 recordings, got ${recCount}`);

  console.log("5. Penguji klaim sesi…");
  const { data: claimed, error: claimErr } = await examinerClient
    .from("test_sessions")
    .update({ examiner_id: examinerUser.id, status: "under_review" })
    .eq("id", sessionId)
    .eq("status", "awaiting_review")
    .is("examiner_id", null)
    .select("id");
  assert(!claimErr, `Claim: ${claimErr?.message}`);
  assert(claimed?.length === 1, "Claim gagal (0 baris) — cek RLS examiner claim");

  console.log("6. Penguji publish nilai…");
  const scores = {
    pronunciation: 4,
    fluency: 3,
    grammar: 4,
    vocabulary: 3,
    coherence: 4,
    interaction: 3,
  };
  const publishedAt = new Date().toISOString();
  const { error: resultErr } = await examinerClient.from("session_results").upsert(
    {
      session_id: sessionId,
      examiner_id: examinerUser.id,
      overall_level: "Pre-A1",
      dimension_scores: scores,
      dimension_notes: {},
      summary: "Peserta komunikatif dengan pelafalan cukup jelas.",
      published_at: publishedAt,
      updated_at: publishedAt,
    },
    { onConflict: "session_id" },
  );
  assert(!resultErr, `Publish results: ${resultErr?.message}`);

  const { error: completeErr } = await examinerClient
    .from("test_sessions")
    .update({ status: "completed", final_level: "Pre-A1" })
    .eq("id", sessionId);
  assert(!completeErr, `Complete session: ${completeErr?.message}`);

  console.log("7. Peserta baca hasil…");
  const { data: published, error: readErr } = await candidateClient
    .from("session_results")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();
  assert(!readErr, `Read results: ${readErr?.message}`);
  assert(published?.published_at, "Hasil belum published");
  assert(published?.overall_level === "Pre-A1", "overall_level mismatch");

  console.log("8. Admin lihat distribusi…");
  const { error: adminReadErr } = await adminClient
    .from("test_sessions")
    .select("id")
    .eq("status", "completed")
    .limit(5);
  assert(!adminReadErr, `Admin read: ${adminReadErr?.message}`);

  if (serviceKey) {
    const urlRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    let keyRef = "";
    try {
      keyRef = JSON.parse(
        Buffer.from(serviceKey.split(".")[1], "base64url").toString(),
      ).ref;
    } catch {
      /* ignore */
    }
    if (!urlRef || !keyRef || urlRef === keyRef) {
      console.log("9. Cleanup…");
      const admin = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      await admin.from("session_results").delete().eq("session_id", sessionId);
      await admin.from("recordings").delete().eq("session_id", sessionId);
      await admin.from("test_sessions").delete().eq("id", sessionId);
    }
  }

  console.log("\n✓ E2E smoke test passed");
}

main().catch((e) => {
  console.error("\n✗ E2E failed:", e.message || e);
  process.exit(1);
});
