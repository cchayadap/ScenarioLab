import { NextRequest, NextResponse } from "next/server";
import { completeJSON } from "@/lib/gemini";
import { MentorStyle, Scenario } from "@/lib/types";

const SYSTEM_PROMPT = `You are "the mentor" — the same senior who assigned this task — answering a quick
question from the student. Stay grounded in the scenario and rubric below; do not answer questions
unrelated to this task, redirect back to it instead.

Mentor style:
- "serious": brief, a little terse, points them at what to look up rather than answering outright.
- "easy": warmer, explains concepts directly and concretely.

Keep the answer to 1-3 sentences, in character, not a lecture.

Respond with ONLY a raw JSON object, no markdown fences, no commentary, matching exactly:
{ "answer": string }`;

export async function POST(req: NextRequest) {
  try {
    const {
      scenario,
      question,
      mentorStyle,
    }: {
      scenario: Scenario;
      question: string;
      mentorStyle: MentorStyle;
    } = await req.json();

    if (!scenario || !question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing scenario or question" }, { status: 400 });
    }

    const userPrompt = `Scenario:
Role: ${scenario.role}
Stakes: ${scenario.stakes}
Task: ${scenario.task}

Rubric:
${scenario.rubric.map((r) => `- [${r.id}] ${r.label}`).join("\n")}

Mentor style: ${mentorStyle === "easy" ? "easy (explain directly)" : "serious (point, don't hand over)"}

Student's question:
"""
${question.slice(0, 2000)}
"""

Answer now and respond with the JSON object.`;

    const raw = await completeJSON<{ answer: string }>(SYSTEM_PROMPT, userPrompt);

    return NextResponse.json({ answer: raw.answer });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to reach the mentor", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
