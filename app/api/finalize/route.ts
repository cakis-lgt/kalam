import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAiScoringEnabled } from "@/lib/ai/config";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/anthropic";
import { buildFinalSummaryPrompt } from "@/lib/cefr/prompt";
import type { ScoreDimensions, CEFRLevel } from "@/types";
import { CEFR_LEVELS, type CEFRLevelEnum } from "@/types";
import { clientIp, enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const AttemptSchema = z.object({
  taskLevel: z.enum(CEFR_LEVELS as unknown as CEFRLevelEnum),
  taskFormat: z.string(),
  overall: z.number(),
  passed: z.boolean(),
  scores: z.object({
    pronunciation: z.number(),
    fluency: z.number(),
    grammar: z.number(),
    vocabulary: z.number(),
    coherence: z.number(),
  }),
  feedback_id: z.string(),
});

const FinalizeSchema = z.object({
  finalLevel: z.enum(CEFR_LEVELS as unknown as CEFRLevelEnum),
  attempts: z.array(AttemptSchema),
});

const SummarySchema = z.object({
  summary_id: z.string(),
  recommendations_id: z.array(z.string()),
});

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

function averageScores(
  attempts: z.infer<typeof FinalizeSchema>["attempts"],
): ScoreDimensions {
  if (attempts.length === 0) {
    return {
      pronunciation: 0,
      fluency: 0,
      grammar: 0,
      vocabulary: 0,
      coherence: 0,
    };
  }
  const sum = attempts.reduce(
    (acc, a) => ({
      pronunciation: acc.pronunciation + a.scores.pronunciation,
      fluency: acc.fluency + a.scores.fluency,
      grammar: acc.grammar + a.scores.grammar,
      vocabulary: acc.vocabulary + a.scores.vocabulary,
      coherence: acc.coherence + a.scores.coherence,
    }),
    { pronunciation: 0, fluency: 0, grammar: 0, vocabulary: 0, coherence: 0 },
  );
  const n = attempts.length;
  return {
    pronunciation: Math.round((sum.pronunciation / n) * 100) / 100,
    fluency: Math.round((sum.fluency / n) * 100) / 100,
    grammar: Math.round((sum.grammar / n) * 100) / 100,
    vocabulary: Math.round((sum.vocabulary / n) * 100) / 100,
    coherence: Math.round((sum.coherence / n) * 100) / 100,
  };
}

export async function POST(req: NextRequest) {
  try {
    // Claude summary is billable — cap per client.
    const limited = enforceRateLimit(`finalize:${clientIp(req)}`, {
      limit: 10,
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
    const parsed = FinalizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Request body invalid", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { finalLevel, attempts } = parsed.data;
    const avg = averageScores(attempts);
    const overallScore =
      (avg.pronunciation +
        avg.fluency +
        avg.grammar +
        avg.vocabulary +
        avg.coherence) /
      5;

    const attemptsSummary = attempts
      .map(
        (a, i) =>
          `Task ${i + 1} (level ${a.taskLevel}, format ${a.taskFormat}): overall ${a.overall.toFixed(2)} — ${
            a.passed ? "LULUS" : "TIDAK LULUS"
          }. Feedback: ${a.feedback_id}`,
      )
      .join("\n");

    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: buildFinalSummaryPrompt(finalLevel, attemptsSummary),
        },
      ],
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
      return NextResponse.json(
        { error: "Claude response is not valid JSON", raw: rawJson },
        { status: 502 },
      );
    }

    const validated = SummarySchema.safeParse(parsedJson);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Claude response does not match schema",
          details: validated.error.issues,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      finalLevel: finalLevel as CEFRLevel,
      averageScores: avg,
      overallScore: Math.round(overallScore * 100) / 100,
      summary_id: validated.data.summary_id,
      recommendations_id: validated.data.recommendations_id,
    });
  } catch (err) {
    console.error("[finalize] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Finalize failed: ${message}` },
      { status: 500 },
    );
  }
}
