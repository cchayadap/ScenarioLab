"use client";

import { useState } from "react";
import { MentorStyle, Scenario } from "@/lib/types";
import { MENTOR_INFO } from "@/lib/mentor";

interface ChatTurn {
  question: string;
  answer: string;
}

export default function MentorWidget({
  scenario,
  mentorStyle,
}: {
  scenario: Scenario;
  mentorStyle: MentorStyle;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [asking, setAsking] = useState(false);
  const mentor = MENTOR_INFO[mentorStyle];

  async function handleAsk() {
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true);
    setQuestion("");
    try {
      const res = await fetch("/api/ask-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario, question: q, mentorStyle }),
      });
      const data = await res.json();
      const answer = res.ok ? data.answer : "Couldn't reach the mentor — try again in a sec.";
      setTurns((t) => [...t, { question: q, answer }]);
    } catch {
      setTurns((t) => [...t, { question: q, answer: "Couldn't reach the mentor — try again in a sec." }]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 max-h-96 flex flex-col border border-paperLine bg-panel shadow-lg">
          <div className="win-titlebar justify-between">
            <div className="flex items-center gap-1.5">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <span className="font-mono text-[11px] text-inkFaint">mentor.chat</span>
          </div>
          <div className="px-4 py-2.5 border-b border-paperLine flex items-center gap-2">
            <span className="text-lg leading-none">{mentor.emoji}</span>
            <div className="leading-tight">
              <p className="text-sm font-medium">{mentor.name}</p>
              <p className="font-mono text-[11px] text-inkFaint">{mentor.blurb}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[80px]">
            {turns.length === 0 && (
              <p className="text-[13px] text-inkFaint">
                Ask about the task — {mentor.name} stays on topic.
              </p>
            )}
            {turns.map((t, i) => (
              <div key={i} className="space-y-1">
                <p className="text-[13px] text-inkFaint">you: {t.question}</p>
                <p className="text-[14px]">{t.answer}</p>
              </div>
            ))}
            {asking && <p className="text-[13px] text-inkFaint font-mono">thinking...</p>}
          </div>
          <div className="border-t border-paperLine p-2 flex gap-2">
            <input
              className="flex-1 bg-transparent outline-none text-[14px] px-2 py-1.5"
              placeholder="ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              disabled={asking}
            />
            <button
              onClick={handleAsk}
              disabled={asking || !question.trim()}
              className="bg-stamp text-paper text-xs font-medium px-3 py-1.5 disabled:opacity-30"
            >
              ask
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-full bg-stamp text-paper text-xl flex items-center justify-center shadow-lg"
        aria-label="Ask your mentor"
      >
        {mentor.emoji}
      </button>
    </div>
  );
}
