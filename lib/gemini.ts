import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "[ScenarioLab] GEMINI_API_KEY is not set. API routes will fail until you add it to .env.local"
  );
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// gemini-2.5-flash was cut off for new API keys; gemini-3.6-flash is the current
// equivalent free/standard-tier model. Check ai.google.dev for current model names.
export const MODEL = "gemini-3.6-flash";

/**
 * Calls Gemini with a system + user prompt and expects a JSON object back.
 * Uses Gemini's native responseMimeType: "application/json" so we don't need to
 * defensively strip markdown fences the way a plain text completion would require.
 */
export async function completeJSON<T>(system: string, userPrompt: string): Promise<T> {
  const result = await genAI.models.generateContent({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
    },
  });

  const text = result.text ?? "";

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse model output as JSON: ${(err as Error).message}\nRaw output:\n${text}`
    );
  }
}
