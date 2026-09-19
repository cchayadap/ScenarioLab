import { NextRequest, NextResponse } from "next/server";
import { completeJSON } from "@/lib/gemini";
import { MentorStyle, Scenario } from "@/lib/types";

const SYSTEM_PROMPT = `You are "the mentor" — the same senior reviewing this student's work — giving a single
hint on request, not a review. You are told how many hints the student has already asked for this round;
each one should feel like a bigger nudge than the last.

Mentor style controls how direct you are:
- "serious": don't just hand over the answer. Point at which rubric criterion is weakest and what topic
  or concept they should go re-read, but make them do the reasoning themselves.
- "easy": explain the relevant concept directly and suggest concretely how it applies here.

Base the hint on what the student has actually written so far (praise nothing, just orient them) — if
they've written nothing yet, hint at where to start instead.

Respond with ONLY a raw JSON object, no markdown fences, no commentary, matching exactly:
{ "hint": string }`;

export async function POST(req: NextRequest) {
  try {
    const {
      scenario,
      submissionText,
      hintsUsed,
      mentorStyle,
    }: {
      scenario: Scenario;
      submissionText: string;
      hintsUsed: number;
      mentorStyle: MentorStyle;
    } = await req.json();

    if (!scenario) {
      return NextResponse.json({ error: "Missing scenario" }, { status: 400 });
    }

    const userPrompt = `Scenario:
Role: ${scenario.role}
Task: ${scenario.task}

Rubric:
${scenario.rubric.map((r) => `- [${r.id}] ${r.label}`).join("\n")}

Mentor style: ${mentorStyle === "easy" ? "easy (explain directly)" : "serious (point, don't hand over)"}
Hints already given this round: ${hintsUsed || 0}

Student's draft so far${submissionText?.trim() ? "" : " (nothing written yet)"}:
"""
${(submissionText || "").slice(0, 4000)}
"""

Give the next hint now and respond with the JSON object.`;

    const raw = await completeJSON<{ hint: string }>(SYSTEM_PROMPT, userPrompt);

    return NextResponse.json({ hint: raw.hint });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate hint", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
