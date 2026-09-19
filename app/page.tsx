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
    <main className="max-w-3xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Internship Simulator</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Paste your course material. Get dropped into a realistic intern scenario. Design a
          solution, not code — your senior will tell you if it holds up.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-bad/40 bg-bad/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {step === "setup" && (
        <section className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Subject (optional, helps framing)
            </label>
            <input
              className="w-full rounded-lg bg-panel border border-slate-700 px-3 py-2 text-sm"
              placeholder="e.g. Database Systems"
              value={subjectHint}
              onChange={(e) => setSubjectHint(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Paste syllabus text, slide content, or key topics
            </label>
            <textarea
              className="w-full h-48 rounded-lg bg-panel border border-slate-700 px-3 py-2 text-sm"
              placeholder="Paste a chunk of your lecture slides, syllabus topics, or notes here..."
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={syllabusText.trim().length < 20}
            className="rounded-lg bg-accent text-ink font-medium px-4 py-2 text-sm disabled:opacity-40"
          >
            Generate my internship scenario
          </button>
        </section>
      )}

      {step === "generating" && (
        <div className="text-slate-400 text-sm animate-pulse">
          Setting up your first day on the job...
        </div>
      )}

      {scenario && (step === "playing" || step === "reviewing" || step === "done") && (
        <section className="space-y-6">
          <ScenarioCard scenario={scenario} round={round} />

          {activeTwist && step === "playing" && (
            <div className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
              <span className="font-medium text-accent">New message from your senior: </span>
              {activeTwist}
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-3">
              {history.map((h) => (
                <FeedbackPanel key={h.round} result={h.result} />
              ))}
            </div>
          )}

          {step !== "done" && (
            <div className="space-y-2">
              <label className="block text-sm text-slate-300">
                Your design (round {round} of {scenario.maxRounds})
              </label>
              <textarea
                className="w-full h-40 rounded-lg bg-panel border border-slate-700 px-3 py-2 text-sm"
                placeholder="Describe your approach: what you'd build, key decisions, trade-offs, and how you'd explain it to a teammate who has to pick it up..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                disabled={step === "reviewing"}
              />
              <button
                onClick={handleSubmitDesign}
                disabled={submissionText.trim().length < 10 || step === "reviewing"}
                className="rounded-lg bg-accent text-ink font-medium px-4 py-2 text-sm disabled:opacity-40"
              >
                {step === "reviewing" ? "Senior is reviewing..." : "Submit to senior"}
              </button>
            </div>
          )}

          {step === "done" && latestResult && (
            <div className="rounded-lg border border-slate-700 bg-panel px-4 py-4 space-y-2">
              <h3 className="font-medium">
                {latestResult.passed ? "Design approved 🎉" : "Round limit reached"}
              </h3>
              <p className="text-sm text-slate-300">
                Final score: <span className="font-semibold">{latestResult.score}</span> / 100
              </p>
              <button
                onClick={handleRestart}
                className="mt-2 rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
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
    <div className="rounded-xl border border-slate-700 bg-panel px-5 py-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-accent">{scenario.role}</span>
        <span className="text-xs text-slate-500">
          Round {round} / {scenario.maxRounds}
        </span>
      </div>
      <h2 className="text-lg font-semibold">{scenario.title}</h2>
      <p className="text-sm text-slate-300 whitespace-pre-wrap">{scenario.stakes}</p>
      <p className="text-sm text-slate-400 italic">{scenario.task}</p>
    </div>
  );
}

function FeedbackPanel({ result }: { result: ReviewResult }) {
  return (
    <div className="rounded-xl border border-slate-700 px-5 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Round {result.round} review</span>
        <span
          className={`text-sm font-semibold ${
            result.passed ? "text-good" : "text-slate-300"
          }`}
        >
          {result.score}/100
        </span>
      </div>
      <ul className="space-y-1">
        {result.perCriterion.map((c) => (
          <li key={c.id} className="text-sm flex gap-2">
            <span className={c.met ? "text-good" : "text-bad"}>{c.met ? "✓" : "✗"}</span>
            <span className="text-slate-300">{c.comment}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-400 border-t border-slate-800 pt-2">
        {result.overallFeedback}
      </p>
    </div>
  );
}
