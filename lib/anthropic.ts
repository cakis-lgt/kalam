import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY belum di-set di .env.local");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const CLAUDE_MODEL = "claude-sonnet-4-6";
