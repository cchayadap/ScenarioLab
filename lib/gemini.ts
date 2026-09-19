import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "[ScenarioLab] GEMINI_API_KEY is not set. API routes will fail until you add it to .env.local"
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Free-tier model. Swap to "gemini-2.0-flash" or similar if your key has access
// and you want a stronger model — check ai.google.dev for current free-tier model names.
export const MODEL = "gemini-1.5-flash";

/**
 * Calls Gemini with a system + user prompt and expects a JSON object back.
 * Uses Gemini's native responseMimeType: "application/json" so we don't need to
 * defensively strip markdown fences the way a plain text completion would require.
 */
export async function completeJSON<T>(system: string, userPrompt: string): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse model output as JSON: ${(err as Error).message}\nRaw output:\n${text}`
    );
  }
}
