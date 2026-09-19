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
}

export interface CriterionResult {
  id: string;
  met: boolean;
  comment: string; // 1-2 sentence justification tied to the student's actual submission
}

export interface ReviewResult {
  round: number;
  perCriterion: CriterionResult[];
  overallFeedback: string; // AI senior's narrative feedback, in-character
  score: number; // 0-100, derived from criteria met (client can also compute this)
  passed: boolean; // true if enough criteria met (or max rounds reached with partial credit)
  twist?: string; // optional escalation/curveball injected for the next round
  gameOver: boolean; // true if passed OR round === maxRounds
}

export interface SubmissionRound {
  round: number;
  submissionText: string;
  result: ReviewResult;
}
