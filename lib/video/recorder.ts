export function pickSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "video/webm";
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "video/webm";
}

export function videoExtensionForMime(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

export const RECORDINGS_BUCKET = "kalam-recordings";

export function recordingStoragePath(
  sessionId: string,
  taskId: string,
  mime: string,
): string {
  const ext = videoExtensionForMime(mime);
  return `${sessionId}/${taskId}.${ext}`;
}

const MAX_RETRIES = 3;

export async function uploadRecordingWithRetry(
  uploadFn: () => Promise<{ error: Error | null }>,
): Promise<void> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { error } = await uploadFn();
    if (!error) return;
    lastError = error;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
  }
  throw lastError ?? new Error("Upload failed after several attempts.");
}
