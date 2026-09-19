// Derives "what does this mentor remember about the student" from the lesson history that's
// already persisted (lib/storage.ts) — no separate ledger, so it can never drift out of sync
// with the actual task records it's summarizing.
import { LessonSession } from "./types";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "your", "their", "have",
  "each", "when", "what", "which", "where", "about", "between", "design", "create",
  "explain", "explains", "explained", "implement", "using", "based", "student", "students",
  "task", "tasks", "identifies", "provides", "includes", "addresses", "criteria", "criterion",
  "consider", "considers", "comment", "decision", "approach", "understanding", "correctly",
  "appropriate", "appropriately", "should", "would", "could", "clearly", "properly",
]);

function keywordsFrom(...phrases: (string | undefined)[]): string[] {
  const words = phrases
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  return Array.from(new Set(words));
}

export interface WeakSpot {
  keyword: string;
  timesMissed: number;
  timesSeen: number;
  topics: string[];
  sampleComment: string;
}

export interface MasteryStats {
  tasksCompleted: number;
  tasksPassed: number;
  topics: string[]; // distinct task topics attempted, most recent first
  weakSpots: WeakSpot[]; // concepts missed 2+ times across different tasks, worst first
}

export function computeMastery(sessions: LessonSession[]): MasteryStats {
  let tasksCompleted = 0;
  let tasksPassed = 0;
  const topics: string[] = [];
  const spotMap = new Map<string, WeakSpot>();

  for (const session of sessions) {
    for (const task of session.tasks) {
      if (task.status !== "done" || task.history.length === 0) continue;
      tasksCompleted++;
      if (!topics.includes(task.topic)) topics.push(task.topic);

      const finalRound = task.history[task.history.length - 1];
      if (finalRound.result.passed) tasksPassed++;

      for (const c of finalRound.result.perCriterion) {
        const rubricItem = task.scenario?.rubric.find((r) => r.id === c.id);
        const words = keywordsFrom(c.id, rubricItem?.label, task.topic);
        for (const word of words) {
          const existing = spotMap.get(word) || {
            keyword: word,
            timesMissed: 0,
            timesSeen: 0,
            topics: [] as string[],
            sampleComment: "",
          };
          existing.timesSeen++;
          if (!c.met) {
            existing.timesMissed++;
            existing.sampleComment = c.comment;
          }
          if (!existing.topics.includes(task.topic)) existing.topics.push(task.topic);
          spotMap.set(word, existing);
        }
      }
    }
  }

  const weakSpots = Array.from(spotMap.values())
    .filter((s) => s.timesMissed >= 2)
    .sort((a, b) => b.timesMissed - a.timesMissed)
    .slice(0, 5);

  return { tasksCompleted, tasksPassed, topics, weakSpots };
}

// Compact text block handed to the AI mentor/senior prompts so they can reference real history
// instead of treating every task as the student's first. Returns null when there's nothing to say
// yet (brand new student), so callers can skip the block entirely.
export function summarizeMasteryForPrompt(stats: MasteryStats): string | null {
  if (stats.tasksCompleted === 0) return null;

  const lines = [
    `The student has completed ${stats.tasksCompleted} task(s) with you before (${stats.tasksPassed} passed).`,
  ];
  if (stats.topics.length > 0) {
    lines.push(`Topics covered so far: ${stats.topics.slice(0, 8).join(", ")}.`);
  }
  if (stats.weakSpots.length > 0) {
    const spotLines = stats.weakSpots
      .map(
        (s) =>
          `"${s.keyword}" (missed ${s.timesMissed} of ${s.timesSeen} times touched — e.g. "${s.sampleComment}")`
      )
      .join("; ");
    lines.push(
      `Recurring weak spots across past tasks — bring these up if relevant to the current one: ${spotLines}.`
    );
  }
  return lines.join(" ");
}
