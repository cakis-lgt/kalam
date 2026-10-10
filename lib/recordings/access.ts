import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/database";

type RecordingRow = {
  id: string;
  session_id: string;
  storage_path: string | null;
};

type SessionRow = {
  id: string;
  candidate_id: string;
  examiner_id: string | null;
};

export async function getRecordingWithAccess(recordingId: string): Promise<
  | { ok: true; recording: RecordingRow; session: SessionRow; role: UserRole; userId: string }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const role = (await getCurrentUserRole()) ?? "candidate";

  const { data: recording, error } = await supabase
    .from("recordings")
    .select("id, session_id, storage_path")
    .eq("id", recordingId)
    .maybeSingle();

  if (error || !recording) {
    return { ok: false, status: 404, error: "Recording not found" };
  }

  const { data: session } = await supabase
    .from("test_sessions")
    .select("id, candidate_id, examiner_id")
    .eq("id", recording.session_id)
    .maybeSingle();

  if (!session) {
    return { ok: false, status: 404, error: "Session not found" };
  }

  const allowed =
    role === "admin" ||
    (role === "candidate" && session.candidate_id === user.id) ||
    (role === "examiner" && session.examiner_id === user.id);

  if (!allowed) {
    return { ok: false, status: 403, error: "Recording access denied" };
  }

  return {
    ok: true,
    recording: recording as RecordingRow,
    session: session as SessionRow,
    role,
    userId: user.id,
  };
}
