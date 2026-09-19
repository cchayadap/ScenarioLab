"use client";

import { useState } from "react";
import { ReviewResult, Scenario, SubmissionRound } from "@/lib/types";

export default function WorkspaceScreen({
  scenario,
  round,
  history,
  hints,
  simplifiedNotes,
  submissionText,
  onSubmissionChange,
  onSubmit,
  onRequestHint,
  onSimplify,
  submitting,
  activeTwist,
}: {
  scenario: Scenario;
  round: number;
  history: SubmissionRound[];
  hints: string[];
  simplifiedNotes: string[];
  submissionText: string;
  onSubmissionChange: (text: string) => void;
  onSubmit: () => void;
  onRequestHint: () => Promise<{ ok: true; hint: string } | { ok: false; error: string }>;
  onSimplify: () => Promise<{ ok: true; text: string } | { ok: false; error: string }>;
  submitting: boolean;
  activeTwist: string | null;
}) {
  const [showDescription, setShowDescription] = useState(true);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [simplifyLoading, setSimplifyLoading] = useState(false);
  const [simplifyError, setSimplifyError] = useState<string | null>(null);

  async function handleHint() {
    setHintLoading(true);
    setHintError(null);
    const result = await onRequestHint();
    if (!result.ok) setHintError(result.error);
    setHintLoading(false);
  }

  async function handleSimplify() {
    setSimplifyLoading(true);
    setSimplifyError(null);
    const result = await onSimplify();
    if (!result.ok) setSimplifyError(result.error);
    setSimplifyLoading(false);
  }

  return (
    <section className="space-y-6">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs text-stamp">{scenario.role}</span>
        <span className="font-mono text-xs text-inkFaint">
          round {round}/{scenario.maxRounds}
        </span>
      </div>

      <button
        onClick={() => setShowDescription((s) => !s)}
        className="font-mono text-xs text-inkFaint underline underline-offset-2"
      >
        {showDescription ? "hide task description" : "show task description"}
      </button>

      {showDescription && (
        <div className="border border-paperLine bg-panel">
          <div className="win-titlebar">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="font-mono text-[11px] text-inkFaint ml-1">
              {slugify(scenario.title)}.scenario
            </span>
          </div>
          <div className="px-5 py-4 space-y-2">
            <h3 className="font-display text-lg font-semibold">{scenario.title}</h3>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{scenario.stakes}</p>
            <p className="text-[15px] text-inkFaint italic border-t border-paperLine pt-3">
              {scenario.task}
            </p>
          </div>
        </div>
      )}

      {simplifiedNotes.map((s, i) => (
        <div key={i} className="border-l-2 border-stamp pl-3 py-1 text-[14px]">
          <span className="font-mono text-xs text-stamp block mb-0.5">in plain terms</span>
          {s}
        </div>
      ))}
      {simplifyError && <p className="text-xs text-bad">{simplifyError} — try again in a sec.</p>}

      {activeTwist && (
        <div className="border-l-2 border-stamp pl-3 py-1 text-[15px]">
          <span className="font-mono text-xs text-stamp block mb-0.5">
            message from your senior
          </span>
          {activeTwist}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-4">
          {history.map((h) => (
            <FeedbackPanel key={h.round} submissionText={h.submissionText} result={h.result} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <label className="block font-mono text-xs text-inkFaint">
          your design — round {round} of {scenario.maxRounds}
        </label>
        <textarea
          className="w-full h-40 bg-panel border border-paperLine focus:border-stamp outline-none px-3 py-2 text-[14px] font-mono"
          placeholder="Describe your approach: what you'd build, key decisions, trade-offs, and how you'd explain it to a teammate who has to pick it up..."
          value={submissionText}
          onChange={(e) => onSubmissionChange(e.target.value)}
          disabled={submitting}
        />

        {hints.map((h, i) => (
          <div key={i} className="border-l-2 border-paperLine pl-3 py-1 text-[14px] text-inkFaint">
            <span className="font-mono text-[11px] block mb-0.5">hint {i + 1}</span>
            {h}
          </div>
        ))}

        {hintError && (
          <p className="text-xs text-bad">{hintError} — try again in a sec.</p>
        )}

        <div className="flex justify-between">
          <div className="flex gap-3">
            <button
              onClick={handleSimplify}
              disabled={simplifyLoading || submitting}
              className="border border-paperLine px-4 py-2.5 text-sm hover:border-stamp disabled:opacity-30"
            >
              {simplifyLoading ? "thinking..." : "Simplify question"}
            </button>
            <button
              onClick={handleHint}
              disabled={hintLoading || submitting}
              className="border border-paperLine px-4 py-2.5 text-sm hover:border-stamp disabled:opacity-30"
            >
              {hintLoading ? "thinking..." : "Get a hint"}
            </button>
          </div>
          <button
            onClick={onSubmit}
            disabled={submissionText.trim().length < 10 || submitting}
            className="bg-stamp text-paper font-medium px-5 py-2.5 text-sm disabled:opacity-30"
          >
            {submitting ? "senior is reviewing..." : "Submit to senior"}
          </button>
        </div>
      </div>
    </section>
  );
}

function FeedbackPanel({
  submissionText,
  result,
}: {
  submissionText: string;
  result: ReviewResult;
}) {
  const [showSubmission, setShowSubmission] = useState(true);

  return (
    <div className="border border-paperLine bg-panel">
      <div className="win-titlebar justify-between">
        <div className="flex items-center gap-1.5">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="font-mono text-[11px] text-inkFaint ml-1">
            round_{result.round}.review
          </span>
        </div>
        <span className={`font-mono text-sm ${result.passed ? "text-good" : "text-ink"}`}>
          {result.score}/100
        </span>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div>
          <button
            onClick={() => setShowSubmission((s) => !s)}
            className="font-mono text-[11px] text-inkFaint underline underline-offset-2"
          >
            {showSubmission ? "hide" : "show"} your round {result.round} answer
          </button>
          {showSubmission && (
            <p className="mt-2 text-[14px] font-mono text-inkFaint whitespace-pre-wrap border-l-2 border-paperLine pl-3">
              {submissionText}
            </p>
          )}
        </div>
        <ul className="space-y-1.5 border-t border-paperLine pt-3">
          {result.perCriterion.map((c) => (
            <li key={c.id} className="text-[15px] flex gap-2">
              <span className={c.met ? "text-good" : "text-bad"}>{c.met ? "✓" : "✗"}</span>
              <span>{c.comment}</span>
            </li>
          ))}
        </ul>
        <p className="text-[15px] text-inkFaint border-t border-paperLine pt-3">
          {result.overallFeedback}
        </p>
      </div>
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
