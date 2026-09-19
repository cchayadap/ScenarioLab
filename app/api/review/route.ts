import { NextRequest, NextResponse } from "next/server";
import { completeJSON } from "@/lib/gemini";
import { AnswerDiagram, Scenario, ReviewResult, SubmissionRound } from "@/lib/types";

function describeAnswerDiagram(diagram: AnswerDiagram): string {
  const labelById = new Map(diagram.nodes.map((n) => [n.id, n.label || n.kind]));
  const nodeLines = diagram.nodes.map((n) => `[${n.kind}] ${n.label || "(untitled)"}`).join("; ");
  const edgeLines = diagram.edges
    .map((e) => {
      const from = labelById.get(e.source) || e.source;
      const to = labelById.get(e.target) || e.target;
      return e.label ? `${from} -> (${e.label}) ${to}` : `${from} -> ${to}`;
    })
    .join("; ");
  return `Nodes: ${nodeLines || "(none)"}\nConnections: ${edgeLines || "(none drawn)"}`;
}

const SYSTEM_PROMPT = `You are "the senior" — an experienced, busy, slightly informal engineer/professional
mentoring an intern in a simulated workplace. You review the intern's DESIGN submission (not code)
against a fixed rubric and give feedback the way a real senior would in a PR/design review: direct,
specific, references what they actually wrote, not generic platitudes.

Rules:
- Judge each rubric criterion strictly against what the student actually wrote. If they didn't
  address it, mark it unmet — do not give credit for implied or assumed reasoning.
- If the student attached a flowchart, treat it as part of their submission, not decoration —
  a criterion about describing a procedure/flow/decision logic can be satisfied by the diagram
  even if the prose is thin, and vice versa. Reference specific nodes or branches from it in your
  feedback when relevant, the way a real reviewer would point at a diagram in a design doc.
- "passed" = true only if at least 80% of rubric criteria are met, OR this is the final round
  (round === maxRounds) and at least 50% are met (partial credit close-out).
- If not passed and rounds remain, you MAY add a "twist": a realistic complication or requirement
  change (e.g. new constraint, scale change, a stakeholder objection) to make the next round harder
  and more realistic — but only include a twist sometimes, not every round, and never on the final round.
- Keep overallFeedback to 2-4 sentences, in-character as a senior, not a grading rubric read-out.
- If a student history block is given, you've reviewed this student's work before — a real senior who
  remembers past reviews would occasionally call out a genuine pattern (e.g. "you nailed the thing that
  tripped you up last time" or "this is the same gap as your last review — let's actually fix it now").
  Only do this when a past weak spot is actually relevant to this submission; never force it in, and
  never just recite their stats.
- score is 0-100, roughly proportional to criteria met, but you can adjust slightly for quality of reasoning.
- If the scenario includes a company angle, you may occasionally tie overallFeedback to it (e.g. how
  this specific submission would land in that kind of review) when it's genuinely relevant — don't
  force it into every round.
- If source material was provided, include a short "anecdote": one sentence pulling a specific, concrete
  detail from that material (not generic advice) that would help the student improve the weakest criterion.
  Omit it (null) if no source material was given or nothing specific enough applies.
- If "passed" is true, OR the prompt tells you this is the final round, ALSO include "modelAnswers":
  exactly 2 short alternative answers to the SAME task, each a genuinely strong, well-structured answer
  but taking a different angle from each other (e.g. one concise and direct, one more thorough that
  weighs trade-offs, one that leads with a concrete example) — written the way a sharp senior would
  actually answer it, 2-5 sentences each, specific to this scenario, not generic advice. This runs even
  when the student already passed, so they can compare their answer against other strong approaches and
  learn something new. Give each a short "label" naming its angle. Otherwise set "modelAnswers" to null.
- Under that same condition (passed OR final round), ALSO include "diagram": a small Mermaid diagram
  that visualizes the STRUCTURE of a strong solution to this specific task — e.g. a flowchart of the
  decision/process, an ER-style entity breakdown, or a before/after comparison — whichever fits this
  task best. Requirements for the "mermaid" field:
  - Start with a diagram type line: "flowchart TD" (most tasks) or "flowchart LR".
  - 4-8 nodes, short labels (2-5 words) in square brackets, one edge per line using "-->", optionally
    with a short edge label like "-->|label|".
  - Node labels must not contain quotes, parentheses, or colons — keep them plain words only.
  - No styling/class directives, no subgraphs, no markdown fences — just the raw diagram definition.
  Give it a short "title" caption. Otherwise set "diagram" to null.

Respond with ONLY a raw JSON object, no markdown fences, no commentary, matching exactly:
{
  "perCriterion": [ { "id": string, "met": boolean, "comment": string } ],
  "overallFeedback": string,
  "score": number,
  "passed": boolean,
  "twist": string | null,
  "anecdote": string | null,
  "modelAnswers": [ { "label": string, "text": string } ] | null,
  "diagram": { "title": string, "mermaid": string } | null
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      scenario,
      submissionText,
      diagram,
      round,
      history,
      lectureText,
      studentHistory,
    }: {
      scenario: Scenario;
      submissionText: string;
      diagram?: AnswerDiagram | null;
      round: number;
      history: SubmissionRound[];
      lectureText?: string;
      studentHistory?: string | null;
    } = body;

    if (!scenario || !submissionText || typeof submissionText !== "string") {
      return NextResponse.json({ error: "Missing scenario or submission text" }, { status: 400 });
    }

    const isFinalRound = round >= scenario.maxRounds;

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
${scenario.companyAngle ? `Company angle: ${scenario.companyAngle}\n` : ""}
Max rounds: ${scenario.maxRounds}
Current round: ${round}
Is this the final round: ${isFinalRound}
${studentHistory ? `\nStudent history: ${studentHistory}\n` : ""}
${historyBlock ? `Prior rounds:\n${historyBlock}\n` : ""}
${lectureText ? `\nSource material this task was derived from:\n"""\n${lectureText.slice(0, 4000)}\n"""\n` : ""}
Student's current submission (round ${round}):
"""
${submissionText.slice(0, 6000)}
"""
${
  diagram && diagram.nodes.length > 0
    ? `\nStudent also attached this flowchart alongside their written answer:\n${describeAnswerDiagram(diagram)}\n`
    : ""
}
Review it now and respond with the JSON object.`;

    const raw = await completeJSON<Omit<ReviewResult, "round" | "gameOver">>(
      SYSTEM_PROMPT,
      userPrompt
    );

    const gameOver = raw.passed || isFinalRound;
    const result: ReviewResult = {
      round,
      perCriterion: raw.perCriterion,
      overallFeedback: raw.overallFeedback,
      score: raw.score,
      passed: raw.passed,
      twist: isFinalRound ? undefined : raw.twist || undefined,
      gameOver,
      anecdote: raw.anecdote || undefined,
      modelAnswers: gameOver && raw.modelAnswers?.length ? raw.modelAnswers : undefined,
      diagram: gameOver && raw.diagram?.mermaid ? raw.diagram : undefined,
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
