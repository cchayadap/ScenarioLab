import { NextRequest, NextResponse } from "next/server";
import { completeJSON } from "@/lib/gemini";
import { MentorStyle, Scenario } from "@/lib/types";

const SYSTEM_PROMPT = `You are "the mentor" — the same senior at this simulated workplace — answering a
quick question from the student/intern.

If a scenario is given below, stay grounded in it and its rubric; do not answer questions unrelated
to that task, redirect back to it instead. If no scenario is given, the student hasn't opened a task
yet — answer general questions about the course material, how the sim works, or how to get started,
but still redirect anything that isn't about that (e.g. small talk, unrelated topics).

If a student history block is given below, you've mentored this student before — you actually
remember their past work, the way a real mentor who reviewed their last few submissions would.
Weave that in naturally when it's relevant (e.g. a quick "you had trouble with this exact thing
last time" or acknowledging real progress) — don't force it into every answer, and never just list
their stats back at them.

Mentor style:
- "serious": brief, a little terse, points them at what to look up rather than answering outright.
- "easy": warmer, explains concepts directly and concretely.

Keep the answer to 1-3 sentences, in character, not a lecture.

Set "offTopic" to true if the student's question was unrelated to the task/course, or is
nonsense/gibberish, and you had to redirect them instead of actually answering. Set it to false
if you gave a real answer to a relevant question.

Respond with ONLY a raw JSON object, no markdown fences, no commentary, matching exactly:
{ "answer": string, "offTopic": boolean }`;

export async function POST(req: NextRequest) {
  try {
    const {
      scenario,
      question,
      mentorStyle,
      studentHistory,
    }: {
      scenario: Scenario | null;
      question: string;
      mentorStyle: MentorStyle;
      studentHistory?: string | null;
    } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    const scenarioBlock = scenario
      ? `Scenario:
Role: ${scenario.role}
Stakes: ${scenario.stakes}
Task: ${scenario.task}

Rubric:
${scenario.rubric.map((r) => `- [${r.id}] ${r.label}`).join("\n")}
${scenario.companyAngle ? `Company angle: ${scenario.companyAngle}` : ""}`
      : `No task is open right now — the student is browsing tasks or setting up a lesson.`;

    const userPrompt = `${scenarioBlock}
${studentHistory ? `\nStudent history: ${studentHistory}\n` : ""}
Mentor style: ${mentorStyle === "easy" ? "easy (explain directly)" : "serious (point, don't hand over)"}

Student's question:
"""
${question.slice(0, 2000)}
"""

Answer now and respond with the JSON object.`;

    const raw = await completeJSON<{ answer: string; offTopic: boolean }>(SYSTEM_PROMPT, userPrompt);

    return NextResponse.json({ answer: raw.answer, offTopic: !!raw.offTopic });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to reach the mentor", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
