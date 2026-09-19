import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  // Don't throw at import time in dev — surface a clear error when actually called instead.
  console.warn(
    "[edtech-sim] ANTHROPIC_API_KEY is not set. API routes will fail until you add it to .env.local"
  );
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = "claude-sonnet-4-5"; // swap for whichever current model your API key has access to

/**
 * Calls the model with a system + user prompt and expects a raw JSON object back.
 * Strips markdown code fences defensively, since models sometimes wrap JSON in ```json blocks
 * even when told not to.
 */
export async function completeJSON<T>(system: string, userPrompt: string): Promise<T> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content returned from model");
  }

  const cleaned = textBlock.text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse model output as JSON: ${(err as Error).message}\nRaw output:\n${cleaned}`
    );
  }
}
