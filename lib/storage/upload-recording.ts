import { createClient } from "@/lib/supabase/client";
import {
  RECORDINGS_BUCKET,
  recordingStoragePath,
  uploadRecordingWithRetry,
} from "@/lib/video/recorder";

export async function uploadSessionRecording(
  sessionId: string,
  taskId: string,
  blob: Blob,
  mimeType: string,
): Promise<string> {
  const supabase = createClient();
  const path = recordingStoragePath(sessionId, taskId, mimeType);

  await uploadRecordingWithRetry(async () => {
    const { error } = await supabase.storage
      .from(RECORDINGS_BUCKET)
      .upload(path, blob, {
        contentType: mimeType,
        upsert: true,
      });
    return { error: error ? new Error(error.message) : null };
  });

  return path;
}
