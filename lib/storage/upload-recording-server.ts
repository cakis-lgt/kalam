import { createServiceClient } from "@/lib/supabase/service";
import {
  RECORDINGS_BUCKET,
  recordingStoragePath,
} from "@/lib/video/recorder";

export async function uploadRecordingServerSide(
  sessionId: string,
  taskId: string,
  blob: Blob,
  mimeType: string,
): Promise<string> {
  const service = createServiceClient();
  if (!service) {
    throw new Error("Service role Supabase belum dikonfigurasi");
  }

  const path = recordingStoragePath(sessionId, taskId, mimeType);
  const buffer = Buffer.from(await blob.arrayBuffer());

  const { error } = await service.storage
    .from(RECORDINGS_BUCKET)
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}
