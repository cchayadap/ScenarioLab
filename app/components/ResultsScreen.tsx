"use client";

import { useState } from "react";
import { ReviewResult, Scenario } from "@/lib/types";
import MermaidDiagram from "./MermaidDiagram";

export default function ResultsScreen({
  scenario,
  submissionText,
  result,
  gameOver,
  onContinue,
}: {
  scenario: Scenario;
  submissionText: string;
  result: ReviewResult;
  gameOver: boolean;
  onContinue: () => void;
}) {
  const [openReasoning, setOpenReasoning] = useState<string | null>(null);
  const [showSubmission, setShowSubmission] = useState(true);

  return (
    <section className="space-y-6">
      <div className="border border-paperLine bg-panel">
        <div className="win-titlebar">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span className="font-mono text-[11px] text-inkFaint ml-1">results.log</span>
        </div>
        <div className="px-5 py-5 space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-lg font-semibold">
            {result.passed ? "Design approved" : gameOver ? "Round limit reached" : "Needs another pass"}
          </h3>
          <span
            className={`font-mono text-sm ${result.passed ? "text-good" : "text-ink"}`}
          >
            {result.score}/100
          </span>
        </div>

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

        <ul className="space-y-2 border-t border-paperLine pt-3">
          {result.perCriterion.map((c) => {
            const rubricItem = scenario.rubric.find((r) => r.id === c.id);
            const isOpen = openReasoning === c.id;
            return (
              <li key={c.id} className="border-t border-paperLine pt-2 first:border-t-0 first:pt-0">
                <button
                  onClick={() => setOpenReasoning(isOpen ? null : c.id)}
                  className="w-full text-left flex gap-2 text-[15px]"
                >
                  <span className={c.met ? "text-good" : "text-bad"}>{c.met ? "✓" : "✗"}</span>
                  <span className="flex-1">{rubricItem?.label || c.id}</span>
                  <span className="font-mono text-xs text-inkFaint">{isOpen ? "hide" : "why"}</span>
                </button>
                {isOpen && (
                  <div className="mt-2 ml-6 text-[14px] text-inkFaint space-y-1">
                    <p>{c.comment}</p>
                    {rubricItem?.sourceRef && (
                      <p className="font-mono text-[11px]">from your material: {rubricItem.sourceRef}</p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <p className="text-[15px] text-inkFaint border-t border-paperLine pt-3">
          {result.overallFeedback}
        </p>

        {result.anecdote && (
          <div className="border-l-2 border-stamp pl-3 py-1 text-[14px]">
            <span className="font-mono text-xs text-stamp block mb-0.5">from your material</span>
            {result.anecdote}
          </div>
        )}

        {gameOver && result.diagram && (
          <div className="border-t border-paperLine pt-3">
            <div className="border border-paperLine bg-paper p-3">
              <MermaidDiagram definition={result.diagram.mermaid} title={result.diagram.title} />
            </div>
          </div>
        )}

        {gameOver && result.modelAnswers && result.modelAnswers.length > 0 && (
          <div className="space-y-2 border-t border-paperLine pt-3">
            <p className="font-mono text-xs text-inkFaint">
              other strong answers, for comparison
            </p>
            <div className="space-y-3">
              {result.modelAnswers.map((m, i) => (
                <div key={i} className="border border-paperLine bg-paper p-3 space-y-1">
                  <p className="font-mono text-[11px] text-stamp uppercase tracking-wide">
                    {m.label}
                  </p>
                  <p className="text-[14px] text-inkFaint leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      <button
        onClick={onContinue}
        className="bg-stamp text-paper font-medium px-5 py-2.5 text-sm"
      >
        {gameOver ? "back to tasks" : "next round"}
      </button>
    </section>
  );
}
