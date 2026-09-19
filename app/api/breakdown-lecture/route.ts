import { NextRequest, NextResponse } from "next/server";
import { completeJSON } from "@/lib/gemini";
import { TaskSummary } from "@/lib/types";

const SYSTEM_PROMPT = `You break a chunk of course material (lecture slides, syllabus excerpt, notes) into a
short list of distinct internship-style TASKS a student could later be assigned, one per topic.

Rules:
- Merge related topics into as few tasks as reasonably works. Prefer several focused tasks over one
  overloaded task or many tiny fragmented ones — each task should be substantial enough to design a
  real solution around, but not so broad it covers the whole material at once.
- Produce between 2 and 5 tasks depending on how much distinct material is actually here.
- Each task's "description" is one plain sentence describing what the task will cover — not the full
  scenario yet, just enough for a student to pick which folder to open.
- "sourceRef" names the specific part of the material the task draws from (e.g. a slide topic or section).
- "id" is a short, stable, lowercase-hyphenated slug derived from the topic (e.g. "normalization-forms").

Respond with ONLY a raw JSON object, no markdown fences, no commentary, matching exactly:
{ "tasks": [ { "id": string, "topic": string, "description": string, "sourceRef": string } ] }`;

export async function POST(req: NextRequest) {
  try {
    const { lectureText, subjectHint } = await req.json();

    if (!lectureText || typeof lectureText !== "string" || lectureText.trim().length < 20) {
      return NextResponse.json(
        { error: "Please paste at least a few sentences of course material." },
        { status: 400 }
      );
    }

    const userPrompt = `Course material provided by the student${
      subjectHint ? ` (subject: ${subjectHint})` : ""
    }:
"""
${lectureText.slice(0, 8000)}
"""

Break this into tasks now and respond with the JSON object.`;

    const raw = await completeJSON<{ tasks: TaskSummary[] }>(SYSTEM_PROMPT, userPrompt);

    if (!raw.tasks || raw.tasks.length === 0) {
      throw new Error("Model returned no tasks");
    }

    return NextResponse.json({ tasks: raw.tasks });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to break lecture into tasks", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
