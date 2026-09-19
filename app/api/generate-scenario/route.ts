import { NextRequest, NextResponse } from "next/server";
import { completeJSON } from "@/lib/anthropic";
import { Scenario } from "@/lib/types";

const SYSTEM_PROMPT = `You design realistic internship-style scenarios for a STEM education app.

Given course material (a syllabus excerpt, slide text, or topic list) from a student's class,
you produce ONE scenario that puts the student in an internship role where they must DESIGN
a solution to a problem grounded in that material — they do NOT write or run code, only plan,
explain trade-offs, and describe a procedure in enough detail that someone else could implement it.

You also produce a rubric: 3 to 5 specific, checkable criteria that a good design response would
satisfy, each one clearly derived from a concept in the provided material. Do not invent criteria
unrelated to the material given.

Respond with ONLY a raw JSON object, no markdown fences, no commentary, matching exactly this shape:
{
  "role": string,          // realistic intern job title relevant to the material
  "title": string,         // short scenario title, punchy, <8 words
  "stakes": string,        // 2-4 sentences: the situation, written like a Slack message or ticket from a manager, informal and slightly ambiguous like a real workplace ask
  "task": string,          // 1-2 sentences: exactly what the student must produce (a design, a schema, a plan, a set of trade-offs) — explicit that no code is required
  "rubric": [ { "id": string, "label": string, "sourceRef": string } ],  // 3-5 items
  "maxRounds": 3
}`;

export async function POST(req: NextRequest) {
  try {
    const { syllabusText, subjectHint } = await req.json();

    if (!syllabusText || typeof syllabusText !== "string" || syllabusText.trim().length < 20) {
      return NextResponse.json(
        { error: "Please paste at least a few sentences of course material." },
        { status: 400 }
      );
    }

    const userPrompt = `Course material provided by the student${
      subjectHint ? ` (subject: ${subjectHint})` : ""
    }:
"""
${syllabusText.slice(0, 8000)}
"""

Generate the scenario JSON now.`;

    const scenario = await completeJSON<Scenario>(SYSTEM_PROMPT, userPrompt);

    // Defensive defaults in case the model omits something.
    scenario.maxRounds = scenario.maxRounds && scenario.maxRounds > 0 ? scenario.maxRounds : 3;

    return NextResponse.json({ scenario });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate scenario", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
