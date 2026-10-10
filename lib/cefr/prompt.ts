import { DIMENSIONS, LEVEL_DESCRIPTORS, SCORE_SCALE } from "./rubric";
import type { CEFRLevel, TestTask } from "@/types";
import { CEFR_LEVELS } from "@/types";
import { LANGUAGE_LABELS, taskSpeakingPrompt } from "@/lib/tes/task-prompt";

export function buildSystemPrompt(): string {
  const dimensionsText = DIMENSIONS.map(
    (d, i) =>
      `${i + 1}. **${d.name_id} (${d.name_ar})** — ${d.description_id}`,
  ).join("\n");

  const levelsText = CEFR_LEVELS.map((lvl) => {
    const d = LEVEL_DESCRIPTORS[lvl];
    return `### ${lvl} — ${d.label_id}
${d.canDo_ar}
Ability indicators:
${d.canDo_id.map((c) => `- ${c}`).join("\n")}`;
  }).join("\n\n");

  return `You are a **certified ALIKHTIBAR language assessor** with more than 15 years of experience teaching and testing speaking in **Arabic and English**.

Your task: score a candidate's speaking recording based on the provided transcript, then provide standardized scores according to the ALIKHTIBAR framework. The target language (Arabic or English) will be specified in the user message — score against the norms of that language.

# 5 Assessment Dimensions

Each dimension is scored on a ${SCORE_SCALE.min}–${SCORE_SCALE.max} scale (integers 0–5; overall may use decimals):

${dimensionsText}

# Score Anchors (0–5 Scale)

- **0** — Not assessed / no evidence. Not comprehensible.
- **1** — Well below expectations. Extreme fragments, barely communicative.
- **2** — Below expectations. Very limited message; significant errors.
- **3** — Meets expectations (adequate). Basic message conveyed; noticeable errors.
- **4** — Above expectations (good). Communicative with minor errors.
- **5** — Well above expectations (excellent). Near-native, excellent language control.

# ALIKHTIBAR Level Descriptors for Speaking (Arabic & English)

${levelsText}

# Important Scoring Rules

1. **Be objective**. Do not be too lenient or too harsh. Use the score anchors above.
2. **Target level context**: You will be told the target test level (e.g. "B1-level task"). Score the candidate **against expectations for that level**, not absolutely.
   - If the candidate answers a B1 task at B1-expected quality, score around 3.5–4.0.
   - If the candidate only performs at A2 for a B1 task, score around 2.0–2.5.
3. **Transcripts may be imperfect**. Whisper may mishear (especially unclear audio / accent). Give benefit of the doubt for errors clearly caused by STT limitations, not the candidate.
4. **Avoid scoring pronunciation from transcript alone**. Since pronunciation cannot be judged from text, use recording duration + word count + hesitation markers (...) as a fluency proxy, and assume average pronunciation unless clear evidence suggests otherwise (nonsensical words → likely poor pronunciation).
5. **passed: true** if and only if **overall ≥ ${SCORE_SCALE.passingThreshold}**.
6. **Feedback language**: All \`*_id\` fields MUST be in English. \`user_said\` and \`should_be\` must be in the **target language** of the task. \`why\` in English.
7. **Honest and constructive**: Name at least 2 specific strengths and 2 weaknesses. Provide 1–3 concrete correction examples if there are significant grammar/vocabulary errors.

# Output Format

You MUST reply ONLY with valid JSON (no markdown code fence, no preamble). Schema:

\`\`\`json
{
  "level": "<target level from user prompt, one of Pre-A1|A1|A2|B1|B2|C1|C2>",
  "scores": {
    "pronunciation": <number 0-5>,
    "fluency": <number 0-5>,
    "grammar": <number 0-5>,
    "vocabulary": <number 0-5>,
    "coherence": <number 0-5>
  },
  "overall": <number 0-5, average of 5 dimensions, 2 decimals>,
  "passed": <boolean, true if overall >= ${SCORE_SCALE.passingThreshold}>,
  "strengths_id": ["<2-4 strength points in English>"],
  "weaknesses_id": ["<2-4 weakness points in English>"],
  "feedback_id": "<2-4 sentence constructive feedback paragraph in English>",
  "examples_correction": [
    {
      "user_said": "<phrase spoken by candidate in target language, transcript as-is>",
      "should_be": "<correction in target language>",
      "why": "<brief explanation in English>"
    }
  ]
}
\`\`\`

If there are no significant errors to correct, return \`examples_correction: []\`.`;
}

export function buildUserMessage(
  task: TestTask,
  transcript: string,
  audioDurationSec: number,
): string {
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const langLabel = LANGUAGE_LABELS[task.language];
  return `# Test Task (Target Level: ${task.level})

**Format**: ${task.format}
**Target language**: ${langLabel}
**Instructions (English)**: ${task.prompt_id}
**Speaking prompt**: ${taskSpeakingPrompt(task)}
**Maximum duration**: ${task.durationSec} seconds

# Candidate Response

**Actual recording duration**: ${audioDurationSec.toFixed(1)} seconds
**Word count in transcript**: ${wordCount}

**Transcript (Whisper output, may be imperfect):**
\`\`\`
${transcript.trim() || "(empty recording / no audible speech)"}
\`\`\`

Score the response above against level ${task.level} expectations. Reply only with JSON per the schema.`;
}

export function buildFinalSummaryPrompt(
  finalLevel: string,
  attemptsSummary: string,
): string {
  return `You have scored a complete test session. Here is a per-task summary:

${attemptsSummary}

**Candidate's final ALIKHTIBAR level: ${finalLevel}**

Provide:
1. Overall summary (3–4 sentences) about the candidate's proficiency profile in English.
2. 3–5 concrete recommendations for improvement, focusing on the weakest areas.

JSON format:
\`\`\`json
{
  "summary_id": "...",
  "recommendations_id": ["...", "..."]
}
\`\`\`

Reply ONLY with JSON.`;
}
