import { NextRequest, NextResponse } from "next/server";
import { completeJSON } from "@/lib/gemini";
import { Scenario, ReviewResult, SubmissionRound } from "@/lib/types";

const SYSTEM_PROMPT = `You are "the senior" — an experienced, busy, slightly informal engineer/professional
mentoring an intern in a simulated workplace. You review the intern's DESIGN submission (not code)
against a fixed rubric and give feedback the way a real senior would in a PR/design review: direct,
specific, references what they actually wrote, not generic platitudes.

Rules:
- Judge each rubric criterion strictly against what the student actually wrote. If they didn't
  address it, mark it unmet — do not give credit for implied or assumed reasoning.
- "passed" = true only if at least 80% of rubric criteria are met, OR this is the final round
  (round === maxRounds) and at least 50% are met (partial credit close-out).
- If not passed and rounds remain, you MAY add a "twist": a realistic complication or requirement
  change (e.g. new constraint, scale change, a stakeholder objection) to make the next round harder
  and more realistic — but only include a twist sometimes, not every round, and never on the final round.
- Keep overallFeedback to 2-4 sentences, in-character as a senior, not a grading rubric read-out.
- score is 0-100, roughly proportional to criteria met, but you can adjust slightly for quality of reasoning.
- If source material was provided, include a short "anecdote": one sentence pulling a specific, concrete
  detail from that material (not generic advice) that would help the student improve the weakest criterion.
  Omit it (null) if no source material was given or nothing specific enough applies.

Respond with ONLY a raw JSON object, no markdown fences, no commentary, matching exactly:
{
  "perCriterion": [ { "id": string, "met": boolean, "comment": string } ],
  "overallFeedback": string,
  "score": number,
  "passed": boolean,
  "twist": string | null,
  "anecdote": string | null
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scenario,
      submissionText,
      round,
      history,
      lectureText,
    }: {
      scenario: Scenario;
      submissionText: string;
      round: number;
      history: SubmissionRound[];
      lectureText?: string;
    } = body;

    if (!scenario || !submissionText || typeof submissionText !== "string") {
      return NextResponse.json({ error: "Missing scenario or submission text" }, { status: 400 });
    }

    const historyBlock = (history || [])
      .map(
        (h) =>
          `--- Round ${h.round} submission ---\n${h.submissionText}\n--- Round ${h.round} senior feedback ---\n${h.result.overallFeedback}${
            h.result.twist ? `\n(Twist introduced: ${h.result.twist})` : ""
          }`
      )
      .join("\n\n");

    const userPrompt = `Scenario:
Role: ${scenario.role}
Title: ${scenario.title}
Stakes: ${scenario.stakes}
Task: ${scenario.task}

Rubric:
${scenario.rubric.map((r) => `- [${r.id}] ${r.label} (from: ${r.sourceRef || "material"})`).join("\n")}

Max rounds: ${scenario.maxRounds}
Current round: ${round}

${historyBlock ? `Prior rounds:\n${historyBlock}\n` : ""}
${lectureText ? `\nSource material this task was derived from:\n"""\n${lectureText.slice(0, 4000)}\n"""\n` : ""}
Student's current submission (round ${round}):
"""
${submissionText.slice(0, 6000)}
"""

Review it now and respond with the JSON object.`;

    const raw = await completeJSON<Omit<ReviewResult, "round" | "gameOver">>(
      SYSTEM_PROMPT,
      userPrompt
    );

    const isFinalRound = round >= scenario.maxRounds;
    const result: ReviewResult = {
      round,
      perCriterion: raw.perCriterion,
      overallFeedback: raw.overallFeedback,
      score: raw.score,
      passed: raw.passed,
      twist: isFinalRound ? undefined : raw.twist || undefined,
      gameOver: raw.passed || isFinalRound,
      anecdote: raw.anecdote || undefined,
    };

    return NextResponse.json({ result });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to review submission", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
