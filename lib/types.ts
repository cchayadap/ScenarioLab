// Core data shapes shared between the client game UI and the two API routes.

export interface RubricCriterion {
  id: string; // short stable id, e.g. "normalization"
  label: string; // human-readable criterion, e.g. "Explains a normalization decision"
  sourceRef?: string; // which part of the syllabus this was derived from (for transparency)
}

export interface Scenario {
  role: string; // e.g. "Database Intern"
  title: string; // short scenario title
  stakes: string; // 1-3 sentence "here's the situation" framing
  task: string; // what the student must design/plan
  rubric: RubricCriterion[]; // 3-5 checkable criteria derived from the syllabus material
  maxRounds: number; // hard cap on feedback loop rounds (default 3)
  companyAngle?: string; // 1 sentence tying this task to what the student's target company actually cares about
}

export interface CriterionResult {
  id: string;
  met: boolean;
  comment: string; // 1-2 sentence justification tied to the student's actual submission
}

export interface ModelAnswer {
  label: string; // short descriptor of the approach, e.g. "concise & direct"
  text: string; // the example answer itself
}

export interface ReviewDiagram {
  title: string; // short caption, e.g. "A normalized schema for this fix"
  mermaid: string; // Mermaid diagram definition, e.g. "flowchart TD\nA[...] --> B[...]"
}

export interface ReviewResult {
  round: number;
  perCriterion: CriterionResult[];
  overallFeedback: string; // AI senior's narrative feedback, in-character
  score: number; // 0-100, derived from criteria met (client can also compute this)
  passed: boolean; // true if enough criteria met (or max rounds reached with partial credit)
  twist?: string; // optional escalation/curveball injected for the next round
  gameOver: boolean; // true if passed OR round === maxRounds
  anecdote?: string; // short related note pulled from the source material to help them improve
  modelAnswers?: ModelAnswer[]; // alternate strong answers shown at gameOver, for comparison even after passing
  diagram?: ReviewDiagram; // visual of a strong solution's structure, shown alongside modelAnswers at gameOver
}

export interface SubmissionRound {
  round: number;
  submissionText: string;
  result: ReviewResult;
}

// --- Redesign additions: onboarding, lecture breakdown, tasks, mentor ---

export type MentorStyle = "easy" | "serious";

export interface Profile {
  name: string;
  mentorStyle: MentorStyle;
  aspiringCompany: string; // free text, e.g. "big tech", "a research lab"
}

export interface TaskSummary {
  id: string; // stable slug, e.g. "normalization"
  topic: string; // short topic name shown on the folder icon
  description: string; // one-line description of what the task covers
  sourceRef?: string; // which part of the lecture this was derived from
}

export interface TaskState {
  id: string;
  topic: string;
  description: string;
  sourceRef?: string;
  scenario?: Scenario; // generated lazily the first time the task is opened
  round: number;
  history: SubmissionRound[];
  hintsUsed: number;
  hints: string[]; // accumulated across the whole task, not per round — persists across rounds
  simplifiedNotes: string[]; // accumulated "simplify this" explanations, same reasoning
  status: "not-started" | "in-progress" | "done";
}

export interface LessonSession {
  id: string;
  createdAt: string; // ISO timestamp
  subjectHint?: string;
  lectureText: string;
  tasks: TaskState[];
}
