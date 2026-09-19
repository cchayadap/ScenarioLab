"use client";

import { useState } from "react";
import { Scenario, ReviewResult, SubmissionRound } from "@/lib/types";

type Step = "setup" | "generating" | "playing" | "reviewing" | "done";

export default function Home() {
  const [step, setStep] = useState<Step>("setup");
  const [syllabusText, setSyllabusText] = useState("");
  const [subjectHint, setSubjectHint] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState<SubmissionRound[]>([]);
  const [submissionText, setSubmissionText] = useState("");
  const [latestResult, setLatestResult] = useState<ReviewResult | null>(null);
  const [activeTwist, setActiveTwist] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setStep("generating");
    try {
      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabusText, subjectHint }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate scenario");
      setScenario(data.scenario);
      setRound(1);
      setHistory([]);
      setLatestResult(null);
      setActiveTwist(null);
      setSubmissionText("");
      setStep("playing");
    } catch (err) {
      setError((err as Error).message);
      setStep("setup");
    }
  }

  async function handleSubmitDesign() {
    if (!scenario || submissionText.trim().length < 10) return;
    setError(null);
    setStep("reviewing");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, submissionText, round, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to review submission");

      const result: ReviewResult = data.result;
      setLatestResult(result);
      setHistory((h) => [...h, { round, submissionText, result }]);

      if (result.gameOver) {
        setStep("done");
      } else {
        setActiveTwist(result.twist || null);
        setRound((r) => r + 1);
        setSubmissionText("");
        setStep("playing");
      }
    } catch (err) {
      setError((err as Error).message);
      setStep("playing");
    }
  }

  function handleRestart() {
    setStep("setup");
    setScenario(null);
    setSyllabusText("");
    setSubjectHint("");
    setRound(1);
    setHistory([]);
    setSubmissionText("");
    setLatestResult(null);
    setActiveTwist(null);
    setError(null);
  }

  return (
    <main className="max-w-2xl mx-auto px-5 py-14">
      <header className="mb-10 border-b border-paperLine pb-6">
        <p className="font-mono text-xs text-inkFaint mb-1">intake / new assignment</p>
        <h1 className="font-display text-[28px] leading-tight">ScenarioLab</h1>
        <p className="text-inkFaint mt-2 text-[15px] max-w-md">
          Hand over your course material. You&apos;ll be assigned an intern role and a real
          problem to plan — no code, just a design your senior will actually push back on.
        </p>
      </header>

      {error && (
        <div className="mb-6 border-l-2 border-bad pl-3 py-1 text-sm text-bad">{error}</div>
      )}

      {step === "setup" && (
        <section className="space-y-5">
          <div>
            <label className="block font-mono text-xs text-inkFaint mb-1">
              subject (optional)
            </label>
            <input
              className="w-full bg-transparent border-b border-paperLine focus:border-stamp outline-none px-1 py-2 text-[15px]"
              placeholder="Database Systems"
              value={subjectHint}
              onChange={(e) => setSubjectHint(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-inkFaint mb-1">course material</label>
            <textarea
              className="w-full h-44 bg-white/60 border border-paperLine focus:border-stamp outline-none px-3 py-2 text-[15px]"
              placeholder="Paste a chunk of your lecture slides, syllabus topics, or notes..."
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={syllabusText.trim().length < 20}
            className="bg-stamp text-paper font-medium px-5 py-2.5 text-sm disabled:opacity-30"
          >
            Assign me a scenario
          </button>
        </section>
      )}

      {step === "generating" && (
        <p className="font-mono text-sm text-inkFaint">setting up your first day...</p>
      )}

      {scenario && (step === "playing" || step === "reviewing" || step === "done") && (
        <section className="space-y-6">
          <ScenarioCard scenario={scenario} round={round} />

          {activeTwist && step === "playing" && (
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

          {step !== "done" && (
            <div className="space-y-2">
              <label className="block font-mono text-xs text-inkFaint">
                your design — round {round} of {scenario.maxRounds}
              </label>
              <textarea
                className="w-full h-40 bg-white/60 border border-paperLine focus:border-stamp outline-none px-3 py-2 text-[15px]"
                placeholder="Describe your approach: what you'd build, key decisions, trade-offs, and how you'd explain it to a teammate who has to pick it up..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                disabled={step === "reviewing"}
              />
              <button
                onClick={handleSubmitDesign}
                disabled={submissionText.trim().length < 10 || step === "reviewing"}
                className="bg-stamp text-paper font-medium px-5 py-2.5 text-sm disabled:opacity-30"
              >
                {step === "reviewing" ? "senior is reviewing..." : "submit to senior"}
              </button>
            </div>
          )}

          {step === "done" && latestResult && (
            <div className="border border-paperLine px-5 py-5 space-y-2">
              <h3 className="font-display text-lg">
                {latestResult.passed ? "Design approved" : "Round limit reached"}
              </h3>
              <p className="text-[15px] text-inkFaint">
                final score — <span className="font-mono text-ink">{latestResult.score}/100</span>
              </p>
              <button
                onClick={handleRestart}
                className="mt-2 border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-paper transition-colors"
              >
                Try another scenario
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function ScenarioCard({ scenario, round }: { scenario: Scenario; round: number }) {
  return (
    <div>
      <div className="border border-paperLine bg-white/60 px-5 pt-4 pb-5">
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <span className="font-mono text-xs text-stamp">{scenario.role}</span>
          <span className="font-mono text-xs text-inkFaint whitespace-nowrap">
            round {round}/{scenario.maxRounds}
          </span>
        </div>
        <h2 className="font-display text-xl mb-2">{scenario.title}</h2>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{scenario.stakes}</p>
        <p className="text-[15px] text-inkFaint italic mt-3 border-t border-paperLine pt-3">
          {scenario.task}
        </p>
      </div>
      <div className="ticket-edge" />
    </div>
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
