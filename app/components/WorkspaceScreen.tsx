"use client";

import { useState } from "react";
import { ReviewResult, Scenario, SubmissionRound } from "@/lib/types";

export default function WorkspaceScreen({
  scenario,
  round,
  history,
  submissionText,
  onSubmissionChange,
  onSubmit,
  onRequestHint,
  submitting,
  activeTwist,
}: {
  scenario: Scenario;
  round: number;
  history: SubmissionRound[];
  submissionText: string;
  onSubmissionChange: (text: string) => void;
  onSubmit: () => void;
  onRequestHint: () => Promise<string>;
  submitting: boolean;
  activeTwist: string | null;
}) {
  const [showDescription, setShowDescription] = useState(true);
  const [hints, setHints] = useState<string[]>([]);
  const [hintLoading, setHintLoading] = useState(false);

  async function handleHint() {
    setHintLoading(true);
    try {
      const hint = await onRequestHint();
      setHints((h) => [...h, hint]);
    } finally {
      setHintLoading(false);
    }
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
        <div className="border border-paperLine bg-white/60 px-5 py-4 space-y-2">
          <h3 className="font-display text-lg">{scenario.title}</h3>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{scenario.stakes}</p>
          <p className="text-[15px] text-inkFaint italic border-t border-paperLine pt-3">
            {scenario.task}
          </p>
        </div>
      )}

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
            <FeedbackPanel key={h.round} result={h.result} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <label className="block font-mono text-xs text-inkFaint">
          your design — round {round} of {scenario.maxRounds}
        </label>
        <textarea
          className="w-full h-40 bg-white/60 border border-paperLine focus:border-stamp outline-none px-3 py-2 text-[15px]"
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

        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            disabled={submissionText.trim().length < 10 || submitting}
            className="bg-stamp text-paper font-medium px-5 py-2.5 text-sm disabled:opacity-30"
          >
            {submitting ? "senior is reviewing..." : "submit to senior"}
          </button>
          <button
            onClick={handleHint}
            disabled={hintLoading || submitting}
            className="border border-paperLine px-4 py-2.5 text-sm hover:border-stamp disabled:opacity-30"
          >
            {hintLoading ? "thinking..." : "get a hint"}
          </button>
        </div>
      </div>
    </section>
  );
}

function FeedbackPanel({ result }: { result: ReviewResult }) {
  return (
    <div className="border border-paperLine px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-inkFaint">round {result.round} review</span>
        <span className={`font-mono text-sm ${result.passed ? "text-good" : "text-ink"}`}>
          {result.score}/100
        </span>
      </div>
      <ul className="space-y-1.5 mb-3">
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
  );
}
