import { NextRequest, NextResponse } from "next/server";
import { getRecordingWithAccess } from "@/lib/recordings/access";
import { createRecordingPlaybackUrl } from "@/lib/storage/signed-playback-url";
import { isAuthConfigured } from "@/lib/auth/config";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (!isAuthConfigured()) {
    return NextResponse.json({ url: null, mock: true });
  }

  const access = await getRecordingWithAccess(id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { storage_path: storagePath } = access.recording;
  if (!storagePath) {
    return NextResponse.json({ error: "Recording file not available yet" }, { status: 404 });
  }

  const signed = await createRecordingPlaybackUrl(storagePath);
  if ("error" in signed) {
    return NextResponse.json({ error: signed.error }, { status: 500 });
  }

  return NextResponse.json({
    url: signed.url,
    expiresIn: signed.expiresIn,
  });
}
