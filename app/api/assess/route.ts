import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAiScoringEnabled } from "@/lib/ai/config";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/anthropic";
import {
  buildSystemPrompt,
  buildUserMessage,
} from "@/lib/cefr/prompt";
import { getTaskById } from "@/lib/cefr/tasks";
import { SCORE_SCALE } from "@/lib/cefr/rubric";
import { CEFR_LEVELS, type CEFRLevelEnum } from "@/types";
import {
  isAssessDevMockEnabled,
  mockAssessment,
} from "@/lib/assess/dev-mock";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const scoreMax = SCORE_SCALE.max;

const AssessRequestSchema = z.object({
  taskId: z.string(),
  transcript: z.string(),
  audioDurationSec: z.number().nonnegative(),
});

const AssessmentResultSchema = z.object({
  level: z.enum(CEFR_LEVELS as unknown as CEFRLevelEnum),
  scores: z.object({
    pronunciation: z.number().min(0).max(scoreMax),
    fluency: z.number().min(0).max(scoreMax),
    grammar: z.number().min(0).max(scoreMax),
    vocabulary: z.number().min(0).max(scoreMax),
    coherence: z.number().min(0).max(scoreMax),
  }),
  overall: z.number().min(0).max(scoreMax),
  passed: z.boolean(),
  strengths_id: z.array(z.string()),
  weaknesses_id: z.array(z.string()),
  feedback_id: z.string(),
  examples_correction: z.array(
    z.object({
      user_said: z.string(),
      should_be: z.string(),
      why: z.string(),
    }),
  ),
});

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

export async function POST(req: NextRequest) {
  try {
    // AI scoring is billable — cap per client to control cost and abuse.
    const limited = enforceRateLimit(`assess:${clientIp(req)}`, {
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;

    if (!isAiScoringEnabled()) {
      return NextResponse.json(
        { error: "AI scoring is disabled. Use the manual scoring flow." },
        { status: 503 },
      );
    }

    const body = await req.json();
    const parsed = AssessRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Request body invalid", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { taskId, transcript, audioDurationSec } = parsed.data;
    const task = getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: `Task ${taskId} not found` },
        { status: 404 },
      );
    }

    if (isAssessDevMockEnabled()) {
      return NextResponse.json(mockAssessment(task));
    }

    const anthropic = getAnthropicClient();
    const systemPrompt = buildSystemPrompt();
    const userMessage = buildUserMessage(task, transcript, audioDurationSec);

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Claude did not return a text response" },
        { status: 500 },
      );
    }

    const rawJson = stripJsonFences(textBlock.text);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawJson);
    } catch {
      console.error("[assess] JSON parse failed:", rawJson);
      return NextResponse.json(
        { error: "Claude response is not valid JSON", raw: rawJson },
        { status: 502 },
      );
    }

    const validated = AssessmentResultSchema.safeParse(parsedJson);
    if (!validated.success) {
      console.error("[assess] schema mismatch:", validated.error.issues);
      return NextResponse.json(
        {
          error: "Claude response does not match schema",
          details: validated.error.issues,
        },
        { status: 502 },
      );
    }

    const result = validated.data;
    // Recompute overall to ensure consistency (Claude might round differently)
    const recomputedOverall =
      (result.scores.pronunciation +
        result.scores.fluency +
        result.scores.grammar +
        result.scores.vocabulary +
        result.scores.coherence) /
      5;
    result.overall = Math.round(recomputedOverall * 100) / 100;
    result.passed = result.overall >= SCORE_SCALE.passingThreshold;
    // Ensure level matches the task
    result.level = task.level;

    return NextResponse.json(result);
  } catch (err) {
    console.error("[assess] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Assessment failed: ${message}` },
      { status: 500 },
    );
  }
}
