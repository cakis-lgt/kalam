import { RECORDINGS_BUCKET } from "@/lib/video/recorder";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const PLAYBACK_TTL_SEC = 3600;

export async function createRecordingPlaybackUrl(
  storagePath: string,
): Promise<{ url: string; expiresIn: number } | { error: string }> {
  const service = createServiceClient();
  const client = service ?? (await createClient());

  const { data, error } = await client.storage
    .from(RECORDINGS_BUCKET)
    .createSignedUrl(storagePath, PLAYBACK_TTL_SEC);

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? "Failed to create playback URL" };
  }

  return { url: data.signedUrl, expiresIn: PLAYBACK_TTL_SEC };
}
