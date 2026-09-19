# Internship Simulator (hackathon prototype)

Paste course material (syllabus, slides, notes) → get dropped into a realistic
internship scenario in a relevant role → design a solution (no code required) →
an AI "senior" reviews your design against a rubric derived from the material →
loop until it passes or you hit the round cap.

## Setup

```bash
npm install
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000

You need an Anthropic API key (console.anthropic.com) with access to a Claude
model. The model string is set in `lib/anthropic.ts` — change `MODEL` if your
key doesn't have access to `claude-sonnet-4-5`.

## Architecture

```
app/
  page.tsx                     <- client-side game state machine (setup -> playing -> reviewing -> done)
  api/generate-scenario/route.ts  <- syllabus text -> {role, stakes, task, rubric}
  api/review/route.ts             <- submission + rubric + history -> per-criterion verdict + score + twist
lib/
  anthropic.ts                 <- Claude API wrapper, JSON-only completion helper
  types.ts                     <- shared Scenario / ReviewResult / SubmissionRound types
```

**Why two separate API calls instead of one:** scenario generation happens once
per game; review happens once per round. Keeping them separate means the rubric
is generated fresh from the syllabus (grounded in what the student actually gave
us) and then held fixed for the whole game — the senior grades against the same
rubric every round, so feedback is consistent across rounds instead of drifting.

**Where the "game" feel comes from:**
- Rubric checklist per round (✓/✗ with a specific comment, not a generic score)
- Round cap (`scenario.maxRounds`, default 3) with a hard game-over condition
- Optional "twist" the senior can inject between rounds — a requirement change
  or curveball, generated from the same conversation history, so round 2/3 can
  escalate rather than just re-grading the same static ask

**Grading logic** lives entirely in the `review` route's system prompt (see the
comment there for the pass/fail thresholds) — tune this first if the senior feels
too lenient or too harsh in testing. Test it against at least one deliberately
bad and one deliberately strong submission before your demo.

## Known limitations / things we cut for hackathon scope

- No file upload parsing (PDF/PPTX) — students paste text directly. Adding a
  parser (e.g. `pdf-parse` or a slides-to-text step) is the natural next feature.
- No persistence — refreshing the page loses your run. Fine for a live demo,
  not fine for a real product; would need a DB (or just localStorage first).
- Rubric criteria are generated per-scenario by the model, not curated by humans
  — good enough for a demo, but for real use you'd want subject-matter review
  of a bank of rubrics rather than trusting fully automatic generation.
- Currently scoped to STEM subjects — the scenario-generation prompt assumes
  fairly technical material; non-STEM course material may produce weaker scenarios.

## Suggested demo script (~90 sec)

1. Paste a real snippet from your Database Systems slides. Generate scenario.
2. Show the scenario card (role + informal, slightly ambiguous "manager ask").
3. Submit a deliberately incomplete first design.
4. Show the senior's feedback: some ✓, some ✗, a specific critique, plus a twist.
5. Submit a stronger revised design incorporating the twist. Show it pass.
6. Close on the score / "design approved" screen.
