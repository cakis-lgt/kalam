import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pickTaskForLevel } from "@/lib/cefr/tasks";
import { CEFR_LEVELS, TEST_LANGUAGES, type CEFRLevelEnum } from "@/types";

export const runtime = "nodejs";

const NextTaskSchema = z.object({
  level: z.enum(CEFR_LEVELS as unknown as CEFRLevelEnum),
  language: z.enum(TEST_LANGUAGES).default("ar"),
  excludeIds: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = NextTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Request body invalid", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { level, language, excludeIds } = parsed.data;
    const task = pickTaskForLevel(level, language, excludeIds);
    if (!task) {
      return NextResponse.json(
        { error: `No task available for level ${level} (${language})` },
        { status: 404 },
      );
    }

    return NextResponse.json({ task });
  } catch (err) {
    console.error("[next-task] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
